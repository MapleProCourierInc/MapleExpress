Param(
    [string]$VersionFilePath = ".\version.txt"
)

# 1) Read the current version from version.txt
if (!(Test-Path $VersionFilePath)) {
    Write-Host "Version file not found at $VersionFilePath."
    exit 1
}
$currentVersion = Get-Content $VersionFilePath

# 2) Split into MAJOR, MINOR, PATCH
$versionParts = $currentVersion -split '\.'
if ($versionParts.Count -ne 3) {
    Write-Host "Version format in $VersionFilePath is not valid. Expected something like '1.0.4'."
    exit 1
}
$major = $versionParts[0]
$minor = $versionParts[1]
$patch = [int]$versionParts[2]

# 3) Increment the PATCH by 1
$patch = $patch + 1
$newVersion = "$major.$minor.$patch"

# 4) Update version.txt
$newVersion | Set-Content $VersionFilePath

Write-Host "-----------------------------------------"
Write-Host "Old Version: $currentVersion"
Write-Host "New Version: $newVersion"
Write-Host "-----------------------------------------"


# 5) Build Docker image
Write-Host "Building Docker image with tag: $newVersion"
docker build -t northamerica-northeast2-docker.pkg.dev/numeric-wind-453017-n1/docker-containers/maple-xpress:$newVersion .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed. Exiting..."
    exit 1
}

# 6) Configure gcloud
Write-Host "Configuring gcloud..."
gcloud config set account rkhevaria.gcp@gmail.com
gcloud config set project numeric-wind-453017-n1

# 7) Push the Docker image
Write-Host "Pushing Docker image to remote registry..."
docker push northamerica-northeast2-docker.pkg.dev/numeric-wind-453017-n1/docker-containers/maple-xpress:$newVersion

Write-Host "-----------------------------------------"
Write-Host "Deployment script completed successfully!"
Write-Host "New image version: $newVersion"
Write-Host "-----------------------------------------"
