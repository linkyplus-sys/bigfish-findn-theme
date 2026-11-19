param([string]$Output = (Join-Path $PSScriptRoot '大肥鱼-深海蓝釉-键盘背景.png'))

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '键盘绘图函数.ps1')

$surface = New-Canvas 1440 1100
$g = $surface.G
$g.ScaleTransform(2, 2)
$bounds = [Drawing.Rectangle]::new(0, 0, 720, 550)
$base = [Drawing.Drawing2D.LinearGradientBrush]::new($bounds, (Color '#0B182A'), (Color '#1D344E'), 72)
$reflection = Curve 'M 0 501 C 178 495 263 506 366 470 C 481 429 545 456 720 411 L 720 550 L 0 550 Z'
$tail = Curve 'M 607 433 C 623 427 637 430 647 443 C 657 430 672 427 687 433 C 681 449 668 458 654 460 C 654 470 657 477 661 484 C 652 482 648 478 645 472 C 642 478 637 482 629 483 C 633 477 637 469 637 460 C 625 458 612 449 607 433 Z'
try {
    $g.FillRectangle($base, $bounds)
    Paint $g $reflection (Alpha 42 '#6DA8C7') (Alpha 2 '#172840') 79
    Line $g 'M 0 503 C 178 495 264 506 366 470 C 481 429 544 455 720 411' (Alpha 58 '#79BBDC') 1.2
    Line $g 'M 45 541 C 186 533 296 531 391 506 C 490 479 604 485 720 450' (Alpha 38 '#87C7DE') 0.9
    Fill $g $tail (Alpha 42 '#98CEE4')
    $surface.Bitmap.Save($Output, [Drawing.Imaging.ImageFormat]::Png)
} finally {
    $tail.Dispose()
    $reflection.Dispose()
    $base.Dispose()
    $g.Dispose()
    $surface.Bitmap.Dispose()
}
Get-Item -LiteralPath $Output
