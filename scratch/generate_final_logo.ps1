$code = @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class FinalLogoGenerator {
    private static void DistanceTransform1D(float[] f, float[] d, int[] v, float[] z, int n) {
        int k = 0;
        v[0] = 0;
        z[0] = -1e20f;
        z[1] = 1e20f;

        for (int q = 1; q < n; q++) {
            float s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
            while (s <= z[k]) {
                k--;
                s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
            }
            k++;
            v[k] = q;
            z[k] = s;
            z[k + 1] = 1e20f;
        }

        k = 0;
        for (int q = 0; q < n; q++) {
            while (z[k + 1] < q) k++;
            int vk = v[k];
            d[q] = (q - vk) * (q - vk) + f[vk];
        }
    }

    public static float[,] ComputeDistanceField(bool[,] mask, int width, int height) {
        float[,] dt = new float[width, height];
        float[] f = new float[Math.Max(width, height)];
        float[] d = new float[Math.Max(width, height)];
        int[] v = new int[Math.Max(width, height)];
        float[] z = new float[Math.Max(width, height) + 1];

        // Column transform
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                f[y] = mask[x, y] ? 0f : 1e10f;
            }
            DistanceTransform1D(f, d, v, z, height);
            for (int y = 0; y < height; y++) {
                dt[x, y] = d[y];
            }
        }

        // Row transform
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                f[x] = dt[x, y];
            }
            DistanceTransform1D(f, d, v, z, width);
            for (int x = 0; x < width; x++) {
                dt[x, y] = (float)Math.Sqrt(d[x]);
            }
        }

        return dt;
    }

    public static void Generate(
        string srcPath,
        string dstPath,
        float strokeRadius,
        float tmScale,
        int leftPad,
        int rightPad,
        int topPad,
        int bottomPad,
        int tmTargetX,
        int tmTargetY
    ) {
        using (Bitmap srcBmp = (Bitmap)Image.FromFile(srcPath)) {
            int origW = srcBmp.Width;
            int origH = srcBmp.Height;

            // 1. Extract FULL TM symbol cleanly (X: 861..941, Y: 0..79 in orig)
            // No clipping! Complete circular ring + letters
            int tmSrcX = 861;
            int tmSrcY = 0;
            int tmSrcW = 81;
            int tmSrcH = 80;
            
            Bitmap tmBmp = new Bitmap(tmSrcW, tmSrcH, PixelFormat.Format32bppArgb);
            using (Graphics gTm = Graphics.FromImage(tmBmp)) {
                gTm.InterpolationMode = InterpolationMode.HighQualityBicubic;
                gTm.SmoothingMode = SmoothingMode.HighQuality;
                gTm.PixelOffsetMode = PixelOffsetMode.HighQuality;
                gTm.DrawImage(srcBmp, 
                    new Rectangle(0, 0, tmSrcW, tmSrcH),
                    new Rectangle(tmSrcX, tmSrcY, tmSrcW, tmSrcH),
                    GraphicsUnit.Pixel);
            }

            // Scale TM symbol smoothly with high quality bicubic interpolation
            int scaledTmW = (int)Math.Round(tmSrcW * tmScale);
            int scaledTmH = (int)Math.Round(tmSrcH * tmScale);
            Bitmap scaledTm = new Bitmap(scaledTmW, scaledTmH, PixelFormat.Format32bppArgb);
            using (Graphics gScaled = Graphics.FromImage(scaledTm)) {
                gScaled.InterpolationMode = InterpolationMode.HighQualityBicubic;
                gScaled.SmoothingMode = SmoothingMode.HighQuality;
                gScaled.PixelOffsetMode = PixelOffsetMode.HighQuality;
                gScaled.DrawImage(tmBmp, 0, 0, scaledTmW, scaledTmH);
            }
            tmBmp.Dispose();

            // 2. Prepare canvas dimensions
            // Emblem (X: 0..940, width 941). With leftPad and rightPad:
            int canvasW = 941 + leftPad + rightPad;
            int canvasH = origH + topPad + bottomPad;

            // Intermediate base image: emblem + text, but old TM region completely cleared
            Bitmap cleanBase = new Bitmap(canvasW, canvasH, PixelFormat.Format32bppArgb);
            using (Graphics gBase = Graphics.FromImage(cleanBase)) {
                gBase.DrawImage(srcBmp, leftPad, topPad, new Rectangle(0, 0, 941, origH), GraphicsUnit.Pixel);

                // Clear old TM region completely (X >= 855 in orig, Y <= 85 in orig)
                using (SolidBrush clearBrush = new SolidBrush(Color.Transparent)) {
                    gBase.CompositingMode = CompositingMode.SourceCopy;
                    gBase.FillRectangle(clearBrush, leftPad + 855, 0, canvasW - (leftPad + 855), topPad + 88);
                }
            }

            // 3. Build binary mask for the emblem ONLY (Y < topPad + 463)
            // The text underneath (Y >= topPad + 463) must NOT have stroke!
            bool[,] emblemMask = new bool[canvasW, canvasH];
            int emblemCutoffY = topPad + 463;

            BitmapData baseData = cleanBase.LockBits(
                new Rectangle(0, 0, canvasW, canvasH),
                ImageLockMode.ReadOnly,
                PixelFormat.Format32bppArgb);

            byte[] baseBytes = new byte[baseData.Stride * canvasH];
            Marshal.Copy(baseData.Scan0, baseBytes, 0, baseBytes.Length);
            cleanBase.UnlockBits(baseData);

            for (int y = 0; y < emblemCutoffY; y++) {
                int rowOffset = y * baseData.Stride;
                for (int x = 0; x < canvasW; x++) {
                    int a = baseBytes[rowOffset + x * 4 + 3];
                    if (a > 60) {
                        emblemMask[x, y] = true;
                    }
                }
            }

            // 4. Compute Euclidean Distance Field for smooth stroke
            float[,] dt = ComputeDistanceField(emblemMask, canvasW, canvasH);

            // 5. Render composited image: smooth anti-aliased stroke underneath emblem
            Bitmap finalBmp = new Bitmap(canvasW, canvasH, PixelFormat.Format32bppArgb);
            BitmapData finalData = finalBmp.LockBits(
                new Rectangle(0, 0, canvasW, canvasH),
                ImageLockMode.WriteOnly,
                PixelFormat.Format32bppArgb);

            byte[] finalBytes = new byte[finalData.Stride * canvasH];

            // Stroke color: #761321 (R=118, G=19, B=33)
            byte sR = 118;
            byte sG = 19;
            byte sB = 33;

            // Anti-aliasing range around strokeRadius
            float rInner = strokeRadius - 0.75f;
            float rOuter = strokeRadius + 0.75f;
            float rRange = rOuter - rInner;

            for (int y = 0; y < canvasH; y++) {
                int rowOffset = y * baseData.Stride;
                for (int x = 0; x < canvasW; x++) {
                    int pxOffset = rowOffset + x * 4;

                    byte origB = baseBytes[pxOffset + 0];
                    byte origG = baseBytes[pxOffset + 1];
                    byte origR = baseBytes[pxOffset + 2];
                    byte origA = baseBytes[pxOffset + 3];

                    float origAlpha = origA / 255.0f;

                    // Compute smooth stroke alpha (only for emblem, y < emblemCutoffY)
                    float strokeAlpha = 0f;
                    if (y < emblemCutoffY) {
                        float dist = dt[x, y];
                        if (dist <= rInner) {
                            strokeAlpha = 1.0f;
                        } else if (dist < rOuter) {
                            strokeAlpha = (rOuter - dist) / rRange;
                        }
                    }

                    // Composite original over stroke
                    // A_out = A_orig + A_stroke * (1 - A_orig)
                    float outAlpha = origAlpha + strokeAlpha * (1.0f - origAlpha);

                    if (outAlpha > 0.001f) {
                        float outR = (origR * origAlpha + sR * strokeAlpha * (1.0f - origAlpha)) / outAlpha;
                        float outG = (origG * origAlpha + sG * strokeAlpha * (1.0f - origAlpha)) / outAlpha;
                        float outB = (origB * origAlpha + sB * strokeAlpha * (1.0f - origAlpha)) / outAlpha;

                        finalBytes[pxOffset + 0] = (byte)Math.Min(255, Math.Max(0, (int)Math.Round(outB)));
                        finalBytes[pxOffset + 1] = (byte)Math.Min(255, Math.Max(0, (int)Math.Round(outG)));
                        finalBytes[pxOffset + 2] = (byte)Math.Min(255, Math.Max(0, (int)Math.Round(outR)));
                        finalBytes[pxOffset + 3] = (byte)Math.Min(255, Math.Max(0, (int)Math.Round(outAlpha * 255f)));
                    } else {
                        finalBytes[pxOffset + 0] = 0;
                        finalBytes[pxOffset + 1] = 0;
                        finalBytes[pxOffset + 2] = 0;
                        finalBytes[pxOffset + 3] = 0;
                    }
                }
            }

            Marshal.Copy(finalBytes, 0, finalData.Scan0, finalBytes.Length);
            finalBmp.UnlockBits(finalData);

            // 6. Draw the scaled TM symbol cleanly at the target coordinates
            using (Graphics gFinal = Graphics.FromImage(finalBmp)) {
                gFinal.InterpolationMode = InterpolationMode.HighQualityBicubic;
                gFinal.SmoothingMode = SmoothingMode.HighQuality;
                gFinal.PixelOffsetMode = PixelOffsetMode.HighQuality;
                gFinal.CompositingMode = CompositingMode.SourceOver;

                gFinal.DrawImage(scaledTm, tmTargetX, tmTargetY);
            }

            scaledTm.Dispose();
            cleanBase.Dispose();

            finalBmp.Save(dstPath, ImageFormat.Png);
            finalBmp.Dispose();
        }
    }
}
"@

Add-Type -TypeDefinition $code -ReferencedAssemblies "System.Drawing"

$src = "c:\Users\fred1\OneDrive\Documents\GitHub\Odianee\assets\logo.png.bak"
$dst = "c:\Users\fred1\OneDrive\Documents\GitHub\Odianee\assets\logo.png"

# strokeRadius = 4.0 px (increased stroke size, perfectly smooth)
# tmScale = 0.58 (~46x46 px, crisp, complete circle)
# leftPad = 25, rightPad = 24 => canvasW = 990 (Dead center: 25 + 470 = 495 = 990 / 2)
# topPad = 14, bottomPad = 14 => canvasH = 630
# tmTargetX = 25 + 875 = 900
# tmTargetY = 14 + 10 = 24
[FinalLogoGenerator]::Generate(
    $src,
    $dst,
    4.0,  # strokeRadius
    0.58, # tmScale
    25,   # leftPad
    24,   # rightPad
    14,   # topPad
    14,   # bottomPad
    900,  # tmTargetX
    24    # tmTargetY
)

Write-Host "assets/logo.png successfully created!"
