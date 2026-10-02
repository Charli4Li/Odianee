Add-Type -AssemblyName System.Drawing

$dst = "c:\Users\fred1\OneDrive\Documents\GitHub\Odianee\assets\logo.png"
$bmp = [System.Drawing.Bitmap]::FromFile($dst)

# Check a circle of radius 19 at (300, 450)
$overlap = 0
for ($y = 430; $y -le 470; $y++) {
    for ($x = 280; $x -le 320; $x++) {
        $dx = $x - 300
        $dy = $y - 450
        if ($dx * $dx + $dy * $dy -le 19 * 19) {
            $p = $bmp.GetPixel($x, $y)
            if ($p.A -gt 50) {
                $overlap++
            }
        }
    }
}
Write-Host "Overlap pixels with emblem at (300, 450): $overlap"

$bmp.Dispose()
