$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$classesDir = Join-Path $projectRoot 'target\classes'
$libDir = Join-Path $projectRoot 'target\lib'
$sources = Get-ChildItem (Join-Path $projectRoot 'src\main\java') -Recurse -Filter *.java | Select-Object -ExpandProperty FullName
$m2Repo = Join-Path $env:USERPROFILE '.m2\repository'
$dependencyJars = Get-ChildItem $m2Repo -Recurse -Filter *.jar | Where-Object {
    $_.FullName -notlike '*-sources.jar'
} | Select-Object -ExpandProperty FullName

if (-not (Test-Path $classesDir)) {
    New-Item -ItemType Directory -Path $classesDir | Out-Null
}

if (-not (Test-Path $libDir)) {
    New-Item -ItemType Directory -Path $libDir | Out-Null
}

Write-Host 'Sincronizando dependencias locales...'
foreach ($jar in $dependencyJars) {
    Copy-Item -LiteralPath $jar -Destination (Join-Path $libDir ([System.IO.Path]::GetFileName($jar))) -Force
}

$classpath = "$libDir\*;$classesDir"

Write-Host 'Compilando backend Java...'
javac -encoding UTF-8 -parameters -cp $classpath -d $classesDir $sources

Write-Host 'Arrancando backend Java en http://localhost:8080 ...'
java -cp $classpath com.ceos.brand.auth.CeosBrandAuthApplication
