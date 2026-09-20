[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$stateDirectory = Join-Path $env:LOCALAPPDATA 'star40\panel'
New-Item -ItemType Directory -Path $stateDirectory -Force | Out-Null
$statusPath = Join-Path $stateDirectory 'status.json'
$script:authenticated = $false

function Save-Status([string]$state, [string]$code = '', $sites = @()) {
    $script:lastState = $state
    @{ state = $state; code = $code; checkedAt = (Get-Date).ToString('o'); sites = @($sites) } |
        ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $statusPath -Encoding UTF8
}

function Invoke-PanelRead($requestBody) {
    $response = Invoke-WebRequest -Uri 'https://server193.hosting.reg.ru:1500/ispmgr' -Method Post -Body $requestBody -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 0
    $document = New-Object System.Xml.XmlDocument
    $document.XmlResolver = $null
    $document.LoadXml($response.Content)
    return ,$document
}

Save-Status 'waiting_for_local_input'
$form = New-Object System.Windows.Forms.Form
$form.Text = 'Reg.ru - read-only connection'
$form.ClientSize = New-Object System.Drawing.Size(560, 235)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.TopMost = $true
$label = New-Object System.Windows.Forms.Label
$label.SetBounds(20, 15, 520, 55)
$label.Text = "server193.hosting.reg.ru / u3596090`r`nEnter hosting password. It will NOT be saved."
$passwordBox = New-Object System.Windows.Forms.TextBox
$passwordBox.SetBounds(20, 80, 520, 28)
$passwordBox.UseSystemPasswordChar = $true
$passwordBox.MaxLength = 256
$connect = New-Object System.Windows.Forms.Button
$connect.SetBounds(20, 125, 245, 35)
$connect.Text = 'Connect (read only)'
$close = New-Object System.Windows.Forms.Button
$close.SetBounds(290, 125, 250, 35)
$close.Text = 'Close'
$info = New-Object System.Windows.Forms.Label
$info.SetBounds(20, 175, 520, 50)
$info.Text = 'HTTPS certificate validation is enabled. No hosting files will be changed.'
$form.Controls.AddRange(@($label, $passwordBox, $connect, $close, $info))
$form.AcceptButton = $connect
$form.Add_Shown({ $passwordBox.Focus() })
$close.Add_Click({ $form.Close() })
$form.Add_FormClosing({
    $passwordBox.Clear()
    if ($script:lastState -eq 'waiting_for_local_input') { Save-Status 'closed_without_success' }
})
$connect.Add_Click({
    if ([string]::IsNullOrWhiteSpace($passwordBox.Text)) { return }
    $connect.Enabled = $false
    $close.Enabled = $false
    $info.Text = 'Connecting securely... Please wait.'
    $form.Refresh()
    Save-Status 'connecting'
    $requestBody = $null
    $sessionId = $null
    $document = $null
    try {
        $requestBody = @{ func = 'auth'; username = 'u3596090'; password = $passwordBox.Text; out = 'xml' }
        $document = Invoke-PanelRead $requestBody
        $passwordBox.Clear()
        $requestBody.Clear()
        $authNode = $document.SelectSingleNode('/doc/auth')
        if ($null -eq $authNode -or -not $authNode.GetAttribute('id')) {
            Save-Status 'failed' 'AUTH_FAILED'
            $info.Text = 'Login was not accepted. Return to the task. No automatic retry.'
            return
        }
        $sessionId = $authNode.GetAttribute('id')
        $script:authenticated = $true
        Save-Status 'authenticated'
        $document = $null
        $authNode = $null
        $requestBody = @{ func = 'webdomain'; auth = $sessionId; out = 'xml' }
        $document = Invoke-PanelRead $requestBody
        $requestBody.Clear()
        if ($document.SelectSingleNode('/doc/error')) {
            Save-Status 'authenticated' 'DOMAIN_LIST_UNAVAILABLE'
            $info.Text = 'Connected. Domain list unavailable. Return to the task.'
            return
        }
        $sites = @(foreach ($entry in $document.SelectNodes('/doc/elem')) {
            $site = @{}
            foreach ($field in @('name', 'docroot', 'path', 'home', 'domain', 'ip', 'owner')) {
                $node = $entry.SelectSingleNode($field)
                if ($node) { $site[$field] = $node.InnerText }
            }
            if ($site.Count) { $site }
        })
        Save-Status 'read_complete' '' $sites
        $info.Text = 'CONNECTED. Read-only check completed. Password not saved. Return to the task.'
    } catch {
        $state = if ($script:authenticated) { 'authenticated' } else { 'failed' }
        Save-Status $state 'NETWORK_TLS_OR_RESPONSE_ERROR'
        $info.Text = 'Connection or response error. Return to the task. No automatic retry.'
    } finally {
        $passwordBox.Clear()
        if ($requestBody) { $requestBody.Clear() }
        $requestBody = $null
        $sessionId = $null
        $document = $null
        $authNode = $null
        $close.Enabled = $true
    }
})
[void]$form.ShowDialog()
$form.Dispose()
