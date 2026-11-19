[CmdletBinding()]
param([string]$ToolRoot = 'D:\codex\Gen5\.airpal-tools')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$source=Join-Path $PSScriptRoot '组件'
$jdk=Join-Path $ToolRoot 'jdk/jdk-17.0.2/bin'
$tools=Join-Path $ToolRoot 'sdk/build-tools/35.0.0'
$platform=Join-Path $ToolRoot 'sdk/platforms/android-34/android.jar'
$java=Join-Path $jdk 'java.exe'
$cache=Join-Path $PSScriptRoot '.build'
$tempRoot=[IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$out=Join-Path $tempRoot ('bigfish-widget-'+[guid]::NewGuid().ToString('N'))
$generated=Join-Path $out 'generated'
$classes=Join-Path $out 'classes'
$dex=Join-Path $out 'dex'
New-Item -ItemType Directory -Force -Path $cache,$generated,$classes,$dex | Out-Null

function Build-Step([string]$Program,[string[]]$Parameters) {
    & $Program @Parameters
    if ($LASTEXITCODE -ne 0) { throw "$Program failed with exit code $LASTEXITCODE" }
}

try {
    $staged=Join-Path $out 'widget'
    Copy-Item -LiteralPath $source -Destination $staged -Recurse
    $node=(Get-Command node.exe -ErrorAction Stop).Source
    $ffmpeg=(Get-Command ffmpeg.exe -ErrorAction Stop).Source
    Build-Step $node @((Join-Path $PSScriptRoot '生成礁石动画.mjs'),$ffmpeg,(Join-Path $staged 'res'))
    $manifest=Join-Path $staged 'AndroidManifest.xml'
    $aapt=Join-Path $tools 'aapt2.exe'
    $flat=Join-Path $out 'res.zip'
    $unsigned=Join-Path $out 'unsigned.apk'
    $aligned=Join-Path $out 'aligned.apk'
    Build-Step $aapt @('compile','--dir',(Join-Path $staged 'res'),'-o',$flat)
    Build-Step $aapt @('link','-I',$platform,'--manifest',$manifest,'--java',$generated,'-o',$unsigned,$flat)
    $javaSources=@(Get-ChildItem -Path (Join-Path $staged 'src'),$generated -Filter '*.java' -Recurse -File).FullName
    Build-Step (Join-Path $jdk 'javac.exe') (@('-encoding','UTF-8','-source','8','-target','8','-Xlint:-options','-classpath',$platform,'-d',$classes)+$javaSources)
    $compiled=@(Get-ChildItem -LiteralPath $classes -Filter '*.class' -Recurse -File).FullName
    Build-Step $java (@('-cp',(Join-Path $tools 'lib/d8.jar'),'com.android.tools.r8.D8','--min-api','28','--lib',$platform,'--output',$dex)+$compiled)
    $archive=[IO.Compression.ZipFile]::Open($unsigned,[IO.Compression.ZipArchiveMode]::Update)
    try { [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,(Join-Path $dex 'classes.dex'),'classes.dex') }
    finally { $archive.Dispose() }
    Build-Step (Join-Path $tools 'zipalign.exe') @('-p','-f','4',$unsigned,$aligned)
    $key=Join-Path $cache 'findn-widget-local.jks'
    if (-not (Test-Path -LiteralPath $key -PathType Leaf)) {
        Build-Step (Join-Path $jdk 'keytool.exe') @('-genkeypair','-keystore',$key,'-storepass','android','-keypass','android','-alias','findn-widget','-keyalg','RSA','-keysize','2048','-validity','3650','-dname','CN=BigFish Find N Local Widget')
    }
    $signer=Join-Path $tools 'lib/apksigner.jar'
    $signed=Join-Path $out 'signed.apk'
    Build-Step $java @('-jar',$signer,'sign','--ks',$key,'--ks-pass','pass:android','--key-pass','pass:android','--v4-signing-enabled','false','--out',$signed,$aligned)
    Build-Step $java @('-jar',$signer,'verify',$signed)
    $destination=Join-Path $PSScriptRoot 'bigfish-findn-clock-v086.apk'
    Copy-Item -LiteralPath $signed -Destination $destination -Force
    Get-Item -LiteralPath $destination | Select-Object FullName,Length
} finally {
    $resolved=(Resolve-Path -LiteralPath $out).Path
    if ([IO.Path]::GetDirectoryName($resolved).TrimEnd('\') -eq $tempRoot.TrimEnd('\') -and
        [IO.Path]::GetFileName($resolved) -match '^bigfish-widget-[a-f0-9]{32}$') {
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}
