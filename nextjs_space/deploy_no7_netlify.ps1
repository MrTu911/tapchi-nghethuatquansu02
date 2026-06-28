# deploy_no7_netlify.ps1
# Automates building and deploying ONLY issue 7 (so-7-2026) to Netlify

$ErrorActionPreference = "Stop"

$IssuesDir = "public/data/issues"
$BackupDir = "public/data/_issues_backup"
$TargetIssue = "so-7-2026"

# List of folders to temporarily hide during static export to prevent compilation errors
$HideFolders = @(
    "app/api",
    "app/dashboard",
    "app/auth",
    "app/(auth)",
    "app/(public)/issues/[id]/download",
    "app/(public)/videos",
    "app/(public)/repository",
    "app/(public)/podcasts",
    "app/(public)/pages",
    "app/(public)/news",
    "app/(public)/articles"
)

# Array to keep track of successfully hidden folders for restoration
$hiddenFolders = @()

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "   DEPLOYING ONLY ISSUE 7 (so-7-2026) TO NETLIFY (ebookhvqp)           " -ForegroundColor Cyan
Write-Host "=======================================================================" -ForegroundColor Cyan

# 1. Run database preparation
try {
    Write-Host "`n[1/6] Running database prep script..." -ForegroundColor Yellow
    npx tsx scripts/deploy-prep.ts
} catch {
    Write-Host "❌ Database prep failed: $_" -ForegroundColor Red
    exit 1
}

# 2. Move other issue folders to backup & hide dynamic routes & apply page patches
$movedIssues = @()
$patchesApplied = $false
try {
    Write-Host "`n[2/6] Backing up other issue directories, hiding dynamic routes, and patching pages..." -ForegroundColor Yellow
    
    # Backup other issues
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }
    Get-ChildItem -Path $IssuesDir -Directory | ForEach-Object {
        if ($_.Name -ne $TargetIssue) {
            $dest = Join-Path $BackupDir $_.Name
            if (Test-Path $dest) {
                Remove-Item -Recurse -Force $dest
            }
            Move-Item -Path $_.FullName -Destination $BackupDir
            $movedIssues += $_.Name
            Write-Host "  Moved: $_.Name -> _issues_backup/"
        }
    }
    Write-Host "✓ Backed up $($movedIssues.Count) other issue directories." -ForegroundColor Green

    # Hide dynamic routes
    foreach ($folder in $HideFolders) {
        if (Test-Path -LiteralPath $folder) {
            $leaf = Split-Path -Leaf $folder
            $backupName = "_" + $leaf + "_backup"
            Rename-Item -LiteralPath $folder -NewName $backupName
            
            $parent = Split-Path -Parent $folder
            $backupPath = Join-Path $parent $backupName
            
            $hiddenFolders += @{ Original = $folder; Backup = $backupPath; OriginalLeaf = $leaf }
            Write-Host "✓ Temporarily hid $folder -> $backupName" -ForegroundColor Green
        }
    }

    # Apply page patches (comment out force-dynamic, add generateStaticParams)
    Write-Host "Applying build patches to pages..." -ForegroundColor Yellow
    python deploy_patch_build.py
    $patchesApplied = $true
} catch {
    Write-Host "❌ Backup and patching phase failed: $_" -ForegroundColor Red
    # Run restore immediately
    npx tsx scripts/deploy-restore.ts
    exit 1
}

# 3. Build Next.js in static export mode
$buildSuccess = $false
try {
    Write-Host "`n[3/6] Building Next.js static export (out/)..." -ForegroundColor Yellow
    $env:NEXT_OUTPUT_MODE = "export"
    
    # Run npm run build and capture exit code
    cmd /c "npm run build"
    
    if ($LASTEXITCODE -eq 0) {
        $buildSuccess = $true
        Write-Host "✓ Next.js build completed successfully." -ForegroundColor Green
    } else {
        Write-Host "❌ Next.js build failed with exit code $LASTEXITCODE." -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Next.js build encountered an exception: $_" -ForegroundColor Red
} finally {
    # 4. Restore other issue folders & hidden routes & restore page patches
    Write-Host "`n[4/6] Restoring other issue directories, dynamic routes, and page patches..." -ForegroundColor Yellow
    
    # Restore other issues
    if (Test-Path $BackupDir) {
        Get-ChildItem -Path $BackupDir -Directory | ForEach-Object {
            $dest = Join-Path $IssuesDir $_.Name
            if (Test-Path $dest) {
                Remove-Item -Recurse -Force $dest
            }
            Move-Item -Path $_.FullName -Destination $IssuesDir
            Write-Host "  Restored: $_.Name -> issues/"
        }
        Remove-Item -Recurse -Force $BackupDir | Out-Null
    }

    # Restore hidden routes (reverse order to handle nested folders if any)
    for ($i = $hiddenFolders.Count - 1; $i -ge 0; $i--) {
        $item = $hiddenFolders[$i]
        if (Test-Path -LiteralPath $item.Backup) {
            Rename-Item -LiteralPath $item.Backup -NewName $item.OriginalLeaf
            Write-Host "  Restored $($item.Original)"
        }
    }

    # Restore page patches
    if ($patchesApplied) {
        python deploy_restore_patches.py
    }
    
    Write-Host "✓ Restored all directories and files." -ForegroundColor Green

    # 5. Restore database statuses
    Write-Host "`n[5/6] Restoring database issue statuses..." -ForegroundColor Yellow
    npx tsx scripts/deploy-restore.ts
}

# 6. Deploy to Netlify (only if build succeeded)
if ($buildSuccess) {
    try {
        Write-Host "`n[6/6] Cleaning Netlify cache and deploying..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force .netlify/functions-internal, .netlify/functions, .netlify/edge-functions, .netlify/edge-functions-serve -ErrorAction SilentlyContinue
        npx netlify deploy --dir=out --prod --no-build
        Write-Host "`n🎉 DEPLOYMENT COMPLETE!" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Netlify deployment failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Deployment aborted because build failed." -ForegroundColor Red
    exit 1
}
