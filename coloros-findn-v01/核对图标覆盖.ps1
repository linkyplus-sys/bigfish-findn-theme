param([ValidateSet('shallow','deep')][string[]]$Palettes=@('shallow','deep'))

$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot '读取图标映射.ps1')
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Add-ExpectedIcon([string]$Component,[string]$Artwork) {
    $package,$activity=$Component -csplit '/',2
    if($activity.StartsWith('.')){$activity=$package+$activity}
    $expected.Add("ComponentInfo{$package/$activity}","bf_$Artwork")
}

$map=Read-FindNIconMap
$expected=[Collections.Generic.Dictionary[string,string]]::new([StringComparer]::Ordinal)
foreach($key in $map.installed.Keys){
    $art=$map.artworkAliases[$key]
    if(-not $art){$art=$key}
    Add-ExpectedIcon $map.installed[$key] $art
}
foreach($art in $map.additional.Keys){
    foreach($component in $map.additional[$art]){
        Add-ExpectedIcon $component $art
    }
}

foreach($palette in $Palettes){
    $path=Join-Path $PSScriptRoot "bigfish-findn-$palette-full.apk"
    $apk=[IO.Compression.ZipFile]::OpenRead($path)
    try{
        $reader=[IO.StreamReader]::new($apk.GetEntry('assets/appfilter.xml').Open())
        try{[xml]$filter=$reader.ReadToEnd()}finally{$reader.Dispose()}
        $entries=[Collections.Generic.Dictionary[string,string]]::new([StringComparer]::Ordinal)
        $packages=[Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
        $resources=[Collections.Generic.HashSet[string]]::new([string[]]$apk.Entries.Name,[StringComparer]::Ordinal)
        foreach($item in $filter.resources.item){
            if($item.component -cnotmatch '^ComponentInfo\{(?<package>[\w.]+)/[\w.$]+\}$'){
                throw "Invalid APK component: $($item.component)"
            }
            $package=$Matches.package
            $entries.Add($item.component,$item.drawable)
            if(-not $resources.Contains("$($item.drawable).png")){
                throw "Missing $palette drawable: $($item.drawable)"
            }
            if($package -cnotlike 'cn.bigfish.findn.*'){
                [void]$packages.Add($package)
            }
        }
        foreach($component in $expected.Keys){
            if($entries[$component] -cne $expected[$component]){
                throw "Wrong or missing $palette icon for $component"
            }
        }
        [pscustomobject]@{图标包=$palette;App包名=$packages.Count;启动入口=$entries.Count;预置入口=$expected.Count}
    }finally{$apk.Dispose()}
}
