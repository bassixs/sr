[CmdletBinding()]
param(
    [switch]$ProbeOnly,
    # Confirmed through the authenticated Reg.ru panel's Shell client.
    [string]$TrustedFingerprint = 'SHA256:T1OJXU1Kj1l/zJyoqbD957TTKmGgtelLGujOlvR0XEU'
)

# No password parameter, variable, file, environment variable or transcript.
# OpenSSH reads the password directly from the local console without echo.
$ErrorActionPreference = 'Stop'
$serverName = 'server193.hosting.reg.ru'
$serverIp = '31.31.196.172'
$serverPort = 22
$serverUser = 'u3596090'
$ssh = Join-Path $env:WINDIR 'System32\OpenSSH\ssh.exe'
if (-not (Test-Path -LiteralPath $ssh)) {
    throw 'Required tool: the Windows OpenSSH client.'
}

Write-Host "Server: $serverName ($serverIp), port $serverPort, user $serverUser"
Write-Host 'Step 1: verify the previously observed PUBLIC host key. No login yet.'
# Public key obtained by keyscan, then independently matched by the user against
# ssh-keyscan of 127.0.0.1 inside the authenticated Reg.ru Shell client.
# No repeated scan is required: SSH itself verifies this key before authentication.
$candidateKey = 'AAAAC3NzaC1lZDI1NTE5AAAAICXSqu8Nn/dD1GDt3/1Ut4t6c5APzjQCOt+x4oT1zQur'
$keyBytes = [Convert]::FromBase64String($candidateKey)
$sha256 = [Security.Cryptography.SHA256]::Create()
try {
    $fingerprint = 'SHA256:' + [Convert]::ToBase64String($sha256.ComputeHash($keyBytes)).TrimEnd('=')
} finally {
    $sha256.Dispose()
}
Write-Host "Observed ED25519 key: $fingerprint"
Write-Host 'Fingerprint independently confirmed through the Reg.ru panel Shell client.'
if ($ProbeOnly) { return }

if (-not $TrustedFingerprint) {
    Write-Host 'Get the ED25519 SHA256 host fingerprint from the Reg.ru panel or support.'
    Write-Host 'Do not just copy the observed fingerprint above. Empty input cancels.'
    $TrustedFingerprint = Read-Host 'Paste the fingerprint independently confirmed by Reg.ru'
}
$TrustedFingerprint = $TrustedFingerprint.Trim()
if ($TrustedFingerprint -cnotmatch '^SHA256:[A-Za-z0-9+/]{43}$' -or $TrustedFingerprint -cne $fingerprint) {
    throw 'No matching trusted fingerprint supplied. No password requested; no login attempted.'
}

$resolvedAddresses = @([Net.Dns]::GetHostAddresses($serverName) | ForEach-Object { $_.IPAddressToString })
if ($resolvedAddresses -notcontains $serverIp) {
    throw 'DNS no longer matches the IP supplied for this hosting account. Verify with Reg.ru.'
}

$stateDir = Join-Path $env:LOCALAPPDATA 'star40\ssh-readonly'
New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
$knownHosts = Join-Path $stateDir 'known_hosts'
$pinnedLine = "$serverName ssh-ed25519 $candidateKey"
# Never silently replace a previously pinned key.
if (Test-Path -LiteralPath $knownHosts) {
    $previousKey = [IO.File]::ReadAllText($knownHosts).Trim()
    if ($previousKey -cne $pinnedLine) {
        throw 'The saved host key differs. Stop and verify the change with Reg.ru.'
    }
} else {
    [IO.File]::WriteAllText($knownHosts, $pinnedLine + "`n", [Text.Encoding]::ASCII)
}
$report = Join-Path $stateDir ('inspection-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.txt')

# Fixed non-interactive remote command: list names and hash public website files.
# No remote files are created, uploaded, changed or deleted. No shell history.
# Directory names are discovered, not used as an assumed publication target.
$remoteCommand = @'
printf '=== AUTHENTICATED USER ===\n'
id -un
printf '=== START DIRECTORY ===\n'
pwd -P
printf '=== TOP LEVEL ===\n'
ls -la .
printf '=== STAR40 DIRECTORY CANDIDATES (MAX DEPTH 5) ===\n'
find . -maxdepth 5 \( -type d -o -type l \) -iname '*star40*' -print
printf '=== CANDIDATE CONTENTS AND PUBLIC FILE HASHES ===\n'
find . -maxdepth 5 \( -type d -o -type l \) -iname '*star40*' -exec sh -c '
for d do
  [ -d "$d" ] || continue
  printf "\nCANDIDATE: %s\n" "$d"
  readlink -f "$d"
  ls -la "$d"
  for f in index.html media/gallery/manifest.json favicon.png; do
    if [ -f "$d/$f" ]; then sha256sum "$d/$f"; fi
  done
done
' sh {} +
printf '=== INSPECTION COMPLETE ===\n'
'@
# Encode only the fixed command to avoid Windows native argument quoting issues.
$commandBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($remoteCommand.Replace("`r", '')))
$remoteLauncher = "printf '%s' '$commandBase64' | base64 -d | sh"
$sshOptions = @(
    '-F', 'NUL', '-T', '-p', "$serverPort",
    '-o', "HostName=$serverName",
    '-o', "HostKeyAlias=$serverName",
    '-o', "UserKnownHostsFile=$($knownHosts.Replace('\', '/'))",
    '-o', 'GlobalKnownHostsFile=NUL',
    '-o', 'StrictHostKeyChecking=yes',
    '-o', 'HostKeyAlgorithms=ssh-ed25519',
    '-o', 'UpdateHostKeys=no',
    '-o', 'VerifyHostKeyDNS=no',
    '-o', 'ForwardAgent=no',
    '-o', 'ClearAllForwardings=yes',
    '-o', 'PermitLocalCommand=no',
    '-o', 'PreferredAuthentications=password,keyboard-interactive',
    '-o', 'PubkeyAuthentication=no',
    '-o', 'NumberOfPasswordPrompts=1',
    '-o', 'ConnectTimeout=15',
    '-o', 'ServerAliveInterval=15',
    '-o', 'ServerAliveCountMax=2',
    '-o', 'LogLevel=ERROR'
)
Write-Host 'Step 2: OpenSSH will ask for the hosting password in this console.'
Write-Host 'No characters or asterisks appear. Type the password and press Enter.'
Write-Host 'The script never reads or saves it. Only remote stdout is saved below.'
Write-Host "Local report (outside Git): $report"
& $ssh @sshOptions "$serverUser@$serverName" $remoteLauncher | Tee-Object -FilePath $report
$sshExitCode = $LASTEXITCODE
if ($sshExitCode -ne 0) {
    throw "SSH inspection failed (exit $sshExitCode). No automatic retry. Report: $report"
}
Write-Host "Read-only inspection finished. Report: $report"
Write-Host 'Directory candidates still need comparison with the domain settings/public file hashes.'
