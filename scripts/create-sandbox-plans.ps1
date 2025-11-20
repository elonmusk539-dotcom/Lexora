# PayPal Sandbox Plan Creator - PowerShell Version
# This creates subscription plans in PayPal Sandbox
# Usage: .\scripts\create-sandbox-plans.ps1

Write-Host ""
Write-Host "PayPal Sandbox Plan Creator" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

# Load environment variables from .env.local
$envFile = Get-Content .env.local
$clientIdLine = $envFile | Select-String "NEXT_PUBLIC_PAYPAL_CLIENT_ID=(.+)"
$secretKeyLine = $envFile | Select-String "PAYPAL_SECRET_KEY=(.+)"

if (-not $clientIdLine -or -not $secretKeyLine) {
    Write-Host "Error: PayPal credentials not found in .env.local" -ForegroundColor Red
    Write-Host "Make sure NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_SECRET_KEY are set" -ForegroundColor Yellow
    exit 1
}

$clientId = $clientIdLine.Matches.Groups[1].Value
$secretKey = $secretKeyLine.Matches.Groups[1].Value

$sandboxApi = "https://api-m.sandbox.paypal.com"

# Step 1: Get Access Token
Write-Host ""
Write-Host "Step 1: Getting Access Token..." -ForegroundColor Yellow

$authHeader = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${clientId}:${secretKey}"))
$headers = @{
    "Accept" = "application/json"
    "Accept-Language" = "en_US"
    "Authorization" = "Basic $authHeader"
}

try {
    $tokenResponse = Invoke-RestMethod -Uri "$sandboxApi/v1/oauth2/token" `
        -Method Post `
        -Headers $headers `
        -Body "grant_type=client_credentials" `
        -ContentType "application/x-www-form-urlencoded"
    
    $accessToken = $tokenResponse.access_token
    Write-Host "Access token obtained" -ForegroundColor Green
} catch {
    Write-Host "Failed to get access token:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 2: Create Product
Write-Host ""
Write-Host "Step 2: Creating Product..." -ForegroundColor Yellow

$productHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $accessToken"
}

$productData = @{
    name = "Lexora Pro Subscription"
    description = "Premium subscription for Lexora - unlock all vocabulary lists and unlimited custom content"
    type = "SERVICE"
    category = "SOFTWARE"
} | ConvertTo-Json

try {
    $productResponse = Invoke-RestMethod -Uri "$sandboxApi/v1/catalogs/products" `
        -Method Post `
        -Headers $productHeaders `
        -Body $productData
    
    $productId = $productResponse.id
    Write-Host "Product created: $productId" -ForegroundColor Green
} catch {
    Write-Host "Failed to create product:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 3: Create Monthly Plan
Write-Host ""
Write-Host "Step 3: Creating Monthly Plan (2.99/month)..." -ForegroundColor Yellow

$planHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $accessToken"
    "Prefer" = "return=representation"
}

$monthlyPlanData = @{
    product_id = $productId
    name = "Lexora Pro - Monthly"
    description = "Monthly subscription to Lexora Pro with unlimited access"
    status = "ACTIVE"
    billing_cycles = @(
        @{
            frequency = @{
                interval_unit = "MONTH"
                interval_count = 1
            }
            tenure_type = "REGULAR"
            sequence = 1
            total_cycles = 0
            pricing_scheme = @{
                fixed_price = @{
                    value = "2.99"
                    currency_code = "USD"
                }
            }
        }
    )
    payment_preferences = @{
        auto_bill_outstanding = $true
        setup_fee = @{
            value = "0"
            currency_code = "USD"
        }
        setup_fee_failure_action = "CONTINUE"
        payment_failure_threshold = 3
    }
} | ConvertTo-Json -Depth 10

try {
    $monthlyPlanResponse = Invoke-RestMethod -Uri "$sandboxApi/v1/billing/plans" `
        -Method Post `
        -Headers $planHeaders `
        -Body $monthlyPlanData
    
    $monthlyPlanId = $monthlyPlanResponse.id
    Write-Host "Monthly plan created!" -ForegroundColor Green
    Write-Host "Plan ID: $monthlyPlanId" -ForegroundColor Cyan
} catch {
    Write-Host "Failed to create monthly plan:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 4: Create Yearly Plan
Write-Host ""
Write-Host "Step 4: Creating Yearly Plan (28.99/year)..." -ForegroundColor Yellow

$yearlyPlanData = @{
    product_id = $productId
    name = "Lexora Pro - Yearly"
    description = "Yearly subscription to Lexora Pro with unlimited access (Save 17%)"
    status = "ACTIVE"
    billing_cycles = @(
        @{
            frequency = @{
                interval_unit = "YEAR"
                interval_count = 1
            }
            tenure_type = "REGULAR"
            sequence = 1
            total_cycles = 0
            pricing_scheme = @{
                fixed_price = @{
                    value = "28.99"
                    currency_code = "USD"
                }
            }
        }
    )
    payment_preferences = @{
        auto_bill_outstanding = $true
        setup_fee = @{
            value = "0"
            currency_code = "USD"
        }
        setup_fee_failure_action = "CONTINUE"
        payment_failure_threshold = 3
    }
} | ConvertTo-Json -Depth 10

try {
    $yearlyPlanResponse = Invoke-RestMethod -Uri "$sandboxApi/v1/billing/plans" `
        -Method Post `
        -Headers $planHeaders `
        -Body $yearlyPlanData
    
    $yearlyPlanId = $yearlyPlanResponse.id
    Write-Host "Yearly plan created!" -ForegroundColor Green
    Write-Host "Plan ID: $yearlyPlanId" -ForegroundColor Cyan
} catch {
    Write-Host "Failed to create yearly plan:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Success!
Write-Host ""
Write-Host "============================================================" -ForegroundColor Gray
Write-Host "SUCCESS! Subscription plans created" -ForegroundColor Green
Write-Host ""
Write-Host "Copy these to your .env.local file:" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY=$monthlyPlanId" -ForegroundColor White
Write-Host "NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY=$yearlyPlanId" -ForegroundColor White
Write-Host ""
Write-Host "============================================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env.local with the plan IDs above" -ForegroundColor White
Write-Host "2. Restart your dev server (npm run dev)" -ForegroundColor White
Write-Host "3. Test the subscription flow at /premium" -ForegroundColor White
Write-Host "4. Use test cards or sandbox PayPal account" -ForegroundColor White
Write-Host ""
