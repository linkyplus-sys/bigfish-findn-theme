param(
    [string]$ToolRoot = 'D:\codex\Gen5\.airpal-tools',
    [string]$Keystore = (Join-Path $PSScriptRoot '../../.build/findn-local-preview.jks')
)

$ErrorActionPreference = 'Stop'
$kit = $ToolRoot
$tools = Join-Path $kit 'sdk\build-tools\35.0.0'
$platform = Join-Path $kit 'sdk\platforms\android-34\android.jar'
$bin = Join-Path $kit 'jdk\jdk-17.0.2\bin'
$aapt = Join-Path $tools 'aapt2.exe'
$java = Join-Path $bin 'java.exe'
$signer = Join-Path $tools 'lib\apksigner.jar'
function Invoke-AndroidTool([string]$Path, [string[]]$Arguments) {
    & $Path @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Path failed with exit code $LASTEXITCODE" }
}
foreach ($name in 'cover.mp4', 'inner.mp4') {
    $video = Join-Path $PSScriptRoot "assets/$name"
    if (!(Test-Path -LiteralPath $video -PathType Leaf)) { throw "Missing lock screen video: $video" }
}
$Keystore = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Keystore)
if (!(Test-Path -LiteralPath $Keystore -PathType Leaf)) {
    [void][IO.Directory]::CreateDirectory((Split-Path $Keystore -Parent))
    Invoke-AndroidTool (Join-Path $bin 'keytool.exe') @('-genkeypair','-keystore',$Keystore,'-storepass','android','-keypass','android','-alias','findn-preview','-keyalg','RSA','-keysize','2048','-validity','3650','-dname','CN=BigFish Find N Local Preview')
}
Push-Location -LiteralPath $PSScriptRoot
try {
    foreach ($name in 'classes', 'dex') { [void][IO.Directory]::CreateDirectory((Join-Path $PSScriptRoot $name)) }
    $iconDir = Join-Path $PSScriptRoot 'res/drawable-xxhdpi'
    [void][IO.Directory]::CreateDirectory($iconDir)
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot '../../补充图标/dark/bigfishlock.png') -Destination (Join-Path $iconDir 'bigfish_lock_video.png') -Force
    Invoke-AndroidTool $aapt @('compile','--dir','res','-o','resources.zip')
    Invoke-AndroidTool $aapt @('link','-I',$platform,'--manifest','AndroidManifest.xml','-A','assets','-0','mp4','-o','motion-unsigned.apk','resources.zip')
    Invoke-AndroidTool (Join-Path $bin 'javac.exe') @('-encoding','UTF-8','-source','8','-target','8','-Xlint:-options','-classpath',$platform,'-d','classes','MotionWallpaper.java','PreviewActivity.java')
    $source = @(Get-ChildItem -Path classes -Recurse -Filter '*.class' -File | Resolve-Path -Relative)
    Invoke-AndroidTool $java (@('-cp',(Join-Path $tools 'lib\d8.jar'),'com.android.tools.r8.D8','--min-api','28','--lib',$platform,'--output','dex') + $source)
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [IO.Compression.ZipFile]::Open((Join-Path $PSScriptRoot 'motion-unsigned.apk'), [IO.Compression.ZipArchiveMode]::Update)
    try { [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Join-Path $PSScriptRoot 'dex\classes.dex'), 'classes.dex') }
    finally { $zip.Dispose() }
    Invoke-AndroidTool (Join-Path $tools 'zipalign.exe') @('-p','-f','4','motion-unsigned.apk','motion-aligned.apk')
    Invoke-AndroidTool $java @('-jar',$signer,'sign','--ks',$Keystore,'--ks-pass','pass:android','--key-pass','pass:android','--v4-signing-enabled','false','--out','bigfish-lock-video-v01.apk','motion-aligned.apk')
    Invoke-AndroidTool $java @('-jar',$signer,'verify','bigfish-lock-video-v01.apk')
    Get-Item -LiteralPath 'bigfish-lock-video-v01.apk' | Select-Object Name,Length
}
finally { Pop-Location }
