param(
    [Parameter(Mandatory = $true)][string]$Template,
    [string]$Source = (Join-Path $PSScriptRoot '大肥鱼-深海蓝釉-V2.1.bda'),
    [string]$Audio = (Join-Path $PSScriptRoot '深海玻璃按键音-试听.wav'),
    [string]$Output = (Join-Path $PSScriptRoot '大肥鱼-深海蓝釉-V2.1-玻璃音.bda')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$destination = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Output)
if (Test-Path -LiteralPath $destination) { throw '输出位置已经有皮肤包。' }

$work = Join-Path $PSScriptRoot '../.build/baidu-ime-deep/key-sound-build'
[void][IO.Directory]::CreateDirectory($work)
$normalAudio = @('0.140', '0.044')
$functionAudio = @('1.320', '0.062')
$added = [ordered]@{}

foreach ($setup in @(@('main_key', $normalAudio), @('function_key', $functionAudio))) {
    $name = $setup[0]
    $start, $length = $setup[1]
    $ogg = Join-Path $work "$name.ogg"
    $aiff = Join-Path $work "$name.aiff"
    $filter = 'volume=1.85,apad=pad_dur=0.04'
    ffmpeg -hide_banner -loglevel error -y -i $Audio -af "atrim=start=$start`:duration=$length,asetpts=PTS-STARTPTS,$filter" -ac 2 -ar 48000 -c:a libvorbis -q:a 4 $ogg
    if ($LASTEXITCODE -ne 0) { throw "无法生成 $ogg" }
    ffmpeg -hide_banner -loglevel error -y -i $Audio -af "atrim=start=$start`:duration=$length,asetpts=PTS-STARTPTS,$filter" -ac 2 -ar 48000 -c:a pcm_s16be $aiff
    if ($LASTEXITCODE -ne 0) { throw "无法生成 $aiff" }
    $added["res/$name.ogg"] = $ogg
    $added["res/$name.aiff"] = $aiff
}
$added['res/default.ogg'] = $added['res/main_key.ogg']
$added['res/default.aiff'] = $added['res/main_key.aiff']

$reference = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Template).Path)
try {
    foreach ($orientation in @('port', 'land')) {
        $path = "$orientation/soundConfig"
        $style = $reference.GetEntry($path)
        if (!$style) { throw "预设模板缺少 $path" }
        $local = Join-Path $work "$orientation-soundConfig"
        [IO.Compression.ZipFileExtensions]::ExtractToFile($style, $local, $true)
        $added[$path] = $local
    }
} finally { $reference.Dispose() }

$base = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Source).Path)
try {
    foreach ($path in $added.Keys) {
        if ($base.GetEntry($path)) { throw "源皮肤已经包含 $path" }
    }
    $target = [IO.Compression.ZipFile]::Open($destination, [IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($item in $base.Entries) {
            $entry = $target.CreateEntry($item.FullName)
            if (!$item.Name) { continue }
            $sourceStream = $item.Open()
            try {
                $targetStream = $entry.Open()
                try { $sourceStream.CopyTo($targetStream) } finally { $targetStream.Dispose() }
            } finally { $sourceStream.Dispose() }
        }
        foreach ($path in $added.Keys) {
            [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($target, $added[$path], $path)
        }
    } finally { $target.Dispose() }
} finally { $base.Dispose() }

Get-Item -LiteralPath $destination
