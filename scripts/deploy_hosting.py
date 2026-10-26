"""Constrained ISPmanager deployment; standard library only, no arbitrary API CLI.

Nothing contacts the host unless --publish is explicitly supplied. Passwords are
read with getpass and stay in memory. All changing requests pass _mutate().
"""

import argparse
import getpass
import hashlib
import io
import json
import pathlib
import re
import secrets
import ssl
import sys
import tarfile
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

SITE = '/www/star40.ru'
ACCOUNT = '/var/www/u3596090/data'
PANEL = 'https://server193.hosting.reg.ru:1500'
MARKER = '.star40-owned-stage.json'
STAGE_PATTERN = re.compile(r'/star40-stage-[0-9a-f]{32}\Z')
BACKUP_PATTERN = re.compile(r'/star40-backup-[0-9a-f]{32}\Z')
REGULAR_TYPES = {'file', 'image', 'archive'}


class SafetyError(RuntimeError):
    pass


def require(condition, message):
    if not condition:
        raise SafetyError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def remote_path(value):
    """Reject aliases, traversal, encoded paths and multi-selection separators."""
    require(isinstance(value, str) and value.startswith('/'), 'Absolute path required')
    require(not any(c in value for c in '\\%\x00\r\n\t;|?#'), 'Unsafe path')
    require(value == '/' or all(p and p not in ('.', '..') for p in value[1:].split('/')),
            'Non-canonical path')
    return value


def filename(value):
    require(isinstance(value, str) and re.fullmatch(r'[\w. -]+', value) is not None
            and value not in ('.', '..'), 'Unsafe filename')
    return value


def child(parent, name):
    return remote_path(parent.rstrip('/') + '/' + filename(name))


def is_public(path):
    path = remote_path(path)
    return any(path == root or path.startswith(root + '/')
               for root in (SITE, ACCOUNT + SITE))


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise SafetyError('HTTP redirect refused')


class PanelTransport:
    """Transport has no command-line function selector or TLS bypass option."""

    def __init__(self, token):
        self._token = token
        self._opener = urllib.request.build_opener(
            urllib.request.HTTPSHandler(context=ssl.create_default_context()), NoRedirect())

    def _post(self, url, data, headers=None):
        request = urllib.request.Request(url, data=data, headers=headers or {})
        with self._opener.open(request, timeout=120) as response:
            return response.read()

    @classmethod
    def login(cls):
        client = cls(None)
        require(sys.stdin.isatty(), 'Hidden password input requires an interactive console')
        password = getpass.getpass('Reg.ru password (hidden): ')
        try:
            data = urllib.parse.urlencode({'func': 'auth', 'username': 'u3596090',
                                           'password': password, 'out': 'xml'}).encode()
            document = ET.fromstring(client._post(PANEL + '/ispmgr', data))
        finally:
            password = None
        auth = document.find('auth')
        require(auth is not None and auth.get('id'), 'Authentication failed')
        client._token = auth.get('id')
        return client

    def send(self, func, params, data=None):
        fields = {'func': func, 'auth': self._token, **params}
        if data is not None:
            name = fields.pop('filename')
            boundary = 'star40-' + secrets.token_hex(16)
            pieces = [f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"'
                      f'\r\n\r\n{value}\r\n'.encode() for key, value in fields.items()]
            pieces.append(f'--{boundary}\r\nContent-Disposition: form-data; '
                          f'name="filename"; filename="{name}"\r\n'
                          'Content-Type: application/octet-stream\r\n\r\n'.encode() + data + b'\r\n')
            pieces.append(f'--{boundary}--\r\n'.encode())
            response = self._post(PANEL + '/mancgi/upload', b''.join(pieces),
                                  {'Content-Type': 'multipart/form-data; boundary=' + boundary})
        else:
            response = self._post(PANEL + '/ispmgr', urllib.parse.urlencode(fields).encode())
        if func == 'file.download':
            # ISPmanager may label errors as JSON while sending plain text.
            require(not response.startswith(b'Failed to '), 'File download failed')
            return response
        try:
            document = ET.fromstring(response)
        except ET.ParseError:
            raise SafetyError('Unexpected panel response') from None
        error = document.find('error')
        require(error is None, 'Panel rejected operation')
        return document


class Deployer:
    def __init__(self, transport, state_directory):
        self._transport = transport
        self.state_directory = pathlib.Path(state_directory).resolve()
        repository = pathlib.Path(__file__).resolve().parent.parent
        require(not self.state_directory.is_relative_to(repository), 'State must stay outside Git')
        self._stage = None
        self._stage_created = False
        self._marker = None
        self._owned_files = {}
        self._pending_upload = None
        self._backup_directory = None
        self._backup = None
        self._plan = {}
        self._cleaning = False

    def request(self, func, **params):
        """Only two known read actions. out=devel never makes an action safe."""
        require(func in ('file', 'file.download'), 'Arbitrary API calls are disabled')
        expected = {'plid'} if func == 'file' else {'plid', 'elid'}
        require(set(params) == expected, 'Unexpected read parameters')
        remote_path(params['plid'])
        if 'elid' in params:
            filename(params['elid'])
        if func == 'file':
            params['out'] = 'xml'
        return self._transport.send(func, params)

    def listing(self, path):
        document = self.request('file', plid=remote_path(path))
        entries = {filename(e.findtext('name')): e.findtext('type')
                   for e in document.findall('elem')}
        require(len(entries) == len(document.findall('elem')), 'Duplicate directory entries')
        return entries

    def download(self, path, name):
        return self.request('file.download', plid=remote_path(path), elid=filename(name))

    def _real_directory(self, path):
        """Reject symlink aliases in every parent, including the staging root."""
        current = '/'
        for part in remote_path(path).split('/')[1:]:
            if part:
                require(self.listing(current).get(part) == 'dir', 'Not a regular directory')
                current = child(current, part)

    def _stage_identity(self):
        require(self._stage_created and self._stage is not None
                and STAGE_PATTERN.fullmatch(self._stage), 'No owned stage')
        self._real_directory(self._stage)
        require(self.listing(self._stage).get(MARKER) == 'file', 'Missing ownership marker')
        require(self.download(self._stage, MARKER) == self._marker, 'Ownership marker changed')

    def _backup_valid(self):
        require(self._backup is not None, 'Verified backup required before live writes')
        archive = self.state_directory / 'before-release.tgz'
        require(archive.is_file() and digest(archive.read_bytes()) == self._backup['archiveSha256'],
                'Verified backup missing or changed')

    def _mutate(self, func, params, data=None):
        """Single firewall for every changing call, including metadata requests."""
        require('out' not in params and 'sok' not in params, 'Raw API modifiers forbidden')
        parent = remote_path(params['plid'])
        if func == 'file.delete':
            target = child(parent, params['elid'])
            require(not is_public(parent) and not is_public(target), 'Public deletion forbidden')
            require(self._cleaning and self._stage_created and self._stage is not None,
                    'Deletion only during owned cleanup')
            if target == self._stage:
                require(parent == '/' and STAGE_PATTERN.fullmatch(target), 'Invalid cleanup root')
                self._real_directory(target)
                require(self.listing(target) == {}, 'Cleanup root is not empty')
            else:
                require(parent == self._stage, 'Deletion outside owned stage forbidden')
                self._stage_identity()
                name = filename(params['elid'])
                expected = self._marker if name == MARKER else self._owned_files.get(name)
                require(expected is not None, 'Untracked cleanup file')
                require(self.listing(parent).get(name) in REGULAR_TYPES, 'Cleanup links/directories forbidden')
                actual = self.download(parent, name)
                require(actual == expected if name == MARKER else digest(actual) == expected,
                        'Cleanup file changed')
        elif func == 'file.new':
            target = child(parent, params['name'])
            require(parent == '/' and params['filetype'] == '1'
                    and target in (self._stage, self._backup_directory)
                    and (STAGE_PATTERN.fullmatch(target) or BACKUP_PATTERN.fullmatch(target)),
                    'Only new non-public tool directories may be created')
            require(params['name'] not in self.listing('/'), 'Directory already exists')
        elif func == 'file.upload':
            require(self._stage_created and parent == self._stage and STAGE_PATTERN.fullmatch(parent),
                    'Upload only to owned stage')
            self._real_directory(parent)
            name = filename(params['filename'])
            require(name not in self.listing(parent), 'Stage file already exists')
            if name == MARKER:
                require(data == self._marker, 'Invalid marker')
            else:
                self._stage_identity()
                require(self._pending_upload == (name, digest(data)), 'Untracked upload')
        elif func == 'file.copyto':
            destination = remote_path(bytes.fromhex(params['dirlist']).decode())
            self._real_directory(parent)
            self._real_directory(destination)
            if parent == '/www' and params['elid'] == 'star40.ru':
                require(destination == self._backup_directory
                        and BACKUP_PATTERN.fullmatch(destination)
                        and params['move'] == 'off' and params['overwrite'] == 'off',
                        'Live files may only be copied to a new backup, never moved')
                require(self.listing(destination) == {}, 'Backup directory is not empty')
            else:
                self._stage_identity()
                require(parent == self._stage, 'Live writes must originate from owned stage')
                target = child(destination, params['elid'])
                require(target in self._plan and self._plan[target]['staged'] == params['elid'],
                        'Unplanned live write')
                require(params['move'] == 'on' and params['overwrite'] == 'on', 'Invalid publication operation')
                self._backup_valid()
                require(self.listing(parent).get(params['elid']) in REGULAR_TYPES,
                        'Staged publication source is a link or directory')
                require(digest(self.download(parent, params['elid'])) == self._plan[target]['sha256'],
                        'Staged content changed')
                old_hash = self._backup['files'].get(target[len(SITE) + 1:])
                existing = self.listing(destination).get(params['elid'])
                require(existing is None or existing in REGULAR_TYPES, 'Live target is a directory or link')
                require((existing is None and old_hash is None) or
                        (existing is not None and digest(self.download(destination, params['elid'])) == old_hash),
                        'Live target changed since backup')
        elif func == 'file.pack':
            require(parent == self._backup_directory and BACKUP_PATTERN.fullmatch(parent)
                    and params == {'plid': parent, 'elid': 'star40.ru', 'filetype': 'tgz',
                                   'arcname': 'before-release', 'remove_files': 'off'}, 'Unsafe archive operation')
            self._real_directory(parent)
            require('before-release.tgz' not in self.listing(parent), 'Backup archive already exists')
        elif func == 'file.unixattr':
            target = child(parent, params['elid'])
            require(params['dname'] == params['elid'], 'Renaming through permission changes forbidden')
            directory = target in (self._stage, self._backup_directory)
            require(directory or (self._backup_directory is not None
                    and target == child(self._backup_directory, 'before-release.tgz')),
                    'Permissions only for tool-created backup/stage')
            require(params['mode'] == ('700' if directory else '600'), 'Unsafe tool file permissions')
            self._real_directory(parent)
            kind = self.listing(parent).get(params['elid'])
            require(kind == 'dir' if directory else kind in REGULAR_TYPES,
                    'Permission target replaced by a link or special file')
        else:
            raise SafetyError('Changing API action is not allowed')
        return self._transport.send(func, {**params, 'sok': 'ok', 'out': 'xml'}, data)

    def create_stage(self):
        require(self._stage is None, 'Stage already created')
        self._stage = '/star40-stage-' + secrets.token_hex(16)
        self._marker = json.dumps({'stage': self._stage, 'nonce': secrets.token_hex(32)}).encode()
        self._mutate('file.new', {'plid': '/', 'name': self._stage[1:], 'filetype': '1'})
        self._stage_created = True
        self._mode('/', self._stage[1:], '700')
        self._upload(MARKER, self._marker)
        return self._stage

    def _upload(self, name, content):
        self._pending_upload = (name, digest(content))
        try:
            self._mutate('file.upload', {'plid': self._stage, 'filename': name,
                                        'type': 'data', 'mgrname': 'ispmgr'}, content)
            require(self.download(self._stage, name) == content, 'Binary upload verification failed')
            if name != MARKER:
                self._owned_files[name] = digest(content)
        finally:
            self._pending_upload = None

    def _mode(self, parent, name, mode):
        keys = ('pur', 'puw', 'pux', 'pgr', 'pgw', 'pgx', 'por', 'pow', 'pox')
        bits = {key: 'on' if int(mode, 8) & bit else 'off'
                for key, bit in zip(keys, (256, 128, 64, 32, 16, 8, 4, 2, 1))}
        self._mutate('file.unixattr', {'plid': parent, 'elid': name, 'dname': name,
                                      'mode': mode, 'uid': 'u3596090', 'gid': 'u3596090', **bits})

    def probe(self):
        """Binary transfer experiment can only create a file in the owned stage."""
        self._stage_identity()
        self._upload('transfer-probe.bin', b'star40\x00\xff\r\n\n' + secrets.token_bytes(32))

    def _inventory(self, path, prefix=''):
        result = {}
        self._real_directory(path)
        for name, kind in self.listing(path).items():
            key = prefix + name
            if kind == 'dir':
                result.update(self._inventory(child(path, name), key + '/'))
            else:
                require(kind in REGULAR_TYPES, 'Backup source contains a link or special file')
                result[key] = digest(self.download(path, name))
        return result

    def backup(self):
        require(self._backup is None, 'Backup already verified')
        files = self._inventory(SITE)
        require('index.html' in files and '.htaccess' in files, 'Backup source is incomplete')
        self._backup_directory = '/star40-backup-' + secrets.token_hex(16)
        self._mutate('file.new', {'plid': '/', 'name': self._backup_directory[1:], 'filetype': '1'})
        self._mode('/', self._backup_directory[1:], '700')
        self._mutate('file.copyto', {'plid': '/www', 'elid': 'star40.ru',
                                    'dirlist': self._backup_directory.encode().hex(),
                                    'move': 'off', 'overwrite': 'off', 'goto': 'off'})
        self._mutate('file.pack', {'plid': self._backup_directory, 'elid': 'star40.ru',
                                  'filetype': 'tgz', 'arcname': 'before-release', 'remove_files': 'off'})
        self._mode(self._backup_directory, 'before-release.tgz', '600')
        archive = self.download(self._backup_directory, 'before-release.tgz')
        verified = {}
        with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as tar:
            for member in tar:
                name = member.name.removeprefix('./')
                remote_path('/' + name)
                require(name == 'star40.ru' or name.startswith('star40.ru/'), 'Unexpected archive root')
                require(member.isdir() or member.isfile(), 'Links/special files in backup archive')
                if member.isfile():
                    relative = name[len('star40.ru/'):]
                    require(relative not in verified, 'Duplicate backup archive member')
                    content = tar.extractfile(member).read()
                    require(len(content) == member.size, 'Truncated backup file')
                    verified[relative] = digest(content)
        require(verified == files, 'Backup archive does not match the complete live inventory')
        self.state_directory.mkdir(parents=True, exist_ok=True)
        (self.state_directory / 'before-release.tgz').write_bytes(archive)
        self._backup = {'directory': self._backup_directory, 'archiveSha256': digest(archive), 'files': files}
        (self.state_directory / 'backup.json').write_text(json.dumps(self._backup, indent=2), encoding='utf-8')
        self._backup_valid()
        return self._backup

    def publish(self, dist, paths):
        dist = pathlib.Path(dist).resolve()
        require(self._stage is not None, 'Create stage first')
        self._backup_valid()  # Even a new asset cannot be uploaded to the live tree before backup.
        require(paths and len(set(paths)) == len(paths), 'Explicit unique publication files required')
        prepared = []
        for path in paths:
            target = remote_path(SITE + '/' + path)
            local = (dist / path).resolve()
            require(local.is_relative_to(dist) and local.is_file(), 'File must come from dist')
            require(not pathlib.PurePosixPath(path).name.startswith('.') and
                    local.suffix.lower() in ('.html', '.js', '.css', '.png', '.svg', '.webp', '.jpg',
                                             '.jpeg', '.woff2', '.pdf', '.doc', '.docx', '.xml', '.txt', '.zip'),
                    'Source, secret or unsupported file refused')
            # Flat staging names prevent recursive cleanup and ambiguous ownership.
            name = filename(local.name)
            require(name not in self._owned_files, 'Duplicate staging name')
            content = local.read_bytes()
            self._plan[target] = {'staged': name, 'sha256': digest(content)}
            self._upload(name, content)
            prepared.append((path, target, name, content))
        for path, target, name, content in sorted(prepared, key=lambda item: item[0] == 'index.html'):
            if path == 'index.html':
                for resource in re.findall(r'(?:src|href)="(/assets/[^"?#]+)"', content.decode('utf-8')):
                    expected = (dist / resource[1:]).read_bytes()
                    require(public_download(resource) == expected, 'HTML resource not yet available')
            self._mutate('file.copyto', {'plid': self._stage, 'elid': name,
                                        'dirlist': str(pathlib.PurePosixPath(target).parent).encode().hex(),
                                        'move': 'on', 'overwrite': 'on', 'goto': 'off'})
            del self._owned_files[name]
            require(self.download(str(pathlib.PurePosixPath(target).parent), name) == content,
                    'Live binary verification failed')
            require(public_download('/' + path) == content, 'Public binary verification failed')

    def cleanup(self):
        self._stage_identity()
        entries = self.listing(self._stage)
        require(set(entries) == {*self._owned_files, MARKER}
                and all(kind in REGULAR_TYPES for kind in entries.values()),
                'Unknown files, directories or links in stage')
        for name, expected_hash in self._owned_files.items():
            require(digest(self.download(self._stage, name)) == expected_hash, 'Stage content changed')
        self._cleaning = True
        try:
            for name in list(self._owned_files):
                self._mutate('file.delete', {'plid': self._stage, 'elid': name})
                del self._owned_files[name]
            self._mutate('file.delete', {'plid': self._stage, 'elid': MARKER})
            self._mutate('file.delete', {'plid': '/', 'elid': self._stage[1:]})
            self._stage = None
            self._stage_created = False
        finally:
            self._cleaning = False


def public_download(path):
    remote_path(path)
    opener = urllib.request.build_opener(
        urllib.request.HTTPSHandler(context=ssl.create_default_context()), NoRedirect())
    with opener.open('https://star40.ru' + urllib.parse.quote(path), timeout=60) as response:
        return response.read()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish', action='store_true', help='Perform an explicitly authorized release')
    parser.add_argument('--dist', default='dist')
    parser.add_argument('--file', action='append', default=[], help='Exact relative dist file; repeat as needed')
    parser.add_argument('--state-dir', required=True, help='New local backup directory outside Git')
    args = parser.parse_args()
    require(args.publish, 'No action: --publish was not supplied')
    require(args.file, 'No action: explicit --file list required')
    require(not pathlib.Path(args.state_dir).exists(), 'Use a new local release directory')
    deployer = Deployer(PanelTransport.login(), args.state_dir)
    deployer.create_stage()
    print('Owned temporary stage:', deployer._stage)
    deployer.probe()
    backup = deployer.backup()
    print('Verified backup:', ACCOUNT + backup['directory'] + '/before-release.tgz')
    deployer.publish(args.dist, args.file)
    deployer.cleanup()
    print('Publication bytes verified; perform the requested browser checks separately.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Never print request bodies, auth tokens or raw server error documents.
        print('Deployment stopped:', str(error) if isinstance(error, SafetyError) else type(error).__name__)
        raise SystemExit(1)
