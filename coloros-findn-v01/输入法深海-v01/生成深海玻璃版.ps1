param(
    [string]$Source = (Join-Path $PSScriptRoot '大肥鱼-深海蓝釉-工具栏.bda'),
    [string]$Output = (Join-Path $PSScriptRoot '大肥鱼-深海蓝釉-V2.1.bda'),
    [switch]$KeycapsOnly
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '键盘绘图函数.ps1')
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Save-Canvas($Canvas, [string]$Path) {
    try { $Canvas.Bitmap.Save($Path, [Drawing.Imaging.ImageFormat]::Png) }
    finally { $Canvas.G.Dispose(); $Canvas.Bitmap.Dispose() }
}

function Draw-Ocean([string]$Path) {
    $canvas = New-Canvas 900 756
    $g = $canvas.G
    $background = Round 0 0 900 756 0.1
    $upperWave = Curve 'M 0 370 C 122 380 201 471 377 448 C 533 426 682 258 900 338 L 900 756 L 0 756 Z'
    $lowerWave = Curve 'M 0 625 C 164 669 344 582 512 498 C 690 411 782 401 900 466 L 900 756 L 0 756 Z'
    try {
        Paint $g $background (Color '#0C1A2C') (Color '#1B3C54') 46
        Paint $g $upperWave (Alpha 76 '#5F9EB4') (Alpha 5 '#112D45') 91
        Paint $g $lowerWave (Alpha 21 '#234B67') (Alpha 112 '#153654') 102
        Line $g 'M 0 370 C 122 380 201 471 377 448 C 533 426 682 258 900 338' (Alpha 36 '#8CC5D9') 2.2
        Line $g 'M 160 500 C 304 524 403 482 530 411 C 660 339 781 304 890 350' (Alpha 25 '#9BD0E0') 1.8
        Line $g 'M 32 632 C 166 660 344 582 512 498 C 667 428 791 398 900 468' (Alpha 29 '#73A9C2') 2.1
        Save-Canvas $canvas $Path
    } finally { $background.Dispose(); $upperWave.Dispose(); $lowerWave.Dispose() }
}

function Draw-Key([string]$Path, [string]$Kind, [bool]$Pressed) {
    $canvas = New-Canvas 92 140
    $g = $canvas.G
    $faceTop, $faceBottom, $rim = switch ($Kind) {
        'letter'   { '#3B6078', '#172B40', '#A9D4E4' }
        'function' { '#315268', '#14283C', '#9BC1D3' }
        'return'   { '#3B5D74', '#182D41', '#A9D3DF' }
    }
    $capTop = 3
    $capHeight = 129
    $cover = 198
    $light = 104
    if ($Pressed) {
        $capTop = 6
        $capHeight = 127
        $faceTop = '#679AAB'
        $faceBottom = '#284E67'
        $cover = 218
        $light = 153
    }

    $shadow = Round 2 ($capTop + 4) 88 $capHeight 21
    $body = Round 2 $capTop 88 $capHeight 21
    $inner = Round 3.5 ($capTop + 1.5) 85 ($capHeight - 3) 19.5
    $shine = [Drawing.Drawing2D.GraphicsPath]::new()
    $shine.AddEllipse(-22, -27, 114, 98)
    $reflection = [Drawing.Drawing2D.PathGradientBrush]::new($shine)
    $reflection.CenterPoint = [Drawing.PointF]::new(25, 16)
    $reflection.CenterColor = Alpha 75 '#C6EEFF'
    $reflection.SurroundColors = [Drawing.Color[]]@((Alpha 0 '#C6EEFF'))
    $rimPen = [Drawing.Pen]::new((Alpha $light $rim), 1.8)
    $edgeBounds = [Drawing.RectangleF]::new(0, $capTop, 92, $capHeight)
    $edgeLight = [Drawing.Drawing2D.LinearGradientBrush]::new($edgeBounds, (Alpha 87 '#B7E0E9'), (Alpha 18 '#86AFC4'), 45)
    $edgeBlend = [Drawing.Drawing2D.ColorBlend]::new(4)
    $edgeBlend.Positions = [single[]]@(0, 0.17, 0.56, 1)
    $edgeBlend.Colors = [Drawing.Color[]]@((Alpha 35 '#A4CFDD'), (Alpha 100 '#B8E0EB'), (Alpha 23 '#90BACA'), (Alpha 16 '#86AFC4'))
    $edgeLight.InterpolationColors = $edgeBlend
    $innerPen = [Drawing.Pen]::new($edgeLight, 1.1)
    try {
        Fill $g $shadow (Alpha 154 '#06101B')
        Paint $g $body (Alpha $cover $faceTop) (Alpha ($cover + 12) $faceBottom) 98
        $clip = $g.Save()
        try {
            $g.SetClip($body)
            $g.FillPath($reflection, $shine)
        } finally { $g.Restore($clip) }
        $g.DrawPath($rimPen, $body)
        $g.DrawPath($innerPen, $inner)
        $bottom = $capTop + $capHeight - 3
        Line $g "M 22 $bottom L 69 $bottom C 77 $bottom 81 $($bottom - 3) 82 $($bottom - 6)" (Alpha 81 '#58869D') 1.3
        Save-Canvas $canvas $Path
    } finally {
        $rimPen.Dispose(); $innerPen.Dispose(); $shadow.Dispose(); $body.Dispose(); $inner.Dispose()
        $reflection.Dispose(); $shine.Dispose(); $edgeLight.Dispose()
    }
}

function Draw-WhaleTail([string]$Path, [string]$Ink) {
    $canvas = New-Canvas 65 58
    $tail = Curve 'M 4 15 C 15 10 26 14 32.5 24 C 39 14 50 10 61 15 C 56 27 47 32 38 32 C 38 38 41 44 44 48 C 39 48 35 45 32.5 42 C 30 45 26 48 21 48 C 24 43 27 38 27 32 C 18 32 9 27 4 15 Z'
    try {
        Fill $canvas.G $tail (Color $Ink)
        Save-Canvas $canvas $Path
    } finally { $tail.Dispose() }
}

function Draw-SpaceArc([string]$Path) {
    $canvas = New-Canvas 118 23
    Line $canvas.G 'M 12 16 C 33 15 47 20 59 18 C 80 16 91 7 106 8' (Alpha 230 '#B2D5E3') 4.4
    Save-Canvas $canvas $Path
}

$sourcePath = (Resolve-Path -LiteralPath $Source).ProviderPath
$outputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Output)
if ($sourcePath -eq $outputPath -or (Test-Path -LiteralPath $outputPath)) {
    throw '请为深海玻璃版指定新的 BDA 输出路径。'
}
$stage = Join-Path $PSScriptRoot '../.build/baidu-ime-deep/glass-edge-assets'
[void][IO.Directory]::CreateDirectory($stage)
$images = @{
    'res/res_btn_1.png' = 'letter-idle.png'
    'res/res_btn_2.png' = 'letter-press.png'
    'res/bf_func_idle.png' = 'function-idle.png'
    'res/bf_func_press.png' = 'function-press.png'
    'res/bf_enter_idle.png' = 'return-idle.png'
    'res/bf_enter_press.png' = 'return-press.png'
}

foreach ($kind in @('letter', 'function', 'return')) {
    Draw-Key (Join-Path $stage "$kind-idle.png") $kind $false
    Draw-Key (Join-Path $stage "$kind-press.png") $kind $true
}
if (!$KeycapsOnly) {
    Draw-Ocean (Join-Path $stage 'ocean.png')
    Draw-WhaleTail (Join-Path $stage 'menu-idle.png') '#C7E8F0'
    Draw-WhaleTail (Join-Path $stage 'menu-press.png') '#A4E5EF'
    Draw-SpaceArc (Join-Path $stage 'space.png')
    $images['res/image.png'] = 'ocean.png'
    $images['diy/image.png'] = 'ocean.png'
    $images['res/res_fore3_1.png'] = 'menu-idle.png'
    $images['res/res_fore3_5.png'] = 'menu-press.png'
    $images['res/res_space_2.png'] = 'space.png'
}

$base = [IO.Compression.ZipFile]::OpenRead($sourcePath)
try {
    $updated = @{}
    if ($KeycapsOnly) {
        foreach ($entry in $images.Keys) {
            if (!$base.GetEntry($entry)) { throw "源皮肤缺少已适配的键帽资源 $entry" }
        }
    } else {
        foreach ($orientation in @('port', 'land')) {
            $entry = "$orientation/appearanceConfig"
            $original = $base.GetEntry($entry)
            if (!$original) { throw "缺少外观配置 $entry" }
            $local = Join-Path $stage "$orientation-appearance.bin"
            [IO.Compression.ZipFileExtensions]::ExtractToFile($original, $local, $true)
            $updated[$entry] = $local
        }
        & node (Join-Path $PSScriptRoot '改写玻璃键盘样式.cjs') $updated['port/appearanceConfig'] $updated['land/appearanceConfig']
        if ($LASTEXITCODE -ne 0) { throw '改写外观配置失败。' }
    }
    foreach ($item in $images.GetEnumerator()) { $updated[$item.Key] = Join-Path $stage $item.Value }

    $target = [IO.Compression.ZipFile]::Open($outputPath, [IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($original in $base.Entries) {
            if ($updated.ContainsKey($original.FullName)) { continue }
            $entry = $target.CreateEntry($original.FullName)
            if (!$original.Name) { continue }
            $sourceStream = $original.Open()
            try {
                $targetStream = $entry.Open()
                try { $sourceStream.CopyTo($targetStream) } finally { $targetStream.Dispose() }
            } finally { $sourceStream.Dispose() }
        }
        foreach ($item in $updated.GetEnumerator()) {
            [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($target, $item.Value, $item.Key)
        }
    } finally { $target.Dispose() }
} finally { $base.Dispose() }

Get-Item -LiteralPath $outputPath
