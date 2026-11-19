param(
    [string]$ToolRoot = 'D:\codex\Gen5\.airpal-tools',
    [string]$StockRoot = (Join-Path $PSScriptRoot '../../.build/control-center-audit')
)

$ErrorActionPreference = 'Stop'
$tools = Join-Path $ToolRoot 'sdk/build-tools/35.0.0'
$aapt = Join-Path $tools 'aapt2.exe'
$align = Join-Path $tools 'zipalign.exe'
$signer = Join-Path $tools 'lib/apksigner.jar'
$java = Join-Path $ToolRoot 'jdk/jdk-17.0.2/bin/java.exe'
$android = Join-Path $ToolRoot 'sdk/platforms/android-34/android.jar'
$project = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$stock = (Resolve-Path -LiteralPath $StockRoot).ProviderPath
$keystore = Join-Path $project '.build/findn-qs-preview.jks'
$stage = Join-Path $project ('.build/overlay-build/' + [guid]::NewGuid().ToString('N'))
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Invoke-BuildTool([string]$Program, [string[]]$Arguments) {
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Tool failed ($LASTEXITCODE): $Program" }
}

Push-Location -LiteralPath $project
try {
    Invoke-BuildTool 'node' @((Join-Path $PSScriptRoot '生成资源.mjs'), $stage)
    $groups = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $stage 'mapping.json') | ConvertFrom-Json
    if (!(Test-Path -LiteralPath $keystore -PathType Leaf)) {
        Invoke-BuildTool (Join-Path $ToolRoot 'jdk/jdk-17.0.2/bin/keytool.exe') @('-genkeypair','-keystore',$keystore,'-storepass','android','-keypass','android','-alias','findn-qs-preview','-keyalg','RSA','-keysize','2048','-validity','3650','-dname','CN=BigFish Find N Quick Settings')
    }
    $signed = foreach ($group in $groups) {
        $folder = Join-Path $stage $group.name
        $targetApk = if ($group.target -eq 'com.android.systemui') {
            Join-Path $stock 'SystemUI.apk'
        } else {
            Join-Path $stock "tiles/$($group.target).apk"
        }
        if (!(Test-Path -LiteralPath $targetApk)) { throw "Missing target APK $targetApk" }
        $overlayable = @(Invoke-BuildTool $aapt @('dump','overlayable',$targetApk) | Where-Object { $_.Trim() })
        if ($overlayable) { throw "Target declares an overlayable policy: $($group.target)" }
        $drawableCounts = [Collections.Generic.Dictionary[string,int]]::new([StringComparer]::Ordinal)
        $drawableConfigs = @{}
        foreach ($entry in $group.entries) {
            $drawableCounts.Add($entry.target, 0)
            $drawableConfigs[$entry.target] = [Collections.Generic.List[string]]::new()
        }
        $currentDrawable = $null
        Invoke-BuildTool $aapt @('dump','resources',$targetApk) | ForEach-Object {
            if ($_ -match '^\s+resource ') {
                $currentDrawable = $null
                if ($_ -match 'resource 0x[0-9a-f]+ drawable/([a-z0-9_]+)\s*$' -and $drawableCounts.ContainsKey($Matches[1])) {
                    $currentDrawable = $Matches[1]
                    $drawableCounts[$currentDrawable]++
                }
            } elseif ($currentDrawable -and $_ -match '^\s+\(([^)]+)\)\s') {
                $drawableConfigs[$currentDrawable].Add($Matches[1])
            }
        }
        foreach ($entry in $group.entries) {
            if ($drawableCounts[$entry.target] -ne 1) {
                throw "Expected exactly one $($group.target):drawable/$($entry.target), found $($drawableCounts[$entry.target])"
            }
            $uncovered = @($drawableConfigs[$entry.target] | Where-Object { $_ -cnotin $entry.configs })
            if ($uncovered) { throw "Stock configurations omitted for $($group.target):drawable/$($entry.target): $($uncovered -join ', ')" }
        }

        $aligned = Join-Path $folder 'aligned.apk'
        $output = Join-Path $folder "BigFishFindN$($group.name)Overlay.apk"
        Push-Location -LiteralPath $folder
        try {
            Invoke-BuildTool $aapt @('compile','--dir','res','-o','resources.zip')
            Invoke-BuildTool $aapt @('link','-I',$android,'--manifest','AndroidManifest.xml',
                '--no-resource-deduping','--no-resource-removal','-o','unsigned.apk','resources.zip')
            Invoke-BuildTool $align @('-f','4','unsigned.apk','aligned.apk')
        } finally { Pop-Location }
        Invoke-BuildTool $java @('-jar',$signer,'sign','--ks',$keystore,'--ks-pass','pass:android','--key-pass','pass:android',
            '--v4-signing-enabled','false','--out',$output,$aligned)
        Invoke-BuildTool $java @('-jar',$signer,'verify',$output)
        Get-Item -LiteralPath $output
    }
    $metadata = @(
        'id=bigfish_findn_qs_flashlight'
        'name=BigFish Find N Quick Settings'
        'version=2.3'
        'versionCode=5'
        'author=BigFish'
        'description=Deep-sea Quick Settings icons for Find N PEUM00 on the verified ColorOS 14 build. Disable and reboot to restore stock.'
    )
    $moduleProp = Join-Path (Resolve-Path -LiteralPath $stage).Path 'module.prop'
    $customize = Join-Path (Resolve-Path -LiteralPath $stage).Path 'customize.sh'
    [IO.File]::WriteAllText($moduleProp, ($metadata -join "`n") + "`n", [Text.UTF8Encoding]::new($false))
    [IO.File]::WriteAllText($customize, @'
[ "$(getprop ro.product.model)" = PEUM00 ] || abort 'Requires an OPPO Find N (PEUM00).'
[ "$(getprop ro.build.display.id)" = 'PEUM00_14.0.0.2701(CN01)' ] || abort 'Requires the verified ColorOS 14 firmware.'
'@.Replace("`r`n","`n") + "`n", [Text.UTF8Encoding]::new($false))

    $deliverables = Join-Path $PSScriptRoot '交付'
    [void][IO.Directory]::CreateDirectory($deliverables)
    $modulePath = Join-Path $deliverables 'bigfish-findn-qs-deep-v01.zip'
    $module = [IO.Compression.ZipArchive]::new([IO.File]::Create($modulePath), [IO.Compression.ZipArchiveMode]::Create)
    try {
        [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($module,$moduleProp,'module.prop')
        [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($module,$customize,'customize.sh')
        foreach ($file in $signed) {
            [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($module,$file.FullName,"system/product/overlay/$($file.Name)")
        }
    } finally { $module.Dispose() }
    $archive = [IO.Compression.ZipFile]::OpenRead($modulePath)
    try {
        if ($archive.Entries.Count -ne $groups.Count + 2) { throw 'Wrong number of overlay packages' }
        foreach ($file in $signed) {
            $payload = $archive.GetEntry("system/product/overlay/$($file.Name)").Open()
            try { $hash = (Get-FileHash -InputStream $payload).Hash } finally { $payload.Dispose() }
            if ($hash -ne (Get-FileHash -LiteralPath $file.FullName).Hash) { throw "Archive APK hash mismatch: $($file.Name)" }
        }
    } finally { $archive.Dispose() }
    Get-FileHash -LiteralPath $modulePath
} finally { Pop-Location }
