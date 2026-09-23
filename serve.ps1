# 轻量静态文件服务（仅用于本地预览 mh-controls.html）
$dir  = $PSScriptRoot
$port = 8850

$tcp = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
$tcp.Start()
Write-Host "serving $dir on http://127.0.0.1:$port/"

while ($true) {
  $cl = $tcp.AcceptTcpClient()
  try {
    $st = $cl.GetStream()
    $rd = [System.IO.StreamReader]::new($st)
    $req = ''
    while ($true) {
      $line = $rd.ReadLine()
      if ($null -eq $line -or $line -eq '') { break }
      if ($req -eq '') { $req = $line }
    }
    $path = ($req -split ' ')[1]
    if ([string]::IsNullOrEmpty($path) -or $path -eq '/') { $path = '/mh-controls.html' }
    $path = $path.Split('?')[0]
    $file = Join-Path $dir ($path.TrimStart('/') -replace '/', '\')

    if (Test-Path -LiteralPath $file) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $type = switch ([System.IO.Path]::GetExtension($file).ToLowerInvariant()) {
        '.css' { 'text/css; charset=utf-8' }
        '.js' { 'application/javascript; charset=utf-8' }
        '.svg' { 'image/svg+xml' }
        '.png' { 'image/png' }
        '.html' { 'text/html; charset=utf-8' }
        default { 'application/octet-stream' }
      }
      $code  = '200 OK'
    } else {
      $bytes = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
      $type  = 'text/plain; charset=utf-8'
      $code  = '404 Not Found'
    }
    $head = "HTTP/1.1 $code`r`nContent-Type: $type`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
    $hb = [Text.Encoding]::ASCII.GetBytes($head)
    $st.Write($hb, 0, $hb.Length)
    $st.Write($bytes, 0, $bytes.Length)
    $st.Flush()
  } catch { }
  finally { $cl.Close() }
}
