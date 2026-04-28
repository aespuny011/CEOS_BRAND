$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$classesDir = Join-Path $projectRoot 'target\standalone-classes'
$libDir = Join-Path $projectRoot 'target\standalone-lib'
$sourceFile = Join-Path $projectRoot 'src\main\java\com\ceos\brand\auth\standalone\StandaloneAuthServer.java'

$mysqlJar = Get-ChildItem (Join-Path $env:USERPROFILE '.m2\repository\com\mysql\mysql-connector-j') -Recurse -Filter mysql-connector-j-*.jar |
    Where-Object { $_.FullName -notlike '*-sources.jar' } |
    Sort-Object FullName -Descending |
    Select-Object -First 1 -ExpandProperty FullName

$cryptoJar = Get-ChildItem (Join-Path $env:USERPROFILE '.m2\repository\org\springframework\security\spring-security-crypto') -Recurse -Filter spring-security-crypto-*.jar |
    Sort-Object FullName -Descending |
    Select-Object -First 1 -ExpandProperty FullName

$springCoreJar = Get-ChildItem (Join-Path $env:USERPROFILE '.m2\repository\org\springframework\spring-core') -Recurse -Filter spring-core-*.jar |
    Where-Object { $_.FullName -notlike '*-sources.jar' } |
    Sort-Object FullName -Descending |
    Select-Object -Last 1 -ExpandProperty FullName

$springJclJar = Get-ChildItem (Join-Path $env:USERPROFILE '.m2\repository\org\springframework\spring-jcl') -Recurse -Filter spring-jcl-*.jar |
    Sort-Object FullName -Descending |
    Select-Object -First 1 -ExpandProperty FullName

if (-not (Test-Path $classesDir)) {
    New-Item -ItemType Directory -Path $classesDir | Out-Null
}

if (-not (Test-Path $libDir)) {
    New-Item -ItemType Directory -Path $libDir | Out-Null
}

Copy-Item -LiteralPath $mysqlJar -Destination (Join-Path $libDir 'mysql-connector-j.jar') -Force
Copy-Item -LiteralPath $cryptoJar -Destination (Join-Path $libDir 'spring-security-crypto.jar') -Force
Copy-Item -LiteralPath $springCoreJar -Destination (Join-Path $libDir 'spring-core.jar') -Force
Copy-Item -LiteralPath $springJclJar -Destination (Join-Path $libDir 'spring-jcl.jar') -Force

$classpath = "$libDir\*;$classesDir"

Write-Host 'Compilando servidor Java standalone...'
javac -encoding UTF-8 -parameters -cp $classpath -d $classesDir $sourceFile

Write-Host 'Arrancando servidor Java standalone en http://localhost:8080 ...'
java -cp $classpath com.ceos.brand.auth.standalone.StandaloneAuthServer
