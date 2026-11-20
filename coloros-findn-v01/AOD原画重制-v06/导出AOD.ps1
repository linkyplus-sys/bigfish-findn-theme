param(
    [string]$TargetRoot = $PSScriptRoot,
    [ValidatePattern('^v\d+$')][string]$Version = 'v06'
)


$ErrorActionPreference='Stop'
$ff=(Get-Command ffmpeg.exe).Source
$outputDir=Join-Path $TargetRoot '交付'
$animation=Join-Path $outputDir '原画微动-透明母片.mkv'
function Encode-Aod([string[]]$Arguments){
    & $ff -v error -y @Arguments
    if($LASTEXITCODE -ne 0){throw 'AOD export failed'}
}
# Preserve the source color values: no LUT, gamma, exposure or contrast filters.
$base='[0:v]split[fg][bg];[bg]lutrgb=r=0:g=0:b=0,lut=a=255[black];[black][fg]overlay=shortest=1:format=auto,format=rgb24'
# Preserve all 20 fps when importing to the phone; no 10 fps decimation.
Encode-Aod @('-i',$animation,'-filter_complex',"$base,scale=320:320:flags=lanczos,split[a][b];[a]palettegen=reserve_transparent=0[p];[b][p]paletteuse=dither=sierra2_4a",'-loop','0',(Join-Path $outputDir "蓝鲸娘AOD-$Version-FindN.gif"))
Encode-Aod @('-i',$animation,'-filter_complex',$base,'-c:v','libx264','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',(Join-Path $outputDir "蓝鲸娘AOD-$Version-预览.mp4"))
Encode-Aod @('-i',$animation,'-filter_complex',$base,'-frames:v','1',(Join-Path $outputDir "蓝鲸娘AOD-$Version-静帧.png"))
Get-ChildItem -LiteralPath $outputDir -File | Select-Object Name,Length
