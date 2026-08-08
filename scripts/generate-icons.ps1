# Generates PWA/favicon PNG assets from the AutoPilot mark
# (public/landing/final-center-logo.png) using .NET System.Drawing —
# no image-processing npm dependency needed. Re-run after the source
# logo changes: `pwsh scripts/generate-icons.ps1`.
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root "public\landing\final-center-logo.png"
$iconsDir = Join-Path $root "public\icons"
$appDir = Join-Path $root "app"
$brandColor = [System.Drawing.Color]::FromArgb(255, 0x4F, 0x46, 0xE5) # --color-primary

New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null

function New-ResizedIcon {
    param(
        [System.Drawing.Image]$Source,
        [int]$Size,
        [string]$OutPath
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($Source, 0, 0, $Size, $Size)
    $g.Dispose()
    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

function New-PaddedIcon {
    param(
        [System.Drawing.Image]$Source,
        [int]$Size,
        [double]$ContentScale,
        [System.Drawing.Color]$BackgroundColor,
        [string]$OutPath
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.Clear($BackgroundColor)

    $contentSize = [int]([math]::Round($Size * $ContentScale))
    $offset = [int]([math]::Round(($Size - $contentSize) / 2))
    $g.DrawImage($Source, $offset, $offset, $contentSize, $contentSize)
    $g.Dispose()
    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$src = [System.Drawing.Image]::FromFile((Resolve-Path $source))

# Standard (transparent background, direct resize) — favicon + manifest "any" purpose
foreach ($size in 16, 32, 48, 96, 128, 144, 152, 192, 256, 384, 512) {
    New-ResizedIcon -Source $src -Size $size -OutPath (Join-Path $iconsDir "icon-$size.png")
}

# Next.js auto favicon/apple-icon file convention
New-ResizedIcon -Source $src -Size 32 -OutPath (Join-Path $appDir "icon.png")
New-PaddedIcon -Source $src -Size 180 -ContentScale 0.94 -BackgroundColor $brandColor -OutPath (Join-Path $appDir "apple-icon.png")

# Maskable (Android adaptive icons) — full-bleed brand-color background,
# content scaled into the ~66% safe zone so OS masking never clips the mark.
foreach ($size in 192, 512) {
    New-PaddedIcon -Source $src -Size $size -ContentScale 0.66 -BackgroundColor $brandColor -OutPath (Join-Path $iconsDir "icon-$size-maskable.png")
}

$src.Dispose()

Write-Host "Generated icons in $iconsDir, app/icon.png, app/apple-icon.png"
