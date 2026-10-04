param([Parameter(Mandatory=$true)][string]$ImagePath)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding($false)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null=[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.BitmapTransform,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$null=[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Globalization.Language,Windows.Globalization,ContentType=WindowsRuntime]
function Await-Result($Operation,[Type]$ResultType) {
  $method=[System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {$_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'} | Select-Object -First 1
  $task=$method.MakeGenericMethod($ResultType).Invoke($null,@($Operation));try{$task.Wait()}catch{throw $task.Exception.InnerException};return $task.Result
}
$file=Await-Result ([Windows.Storage.StorageFile]::GetFileFromPathAsync((Resolve-Path -LiteralPath $ImagePath).Path)) ([Windows.Storage.StorageFile])
$stream=Await-Result ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
try {
  $decoder=Await-Result ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  if([double]$decoder.PixelWidth*$decoder.PixelHeight -gt 30000000){throw 'Image exceeds 30 million pixels'}
  $language=New-Object Windows.Globalization.Language('zh-Hans-CN')
  $engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($language)
  if(!$engine){throw 'OCR language is not installed on the server'}
  $words=New-Object System.Collections.Generic.List[object]
  # Enlarge tiny chart labels and overlap tiles. Bounds are in scaled coordinates.
  for($y=0;$y -lt $decoder.PixelHeight;$y+=1000){
    for($x=0;$x -lt $decoder.PixelWidth;$x+=1000){
      $transform=New-Object Windows.Graphics.Imaging.BitmapTransform
      $transform.ScaledWidth=$decoder.PixelWidth*2;$transform.ScaledHeight=$decoder.PixelHeight*2
      $bounds=New-Object Windows.Graphics.Imaging.BitmapBounds
      $bounds.X=$x*2;$bounds.Y=$y*2;$bounds.Width=[Math]::Min(1200,$decoder.PixelWidth-$x)*2;$bounds.Height=[Math]::Min(1200,$decoder.PixelHeight-$y)*2;$transform.Bounds=$bounds
      $bitmap=Await-Result ($decoder.GetSoftwareBitmapAsync([Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8,[Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied,$transform,[Windows.Graphics.Imaging.ExifOrientationMode]::IgnoreExifOrientation,[Windows.Graphics.Imaging.ColorManagementMode]::DoNotColorManage)) ([Windows.Graphics.Imaging.SoftwareBitmap])
      try {
        $result=Await-Result ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
        foreach($line in $result.Lines){foreach($word in $line.Words){$r=$word.BoundingRect;if(($x -eq 0 -or $r.X -gt 20) -and ($y -eq 0 -or $r.Y -gt 20) -and ($x+1200 -ge $decoder.PixelWidth -or $r.X+$r.Width -lt 2380) -and ($y+1200 -ge $decoder.PixelHeight -or $r.Y+$r.Height -lt 2380)){$words.Add(@{text=$word.Text;x=$r.X/2+$x;y=$r.Y/2+$y;width=$r.Width/2;height=$r.Height/2})}}}
      }finally{$bitmap.Dispose()}
    }
  }
  @{width=$decoder.PixelWidth;height=$decoder.PixelHeight;words=$words.ToArray();engine='Windows OCR'} | ConvertTo-Json -Depth 5 -Compress
}finally{$stream.Dispose()}
