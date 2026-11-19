param(
    [ValidateSet('smoke','full')][string]$Profile='smoke',
    [ValidateSet('light','dark')][string]$Mode='light',
    [string]$ToolRoot='D:\codex\Gen5\.airpal-tools'
)

$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$jdk=Join-Path $ToolRoot 'jdk/jdk-17.0.2/bin'
$tools=Join-Path $ToolRoot 'sdk/build-tools/35.0.0'
$platform=Join-Path $ToolRoot 'sdk/platforms/android-34/android.jar'
$icons=Join-Path $PSScriptRoot "../icon-rework-v06/$Mode"
$supplement=Join-Path $PSScriptRoot "补充图标/$Mode"
. (Join-Path $PSScriptRoot '读取图标映射.ps1')
$map=Read-FindNIconMap
$packSuffix=if ($Mode -eq 'light') {'shallow'} else {'deep'}
$packName=if ($Mode -eq 'light') {'大肥鱼浅海'} else {'大肥鱼深海'}
$version=if ($Profile -eq 'smoke') {1} else {$map.version}
$keys=if ($Profile -eq 'smoke') {@($map.smoke)} else {@($map.installed.Keys)}
$automatic=Join-Path $PSScriptRoot '图标底座方案/自动生成'
$autoEntries=@{}
$index=Join-Path $automatic '入口映射.json'
if ($Profile -eq 'full' -and (Test-Path -LiteralPath $index -PathType Leaf)) {
    $state=Get-Content -Raw -Encoding utf8 -LiteralPath $index | ConvertFrom-Json -AsHashtable
    $version=[Math]::Max([int]$version,[int]$state.version)
    $autoEntries=$state.installed
}
$file="bigfish-findn-$packSuffix-$Profile.apk"
$build=Join-Path $PSScriptRoot '.build'
New-Item -Type Directory -Force -Path $build | Out-Null
$tempRoot=[IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$job=Join-Path $tempRoot ('bigfish-findn-'+[guid]::NewGuid().ToString('N'))
$resources=Join-Path $job 'res'
$assets=Join-Path $job 'assets'
$drawables=Join-Path $resources 'drawable-xxhdpi'
$xmlResources=Join-Path $resources 'xml'
$classes=Join-Path $job 'classes'
$dex=Join-Path $job 'dex'
New-Item -Type Directory -Force -Path $assets,$drawables,$xmlResources,$classes,$dex | Out-Null

function Invoke-Tool([string]$Path,[string[]]$Arguments) {
    & $Path @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Tool failed ($LASTEXITCODE): $Path" }
}

$mappedComponents=[Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
function Add-IconMapping([string]$Component,[string]$Art) {
    if ($Component -cnotmatch '^(?<app>[\w.]+)/(?<class>[\w.$]+)$') { throw "Invalid component for $Art" }
    $app=$Matches.app
    $class=$Matches.class
    if ($class.StartsWith('.')) { $class=$app+$class }
    if (-not $mappedComponents.Add("$app/$class")) { return }
    $drawable="bf_$Art"
    $destination=Join-Path $drawables "$drawable.png"
    if (!(Test-Path -LiteralPath $destination -PathType Leaf)) {
        $source=if($autoEntries.Contains($Art)){
            Join-Path $automatic "$Mode/$Art.png"
        }else{
            Join-Path $supplement "$Art.png"
        }
        if (!(Test-Path -LiteralPath $source -PathType Leaf)) { $source=Join-Path $icons "$Art.png" }
        Copy-Item -LiteralPath $source -Destination $destination
    }
    "    <item component=`"ComponentInfo{$app/$class}`" drawable=`"$drawable`" />"
}

try {
$componentMap=@(
    foreach ($key in $keys) {
        $art=$map.artworkAliases[$key]
        if (!$art) { $art=$key }
        Add-IconMapping $map.installed[$key] $art
    }
    if ($Profile -eq 'full') {
        foreach ($art in $map.additional.Keys) {
            foreach ($component in $map.additional[$art]) {
                Add-IconMapping $component $art
            }
        }
        foreach ($art in $autoEntries.Keys) {
            Add-IconMapping $autoEntries[$art] $art
        }
    }
)
$filters = @()
if ($Profile -eq 'full') {
    $backplate=Join-Path $PSScriptRoot "图标底座方案/fallback_$Mode.png"
    Copy-Item -LiteralPath $backplate -Destination (Join-Path $drawables 'bf_fallback_back.png')
    $filters = @(
        '    <iconback img1="bf_fallback_back" />'
        '    <scale factor="0.75" />'
    )
}
$filters += @($componentMap)
$filterXml="<?xml version=`"1.0`" encoding=`"utf-8`"?>`n<resources>`n$($filters -join "`n")`n</resources>`n"
Set-Content -LiteralPath (Join-Path $assets 'appfilter.xml') -Value $filterXml -Encoding utf8NoBOM
Set-Content -LiteralPath (Join-Path $xmlResources 'appfilter.xml') -Value $filterXml -Encoding utf8NoBOM
$launcherArt=if ($Profile -eq 'full') {"bf_bigfish$packSuffix"} else {'bf_gallery'}
$applicationId="cn.bigfish.findn.icons.$packSuffix"
$includeCapture=$Profile -eq 'full' -and $Mode -eq 'dark'
$captureQueries=''
$captureComponent=''
if($includeCapture){
    $captureQueries=@"
    <queries>
        <intent>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent>
    </queries>
"@
    $captureComponent=@"
        <provider android:name="cn.bigfish.findn.icons.IconCaptureProvider"
            android:authorities="$applicationId.capture"
            android:permission="android.permission.DUMP"
            android:exported="true" />
"@
}
$manifest=@"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="$applicationId" android:versionCode="$version" android:versionName="0.$version">
    <uses-sdk android:minSdkVersion="28" android:targetSdkVersion="34" />
$captureQueries
    <application android:allowBackup="false" android:label="$packName" android:icon="@drawable/$launcherArt"
        android:theme="@android:style/Theme.Material.Light.NoActionBar">
$captureComponent
        <activity android:name="cn.bigfish.findn.icons.PackActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter>
                <action android:name="org.adw.launcher.THEMES" />
                <action android:name="com.anddoes.launcher.THEME" />
                <action android:name="com.teslacoilsw.launcher.THEME" />
                <action android:name="com.novalauncher.THEME" />
                <action android:name="com.gau.go.launcherex.theme" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="org.adw.launcher.THEMES" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"@
$manifestPath=Join-Path $job 'AndroidManifest.xml'
Set-Content -LiteralPath $manifestPath -Value $manifest -Encoding utf8NoBOM
$aapt=Join-Path $tools 'aapt2.exe'
$java=Join-Path $jdk 'java.exe'
$flat=Join-Path $job 'resources.zip'
$unsigned=Join-Path $job 'unsigned.apk'
$aligned=Join-Path $job 'aligned.apk'
Invoke-Tool $aapt @('compile','--dir',$resources,'-o',$flat)
Invoke-Tool $aapt @('link','-I',$platform,'--manifest',$manifestPath,'-A',$assets,'-o',$unsigned,$flat)
$sources=@((Join-Path $PSScriptRoot 'PackActivity.java'))
if($includeCapture){$sources+=Join-Path $PSScriptRoot 'IconCaptureProvider.java'}
Invoke-Tool (Join-Path $jdk 'javac.exe') (@('-encoding','UTF-8','-source','8','-target','8','-Xlint:-options','-classpath',$platform,'-d',$classes)+$sources)
$compiled=@(Get-ChildItem -LiteralPath $classes -Recurse -File -Filter '*.class').FullName
Invoke-Tool $java (@('-cp',(Join-Path $tools 'lib/d8.jar'),'com.android.tools.r8.D8','--min-api','28','--lib',$platform,'--output',$dex)+$compiled)
$zip=[IO.Compression.ZipFile]::Open($unsigned,[IO.Compression.ZipArchiveMode]::Update)
try { [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,(Join-Path $dex 'classes.dex'),'classes.dex') }
finally { $zip.Dispose() }
Invoke-Tool (Join-Path $tools 'zipalign.exe') @('-p','-f','4',$unsigned,$aligned)
$key=Join-Path $build 'findn-local-preview.jks'
if (!(Test-Path -LiteralPath $key -PathType Leaf)) {
    Invoke-Tool (Join-Path $jdk 'keytool.exe') @('-genkeypair','-keystore',$key,'-storepass','android','-keypass','android','-alias','bigfish-findn','-keyalg','RSA','-keysize','2048','-validity','3650','-dname','CN=BigFish Find N Local Preview','-storetype','JKS')
}
$signer=Join-Path $tools 'lib/apksigner.jar'
$out=Join-Path $job $file
Invoke-Tool $java @('-jar',$signer,'sign','--ks',$key,'--ks-pass','pass:android','--key-pass','pass:android','--v4-signing-enabled','false','--out',$out,$aligned)
Invoke-Tool $java @('-jar',$signer,'verify',$out)
$destination=Join-Path $PSScriptRoot $file
Copy-Item -LiteralPath $out -Destination $destination -Force
Get-Item -LiteralPath $destination | Select-Object Name,Length
} finally {
    $resolved=[IO.Path]::GetFullPath($job)
    if ($resolved.StartsWith($tempRoot,[StringComparison]::OrdinalIgnoreCase) -and
        [IO.Path]::GetFileName($resolved) -match '^bigfish-findn-[0-9a-f]{32}$' -and
        (Test-Path -LiteralPath $resolved -PathType Container)) {
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}
