Add-Type -AssemblyName System.Drawing

function Color([string]$Hex) { [Drawing.ColorTranslator]::FromHtml($Hex) }

function Alpha([int]$Opacity,[string]$Hex) { [Drawing.Color]::FromArgb($Opacity,(Color $Hex)) }

function New-Canvas([int]$Width,[int]$Height) {
    $bitmap=[Drawing.Bitmap]::new($Width,$Height,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g=[Drawing.Graphics]::FromImage($bitmap)
    $g.SmoothingMode=[Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint=[Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    return @{Bitmap=$bitmap; G=$g}
}

function Curve([string]$Data) {
    $path=[Drawing.Drawing2D.GraphicsPath]::new()
    $parts=$Data.Trim() -split '\s+'
    $x=0.0; $y=0.0
    for ($i=0; $i -lt $parts.Count;) {
        $op=$parts[$i++]
        switch ($op) {
            M { $path.StartFigure(); $x=[single]$parts[$i++]; $y=[single]$parts[$i++] }
            L {
                $nextX=[single]$parts[$i++]; $nextY=[single]$parts[$i++]
                $path.AddLine([single]$x,[single]$y,$nextX,$nextY)
                $x=$nextX; $y=$nextY
            }
            C {
                $a=[single]$parts[$i++]; $b=[single]$parts[$i++]; $c=[single]$parts[$i++]; $d=[single]$parts[$i++]
                $nextX=[single]$parts[$i++]; $nextY=[single]$parts[$i++]
                $path.AddBezier([single]$x,[single]$y,$a,$b,$c,$d,$nextX,$nextY)
                $x=$nextX; $y=$nextY
            }
            Z { $path.CloseFigure() }
            default {throw "Unknown drawing command $op"}
        }
    }
    return $path
}

function Round([single]$X,[single]$Y,[single]$W,[single]$H,[single]$R) {
    $path=[Drawing.Drawing2D.GraphicsPath]::new()
    $d=2*$R
    $path.AddArc($X,$Y,$d,$d,180,90)
    $path.AddArc(($X+$W-$d),$Y,$d,$d,270,90)
    $path.AddArc(($X+$W-$d),($Y+$H-$d),$d,$d,0,90)
    $path.AddArc($X,($Y+$H-$d),$d,$d,90,90)
    $path.CloseFigure()
    return $path
}

function Fill($G,$Path,[Drawing.Color]$Ink) {
    $brush=[Drawing.SolidBrush]::new($Ink)
    try {$G.FillPath($brush,$Path)} finally {$brush.Dispose()}
}

function Paint($G,$Path,[Drawing.Color]$Top,[Drawing.Color]$Bottom,[single]$Degrees=85) {
    $brush=[Drawing.Drawing2D.LinearGradientBrush]::new($Path.GetBounds(),$Top,$Bottom,$Degrees)
    try {$G.FillPath($brush,$Path)} finally {$brush.Dispose()}
}

function Stroke($G,$Path,[Drawing.Color]$Ink,[single]$Width=1.0) {
    $pen=[Drawing.Pen]::new($Ink,$Width)
    $pen.LineJoin=[Drawing.Drawing2D.LineJoin]::Round
    $pen.StartCap=[Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap=[Drawing.Drawing2D.LineCap]::Round
    try {$G.DrawPath($pen,$Path)} finally {$pen.Dispose()}
}

function Line($G,[string]$Data,[Drawing.Color]$Ink,[single]$Width=2) {
    $path=Curve $Data
    try {Stroke $G $path $Ink $Width} finally {$path.Dispose()}
}
