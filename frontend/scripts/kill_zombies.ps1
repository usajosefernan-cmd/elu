$port = 8081
echo "Buscando zombies en puerto $port..."
$tcpProperties = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($tcpProperties) {
    foreach ($entry in $tcpProperties) {
        $processId = $entry.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            echo "Matando proceso ID: $processId ($($process.ProcessName))"
            Stop-Process -Id $processId -Force
        }
    }
    echo "Puerto $port liberado."
}
else {
    echo "Puerto $port limpio."
}
