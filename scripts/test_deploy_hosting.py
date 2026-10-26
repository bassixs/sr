"""Safety regression tests. In-memory server only; no network or credentials."""

import io
import pathlib
import tarfile
import tempfile
import unittest
from unittest.mock import patch
import xml.etree.ElementTree as ET

from deploy_hosting import ACCOUNT, Deployer, MARKER, SITE, PanelTransport, SafetyError, child, digest, main


class FakePanel:
    def __init__(self):
        self.directories = {'/', '/www', SITE, SITE + '/assets'}
        self.files = {SITE + '/index.html': b'old index', SITE + '/.htaccess': b'old rules',
                      SITE + '/assets/old.js': b'old JS', SITE + '/assets/style.css': b'old CSS'}
        self.links = set()
        self.calls = []
        self.archive_mode = 'ok'
        self.before_delete = None

    def send(self, func, params, data=None):
        self.calls.append((func, dict(params)))
        parent = params['plid']
        name = params.get('elid')
        if func == 'file':
            document = ET.Element('doc')
            for path in sorted(self.directories | self.files.keys() | self.links):
                if path != '/' and str(pathlib.PurePosixPath(path).parent) == parent:
                    element = ET.SubElement(document, 'elem')
                    ET.SubElement(element, 'name').text = pathlib.PurePosixPath(path).name
                    ET.SubElement(element, 'type').text = ('linkdir' if path in self.links else 'dir'
                        if path in self.directories else 'image' if path.endswith('.png')
                        else 'archive' if path.endswith('.tgz') else 'file')
            return document
        if func == 'file.download':
            return self.files[child(parent, name)]
        if func == 'file.new':
            self.directories.add(child(parent, params['name']))
        elif func == 'file.upload':
            self.files[child(parent, params['filename'])] = data
        elif func == 'file.copyto':
            destination = bytes.fromhex(params['dirlist']).decode()
            source, target = child(parent, name), child(destination, name)
            if source in self.directories:
                for directory in list(self.directories):
                    if directory == source or directory.startswith(source + '/'):
                        self.directories.add(target + directory[len(source):])
                for path, content in list(self.files.items()):
                    if path.startswith(source + '/'):
                        self.files[target + path[len(source):]] = content
            else:
                self.files[target] = self.files[source]
                if params['move'] == 'on':
                    del self.files[source]
        elif func == 'file.pack':
            buffer = io.BytesIO()
            with tarfile.open(fileobj=buffer, mode='w:gz') as tar:
                for path, content in self.files.items():
                    prefix = parent + '/star40.ru/'
                    if path.startswith(prefix):
                        if self.archive_mode == 'missing' and path.endswith('/.htaccess'):
                            continue
                        member = tarfile.TarInfo('star40.ru/' + path[len(prefix):])
                        member.size = len(content)
                        tar.addfile(member, io.BytesIO(content))
            self.files[child(parent, 'before-release.tgz')] = (
                b'truncated archive' if self.archive_mode == 'corrupt' else buffer.getvalue())
        elif func == 'file.delete':
            target = child(parent, name)
            if self.before_delete:
                self.before_delete(target)
            if target in self.directories:
                # Deliberately model the dangerous API's recursive deletion.
                self.directories = {p for p in self.directories
                                    if p != target and not p.startswith(target + '/')}
                self.files = {p: b for p, b in self.files.items() if not p.startswith(target + '/')}
            else:
                del self.files[target]
        elif func != 'file.unixattr':
            raise AssertionError('Unexpected fake action: ' + func)
        return ET.Element('doc')

    def changes(self):
        return [(f, p) for f, p in self.calls if f not in ('file', 'file.download')]

    def live_writes(self):
        return [(f, p) for f, p in self.changes()
                if f == 'file.copyto' and bytes.fromhex(p['dirlist']).decode().startswith(SITE)]


class DeploySafetyTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.backend = FakePanel()
        self.deployer = Deployer(self.backend, pathlib.Path(self.temporary.name) / 'backup')

    def stage(self):
        self.deployer.create_stage()
        return self.deployer._stage

    def assert_no_new_changes(self, callback):
        previous = len(self.backend.changes())
        with self.assertRaises(SafetyError):
            callback()
        self.assertEqual(len(self.backend.changes()), previous)

    def test_delete_cannot_be_disguised_as_metadata_read(self):
        self.assert_no_new_changes(lambda: self.deployer.request(
            'file.delete', plid=SITE, elid='index.html', out='devel'))
        self.assert_no_new_changes(lambda: self.deployer.request(
            'file.edit', plid=SITE, elid='index.html'))
        self.assert_no_new_changes(lambda: self.deployer.request(
            'file', plid=SITE, sok='ok', out='devel'))

    def test_cli_without_publish_never_authenticates(self):
        with patch('sys.argv', ['deploy_hosting.py', '--state-dir', self.temporary.name + '/new']), \
                patch('deploy_hosting.PanelTransport.login') as login:
            with self.assertRaises(SafetyError):
                main()
            login.assert_not_called()

    def test_public_deletion_always_denied_even_during_cleanup(self):
        self.stage()
        self.deployer._cleaning = True
        for parent, name in [(SITE, 'index.html'), (SITE + '/assets', 'old.js'),
                             (ACCOUNT + SITE, 'index.html'), ('/www', 'star40.ru')]:
            with self.subTest(parent=parent):
                self.assert_no_new_changes(lambda: self.deployer._mutate(
                    'file.delete', {'plid': parent, 'elid': name}))

    def test_traversal_encoded_paths_and_multi_selection_denied(self):
        self.stage()
        self.deployer._cleaning = True
        for parent, name in [(SITE + '/../star40.ru', 'index.html'),
                             ('/www/%73tar40.ru', 'index.html'),
                             ('/www\\star40.ru', 'index.html'),
                             (self.deployer._stage, '../index.html'),
                             (self.deployer._stage, 'probe;index.html'),
                             ('//www/star40.ru', 'index.html')]:
            with self.subTest(parent=parent, name=name):
                self.assert_no_new_changes(lambda: self.deployer._mutate(
                    'file.delete', {'plid': parent, 'elid': name}))

    def test_no_cleanup_of_preexisting_or_similar_named_directories(self):
        self.assert_no_new_changes(self.deployer.cleanup)
        self.stage()
        for path in ['/star40-stage-old', self.deployer._stage + '-copy', '/star40-backup-' + 'a' * 32]:
            with self.subTest(path=path):
                self.assert_no_new_changes(lambda: self.deployer._mutate(
                    'file.delete', {'plid': '/', 'elid': path[1:]}))

    def test_cleanup_refuses_unknown_files_directories_and_links_before_deleting_anything(self):
        stage = self.stage()
        self.deployer.probe()
        for kind in ('file', 'dir', 'link'):
            with self.subTest(kind=kind):
                target = stage + '/foreign'
                if kind == 'file':
                    self.backend.files[target] = b'foreign'
                elif kind == 'dir':
                    self.backend.directories.add(target)
                else:
                    self.backend.links.add(target)
                self.assert_no_new_changes(self.deployer.cleanup)
                self.backend.files.pop(target, None)
                self.backend.directories.discard(target)
                self.backend.links.discard(target)

    def test_changed_owned_file_or_marker_stops_cleanup(self):
        stage = self.stage()
        self.deployer.probe()
        for name in ('transfer-probe.bin', MARKER):
            with self.subTest(name=name):
                original = self.backend.files[stage + '/' + name]
                self.backend.files[stage + '/' + name] = b'changed'
                self.assert_no_new_changes(self.deployer.cleanup)
                self.backend.files[stage + '/' + name] = original

    def test_failed_upload_never_claims_ownership_of_existing_or_uncertain_files(self):
        stage = self.stage()
        self.backend.files[stage + '/clash.bin'] = b'known'
        self.assert_no_new_changes(lambda: self.deployer._upload('clash.bin', b'known'))
        self.assertNotIn('clash.bin', self.deployer._owned_files)
        self.assert_no_new_changes(self.deployer.cleanup)
        del self.backend.files[stage + '/clash.bin']
        original_send = self.backend.send

        def lost_response(func, params, data=None):
            response = original_send(func, params, data)
            if func == 'file.upload':
                raise OSError('Connection lost after upload')
            return response

        with patch.object(self.backend, 'send', side_effect=lost_response):
            with self.assertRaises(OSError):
                self.deployer._upload('uncertain.bin', b'known')
        self.assertNotIn('uncertain.bin', self.deployer._owned_files)
        self.assert_no_new_changes(self.deployer.cleanup)

    def test_binary_transport_does_not_transform_file_bytes(self):
        client = PanelTransport('fake-token')
        binary = b'\x00\xff\r\n\n\x80'
        with patch.object(client, '_post', return_value=b'<doc/>') as post:
            client.send('file.upload', {'plid': '/star40-stage-' + 'a' * 32,
                                       'filename': 'probe.bin', 'out': 'xml'}, binary)
        self.assertIn(binary, post.call_args.args[1])
        self.assertEqual(post.call_args.args[0], 'https://server193.hosting.reg.ru:1500/mancgi/upload')

    def test_stage_symlink_stops_cleanup(self):
        stage = self.stage()
        self.backend.links.add(stage)
        self.assert_no_new_changes(self.deployer.cleanup)

    def test_backup_directory_symlink_blocks_archive_and_permission_changes(self):
        self.stage()
        directory = '/star40-backup-' + 'c' * 32
        self.deployer._backup_directory = directory
        self.backend.directories.add(directory)
        self.backend.links.add(directory)
        self.assert_no_new_changes(lambda: self.deployer._mutate('file.pack', {
            'plid': directory, 'elid': 'star40.ru', 'filetype': 'tgz',
            'arcname': 'before-release', 'remove_files': 'off'}))
        self.assert_no_new_changes(lambda: self.deployer._mode('/', directory[1:], '700'))

    def test_cleanup_rechecks_empty_directory_before_recursive_api(self):
        stage = self.stage()

        def insert_unknown_when_marker_is_deleted(target):
            if target == stage + '/' + MARKER:
                self.backend.files[stage + '/arrived-late'] = b'keep me'

        self.backend.before_delete = insert_unknown_when_marker_is_deleted
        with self.assertRaises(SafetyError):
            self.deployer.cleanup()
        self.assertIn(stage + '/arrived-late', self.backend.files)
        self.assertNotIn(('file.delete', {'plid': '/', 'elid': stage[1:], 'sok': 'ok', 'out': 'xml'}),
                         self.backend.calls)

    def test_cleanup_only_removes_files_created_by_this_run(self):
        stage = self.stage()
        self.deployer.probe()
        self.deployer._upload('tracked.png', b'binary image\x00\r\n')
        old_live = {k: v for k, v in self.backend.files.items() if k.startswith(SITE + '/')}
        self.deployer.cleanup()
        self.assertNotIn(stage, self.backend.directories)
        self.assertEqual(self.backend.files, old_live)

    def test_publish_requires_backup_even_for_new_assets(self):
        self.stage()
        self.assert_no_new_changes(lambda: self.deployer.publish(self.temporary.name, ['new.js']))
        self.assertEqual(self.backend.live_writes(), [])

    def test_unverified_incomplete_or_corrupt_backup_never_unlocks_live_writes(self):
        self.stage()
        for mode in ('missing', 'corrupt'):
            with self.subTest(mode=mode):
                self.backend.archive_mode = mode
                with self.assertRaises((SafetyError, tarfile.ReadError)):
                    self.deployer.backup()
                self.assertIsNone(self.deployer._backup)
                self.assertEqual(self.backend.live_writes(), [])

    def test_backup_source_without_htaccess_is_refused(self):
        self.stage()
        del self.backend.files[SITE + '/.htaccess']
        self.assert_no_new_changes(self.deployer.backup)

    def test_backup_cannot_move_or_delete_live_files(self):
        self.stage()
        self.deployer._backup_directory = '/star40-backup-' + 'b' * 32
        self.backend.directories.add(self.deployer._backup_directory)
        self.assert_no_new_changes(lambda: self.deployer._mutate('file.copyto', {
            'plid': '/www', 'elid': 'star40.ru', 'dirlist': self.deployer._backup_directory.encode().hex(),
            'move': 'on', 'overwrite': 'off', 'goto': 'off'}))

    def prepare_dist(self):
        dist = pathlib.Path(self.temporary.name) / 'dist'
        (dist / 'assets').mkdir(parents=True)
        (dist / 'assets/new.js').write_bytes(b'new JS\x00\r\n')
        (dist / 'assets/style.css').write_bytes(b'old CSS')
        (dist / 'index.html').write_bytes(
            b'<script src="/assets/new.js"></script><link href="/assets/style.css">')
        return dist

    def test_changed_backup_or_live_target_stops_publication(self):
        self.stage()
        self.deployer.backup()
        archive = self.deployer.state_directory / 'before-release.tgz'
        original = archive.read_bytes()
        archive.write_bytes(b'changed')
        self.assert_no_new_changes(lambda: self.deployer.publish(self.prepare_dist(), ['index.html']))
        archive.write_bytes(original)
        self.backend.files[SITE + '/index.html'] = b'foreign work'
        self.deployer._plan[SITE + '/index.html'] = {'staged': 'index.html', 'sha256': digest(b'new')}
        self.deployer._upload('index.html', b'new')
        self.assert_no_new_changes(lambda: self.deployer._mutate('file.copyto', {
            'plid': self.deployer._stage, 'elid': 'index.html', 'dirlist': SITE.encode().hex(),
            'move': 'on', 'overwrite': 'on', 'goto': 'off'}))

    def test_simulated_release_orders_verified_backup_assets_then_html_and_preserves_old_assets(self):
        self.stage()
        self.deployer.probe()
        self.deployer.backup()
        archive_index = next(i for i, (f, _) in enumerate(self.backend.calls) if f == 'file.pack')
        dist = self.prepare_dist()
        with patch('deploy_hosting.public_download', side_effect=lambda p: self.backend.files[SITE + p]):
            self.deployer.publish(dist, ['index.html', 'assets/new.js'])
        writes = self.backend.live_writes()
        self.assertEqual([p['elid'] for _, p in writes], ['new.js', 'index.html'])
        self.assertTrue(all(i > archive_index for i, call in enumerate(self.backend.calls) if call in writes))
        self.assertIn(SITE + '/assets/old.js', self.backend.files)
        self.assertIn(SITE + '/.htaccess', self.backend.files)
        self.deployer.cleanup()
        self.assertIn(self.deployer._backup_directory + '/before-release.tgz', self.backend.files)
        self.assertFalse(any(f == 'file.delete' and p['plid'].startswith(SITE) for f, p in self.backend.calls))

    def test_unavailable_html_resources_block_index_switch(self):
        self.stage()
        self.deployer.backup()
        with patch('deploy_hosting.public_download', return_value=b'wrong resource'):
            with self.assertRaises(SafetyError):
                self.deployer.publish(self.prepare_dist(), ['index.html'])
        self.assertEqual(self.backend.live_writes(), [])

    def test_changing_experiments_are_not_permitted_in_site(self):
        self.stage()
        for func, params in [('file.upload', {'plid': SITE, 'filename': 'test.txt'}),
                             ('file.new', {'plid': SITE, 'name': 'test', 'filetype': '1'}),
                             ('file.unixattr', {'plid': SITE, 'elid': 'index.html', 'dname': 'test', 'mode': '600'}),
                             ('file.edit', {'plid': SITE, 'elid': 'index.html'}),
                             ('file.pack', {'plid': SITE, 'elid': 'index.html'})]:
            with self.subTest(func=func):
                self.assert_no_new_changes(lambda: self.deployer._mutate(func, params, b'test'))


if __name__ == '__main__':
    unittest.main()
