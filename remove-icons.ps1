# Script de Limpeza - Remover Icones Font Awesome
# Remove todos os elementos <i class="fa*"> de ficheiros HTML

$htmlFiles = Get-ChildItem -Path "." -Filter "*.html" -Recurse

$totalChanges = 0
$filesModified = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Padrao para remover: <i class="fas fa-*"></i> ou <i class="fab fa-*"></i>
    # Incluindo variacoes com atributos adicionais
    $pattern = '<i\s+class="fa[sb]?\s+fa-[^"]*"[^>]*>\s*</i>'
    
    $content = $content -replace $pattern, ''
    
    # Remover linhas vazias resultantes
    $content = $content -replace '(?m)^\s*$\r?\n', ''
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $filesModified++
        $changes = ([regex]::Matches($originalContent, $pattern)).Count
        $totalChanges += $changes
        Write-Host "OK $($file.Name): $changes icones removidos"
    }
}

Write-Host ""
Write-Host "========================================="
Write-Host "Limpeza Concluida!"
Write-Host "Ficheiros modificados: $filesModified"
Write-Host "Total de icones removidos: $totalChanges"
Write-Host "========================================="
