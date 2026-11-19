param(
    [Parameter(Mandatory = $true)][string]$Source,
    [string]$Output = (Join-Path $PSScriptRoot '大肥鱼-深海蓝釉-工具栏.bda')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Drawing

# The DIY BDA uses protobuf maps for background styles. These values register
# candidate bar styles 10117 and 20117 with the corresponding texture names.
$toolbar = @{
    'port/appearanceConfig' = @{Map = 'CIVPEh0KFwoNEgtyZXNfY2FuZDFfMRIECgASABoAEgIKAA=='; Texture = 'res/res_cand1_1.png'; Width = 1080; Height = 130}
    'land/appearanceConfig' = @{Map = 'CJWdARIaChgKEhIQbGFuZF9yZXNfY2FuZDFfMRICEgA='; Texture = 'res/land_res_cand1_1.png'; Width = 2340; Height = 110}
}

$sourceZip = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $Source).Path)
try {
    if (!$sourceZip.GetEntry('diy/config.json') -or !$sourceZip.GetEntry('res/image.png')) {
        throw '源文件应为本机生成的深海 DIY BDA 皮肤。'
    }
    foreach ($path in $toolbar.Keys) {
        if (!$sourceZip.GetEntry($path) -or $sourceZip.GetEntry($toolbar[$path].Texture)) {
            throw "找不到兼容的原始 DIY 样式 $path"
        }
    }

    $targetZip = [IO.Compression.ZipFile]::Open($Output, [IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($entry in $sourceZip.Entries) {
            $targetEntry = $targetZip.CreateEntry($entry.FullName)
            if (!$entry.Name) { continue }

            $sourceStream = $entry.Open()
            try {
                $targetStream = $targetEntry.Open()
                try {
                    $sourceStream.CopyTo($targetStream)
                    if ($toolbar.ContainsKey($entry.FullName)) {
                        $map = [Convert]::FromBase64String($toolbar[$entry.FullName].Map)
                        # Field 1 with wire type 2 holds one length-delimited map entry.
                        $targetStream.WriteByte(10)
                        $targetStream.WriteByte($map.Length)
                        $targetStream.Write($map, 0, $map.Length)
                    }
                } finally { $targetStream.Dispose() }
            } finally { $sourceStream.Dispose() }
        }

        foreach ($style in $toolbar.Values) {
            $bitmap = [Drawing.Bitmap]::new($style.Width, $style.Height)
            $g = [Drawing.Graphics]::FromImage($bitmap)
            $bounds = [Drawing.Rectangle]::new(0, 0, $style.Width, $style.Height)
            $gradient = [Drawing.Drawing2D.LinearGradientBrush]::new(
                $bounds, [Drawing.Color]::FromArgb(11, 24, 42), [Drawing.Color]::FromArgb(21, 42, 64), 4
            )
            $image = [IO.MemoryStream]::new()
            try {
                $g.FillRectangle($gradient, $bounds)
                $bitmap.Save($image, [Drawing.Imaging.ImageFormat]::Png)
                $image.Position = 0
                $target = $targetZip.CreateEntry($style.Texture).Open()
                try { $image.CopyTo($target) } finally { $target.Dispose() }
            } finally {
                $image.Dispose()
                $gradient.Dispose()
                $g.Dispose()
                $bitmap.Dispose()
            }
        }
    } finally { $targetZip.Dispose() }
} finally { $sourceZip.Dispose() }

Get-Item -LiteralPath $Output
