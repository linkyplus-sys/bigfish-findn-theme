function Read-FindNIconMap {
    $basePath=Join-Path $PSScriptRoot '入口映射.json'
    $map=Get-Content -LiteralPath $basePath -Raw -Encoding utf8 | ConvertFrom-Json -AsHashtable
    $dir=Join-Path $PSScriptRoot '扩容'
    foreach($file in (Get-ChildItem -LiteralPath $dir -Filter '*.json' -File | Sort-Object Name)){
        $batch=Get-Content -LiteralPath $file.FullName -Raw -Encoding utf8 | ConvertFrom-Json -AsHashtable
        foreach($app in $batch.apps){
            $art=$app.art
            if($art -cnotmatch '^[a-z][a-z0-9_]*$' -or -not $app.components.Count){
                throw "Invalid app artwork or components in $($file.Name): $art"
            }
            if($map.installed.Contains($art) -or $map.additional.Contains($art)){
                throw "Artwork key already in use: $art"
            }
            $map.additional[$art]=$app.components
        }
    }
    $map
}
