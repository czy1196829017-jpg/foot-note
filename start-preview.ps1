$ErrorActionPreference = 'Stop'
$siteRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'site'))
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8787/')
try {
    $listener.Start()
    Write-Host 'FOOT NOTE: http://localhost:8787/ (close this window to stop)'
    Start-Process 'http://localhost:8787/'
    $mime = @{'.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.svg'='image/svg+xml'; '.woff2'='font/woff2'; '.woff'='font/woff'; '.ttf'='font/ttf'; '.pbf'='application/x-protobuf'; '.mvt'='application/vnd.mapbox-vector-tile'}
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath).TrimStart('/')
            if (!$relative) { $relative = 'index.html' }
            $target = [IO.Path]::GetFullPath((Join-Path $siteRoot $relative))
            if (!$target.StartsWith($siteRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or !(Test-Path -LiteralPath $target -PathType Leaf)) {
                $context.Response.StatusCode = 404
            } else {
                $type = $mime[[IO.Path]::GetExtension($target).ToLowerInvariant()]
                if (!$type) { $type = 'application/octet-stream' }
                $context.Response.ContentType = $type
                $bytes = [IO.File]::ReadAllBytes($target)
                $context.Response.ContentLength64 = $bytes.Length
                $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } catch { $context.Response.StatusCode = 500 }
        finally { $context.Response.Close() }
    }
} finally { $listener.Close() }
