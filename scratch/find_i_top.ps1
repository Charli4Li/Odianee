Add-Type -AssemblyName System.Drawing

$dst = "c:\Users\fred1\OneDrive\Documents\GitHub\Odianee\assets\logo.png"
$bmp = [System.Drawing.Bitmap]::FromFile($dst)

Write-Host "Finding exact top edge of letter I in assets/logo.png..."

# Letter I is between X = 340 and 380, Y between 480 and 520
$iPixels = @()
for ($y = 480; $y -le 520; $y++) {
    for ($x = 340; $x -le 380; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 100 -and $p.R -gt 180 -and $p.G -lt 60) {
            $iPixels += [PSCustomObject]@{ X = $x; Y = $y }
        }
    }
}

$minY = ($iPixels | Measure-Object -Property Y -Minimum).Minimum
$topRowPixels = $iPixels | Where-Object { $_.Y -eq $minY }
$minX = ($topRowPixels | Measure-Object -Property X -Minimum).Minimum
$maxX = ($topRowPixels | Measure-Object -Property X -Maximum).Maximum

Write-Host ("Top edge of I: Y={0}, X={1}..{2}, Center X={3}" -f $minY, $minX, $maxX, (($minX + $maxX) / 2.0))

# All pixels of I
$allMinX = ($iPixels | Measure-Object -Property X -Minimum).Minimum
$allMaxX = ($iPixels | Measure-Object -Property X -Maximum).Maximum
Write-Host ("All of I bounds in canvas: X={0}..{1} (Width={2})" -f $allMinX, $allMaxX, ($allMaxX - $allMinX + 1))

$bmp.Dispose()
