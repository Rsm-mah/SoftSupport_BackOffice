<#
.SYNOPSIS
  Construit SoftSupport (API + front) pour un ou plusieurs serveurs de déploiement.

.EXAMPLE
  .\publish.ps1 -Server srv151
  # → publish\srv151\api   (dossier de l'API, appsettings.Production.json du serveur inclus)
  # → publish\srv151\front (fichiers statiques, config.json pointant vers l'API du serveur)

.EXAMPLE
  .\publish.ps1 -Server srv151, srv141     # les deux serveurs à la suite
  .\publish.ps1 -Server all                # tous les serveurs connus
  .\publish.ps1 -Server srv141 -SkipFront  # API seule

.NOTES
  Ajouter un serveur : créer src\api\SoftSupport.Api\config\appsettings.<nom>.json,
  src\ui\SoftSupport.Front\apps\softsupport\config\<nom>\config.json, une configuration <nom>
  dans apps\softsupport\project.json, puis l'ajouter à $servers ci-dessous.
#>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('srv151', 'srv141', 'all')]
    [string[]] $Server,

    [switch] $SkipFront
)

# « Continue » : sous Windows PowerShell 5.1, un simple avertissement écrit sur stderr par
# dotnet ou npx deviendrait une erreur bloquante. Le succès se juge sur $LASTEXITCODE.
$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot
$servers = @('srv151', 'srv141')
$targets = if ($Server -contains 'all') { $servers } else { $Server | Select-Object -Unique }

# Avant toute compilation : chaque serveur doit avoir ses identifiants SQL renseignés.
foreach ($target in $targets) {
    $settings = Join-Path $root "src\api\SoftSupport.Api\config\appsettings.$target.json"
    if ((Get-Content $settings -Raw) -match 'A_RENSEIGNER') {
        throw "Identifiants SQL de la base BDC à renseigner dans $settings (valeurs A_RENSEIGNER)."
    }
}

$front = Join-Path $root 'src\ui\SoftSupport.Front'
if (-not $SkipFront -and -not (Test-Path (Join-Path $front 'node_modules'))) {
    Push-Location $front
    try { npm install --no-audit --no-fund } finally { Pop-Location }
}

foreach ($target in $targets) {
    $output = Join-Path $root "publish\$target"
    if (Test-Path $output) {
        Remove-Item $output -Recurse -Force -Confirm:$false
    }

    Write-Host "== API SoftSupport pour $target ==" -ForegroundColor Cyan
    dotnet publish (Join-Path $root 'src\api\SoftSupport.Api\SoftSupport.Api.csproj') `
        -c Release `
        -p:SoftSupportServer=$target `
        -o (Join-Path $output 'api')
    if ($LASTEXITCODE -ne 0) { throw "Échec de la publication de l'API pour $target." }

    if (-not $SkipFront) {
        Write-Host "== Front SoftSupport pour $target ==" -ForegroundColor Cyan
        Push-Location $front
        try {
            npx nx build softsupport "--configuration=$target" --skip-nx-cache
            if ($LASTEXITCODE -ne 0) { throw "Échec du build du front pour $target." }
        }
        finally {
            Pop-Location
        }
        Copy-Item (Join-Path $front "dist\apps\softsupport-$target\browser") (Join-Path $output 'front') -Recurse
    }

    Write-Host "Publication terminée : $output" -ForegroundColor Green
}
