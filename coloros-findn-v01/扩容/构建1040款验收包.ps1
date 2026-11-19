param(
    [string]$ToolRoot='D:\codex\Gen5\.airpal-tools',
    [ValidateSet('light','dark')][string[]]$Modes=@('light','dark')
)

$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$workspaceBuild=Join-Path $root '.build'
$stage=Join-Path $workspaceBuild '1040-覆盖验收'
$draftDir=Join-Path $root '扩容/制作中'
[void][IO.Directory]::CreateDirectory($stage)
$expand=Join-Path $stage '扩容'
$supplement=Join-Path $stage '补充图标'
$fallback=Join-Path $stage '图标底座方案'
$build=Join-Path $stage '.build'
foreach($dir in @($expand,$supplement,$fallback,$build)){
    [void][IO.Directory]::CreateDirectory($dir)
}
$support='读取图标映射.ps1','生成图标包.ps1','核对图标覆盖.ps1','PackActivity.java','IconCaptureProvider.java'
foreach($file in $support){Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $stage $file)}
$workspaceKey=Join-Path $workspaceBuild 'findn-local-preview.jks'
if (Test-Path -LiteralPath $workspaceKey -PathType Leaf) {
    Copy-Item -LiteralPath $workspaceKey -Destination (Join-Path $build 'findn-local-preview.jks')
}

$base=Get-Content -LiteralPath (Join-Path $root '入口映射.json') -Raw | ConvertFrom-Json -AsHashtable
$base.version=38
$base | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $stage '入口映射.json') -Encoding utf8NoBOM
foreach($file in (Get-ChildItem -LiteralPath (Join-Path $root '扩容') -Filter '*.json' -File)){
    Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $expand $file.Name)
}
$drafts=@(foreach($file in (Get-ChildItem -LiteralPath $draftDir -Filter '*.json' -File | Sort-Object Name)){
    $data=Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json -AsHashtable
    $data.apps
})
$mapped=@($drafts | Where-Object {$_.components.Count -gt 0})
if(!$mapped.Count){throw 'No reviewed expansion entries'}
$releaseDraft=[ordered]@{
    name='1,040 款扩容 · 节点验收'
    apps=@(foreach($app in $mapped){[ordered]@{art=$app.art; name=$app.name; packageId=$app.packageId; components=$app.components}})
}
$releaseDraft | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $expand '13-验收映射.json') -Encoding utf8NoBOM

. (Join-Path $stage '读取图标映射.ps1')
$m=Read-FindNIconMap
$baseIcons=Join-Path (Split-Path $root -Parent) 'icon-rework-v06'
$arts=[Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach($key in $m.installed.Keys){
    $alias=$m.artworkAliases[$key]
    [void]$arts.Add(($alias ? $alias : $key))
}
foreach($key in $m.additional.Keys){[void]$arts.Add($key)}
$versions=@{light=38; dark=40}
$palettes=@{light='shallow'; dark='deep'}
foreach($mode in $Modes){
    $base.version=$versions[$mode]
    $base | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $stage '入口映射.json') -Encoding utf8NoBOM
    $out=Join-Path $supplement $mode
    [void][IO.Directory]::CreateDirectory($out)
    $backplate="fallback_$mode.png"
    Copy-Item -LiteralPath (Join-Path $root "图标底座方案/$backplate") -Destination (Join-Path $fallback $backplate)
    foreach($art in $arts){
        $source=Join-Path $root "补充图标/$mode/$art.png"
        if(!(Test-Path -LiteralPath $source -PathType Leaf)){$source=Join-Path $baseIcons "$mode/$art.png"}
        Copy-Item -LiteralPath $source -Destination (Join-Path $out "$art.png")
    }
    & (Join-Path $stage '生成图标包.ps1') -Profile full -Mode $mode -ToolRoot $ToolRoot
    "验收版 $($palettes[$mode]) 0.$($versions[$mode])"
}
$selectedPalettes=@(foreach($mode in $Modes){$palettes[$mode]})
& (Join-Path $stage '核对图标覆盖.ps1') -Palettes $selectedPalettes
"新增入包 $($mapped.Count) 款，剩余 $($drafts.Count-$mapped.Count) 款待核对。"
