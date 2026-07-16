# Helper Script to Push Code to GitHub

# Ensure Git is initialized
if (!(Test-Path .git)) {
    Write-Host "Initializing Git Repository..." -ForegroundColor Cyan
    git init
}

# Set remote origin
Write-Host "Configuring Remote Origin..." -ForegroundColor Cyan
$remoteExists = git remote | Select-String "origin"
if ($remoteExists) {
    git remote set-url origin https://github.com/RijansPatoliya/Frontend_Assignment.git
} else {
    git remote add origin https://github.com/RijansPatoliya/Frontend_Assignment.git
}

# Add all files
Write-Host "Adding files..." -ForegroundColor Cyan
git add .

# Commit
Write-Host "Creating Initial Commit..." -ForegroundColor Cyan
git commit -m "feat: Initial commit - Premium Landing Page with Interactive 3D Product & WordPress integration code"

# Set branch name
Write-Host "Configuring branch to main..." -ForegroundColor Cyan
git branch -M main

# Instructions for pushing
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Code is successfully committed locally in your git repo!" -ForegroundColor Green
Write-Host "Now, we need to push this code to your GitHub." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Please open a terminal in this workspace and run:" -ForegroundColor Yellow
Write-Host "  git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: If it asks for authentication, log in to your GitHub account."
Write-Host "=========================================================="
