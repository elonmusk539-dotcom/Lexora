# Scripts

Utility scripts for Lexora development and setup.

## Available Scripts

### `create-sandbox-plans.ps1`
Creates PayPal Sandbox subscription plans for testing.

**Usage:**
```powershell
.\scripts\create-sandbox-plans.ps1
```

**What it does:**
1. Reads PayPal credentials from `.env.local`
2. Creates a product in PayPal Sandbox
3. Creates Monthly subscription plan ($2.99/month)
4. Creates Yearly subscription plan ($28.99/year)
5. Outputs the Plan IDs for you to add to `.env.local`

**Requirements:**
- Sandbox Client ID in `.env.local`
- Sandbox Secret Key in `.env.local`

---

### `create-sandbox-plans.js`
Node.js version of the plan creation script (alternative to PowerShell version).

**Usage:**
```bash
npm install dotenv  # First time only
node scripts/create-sandbox-plans.js
```

---

### `test-paypal-config.js`
Tests your PayPal configuration and displays helpful debugging info.

**Usage:**
```bash
node scripts/test-paypal-config.js
```

**What it shows:**
- Client ID status
- Plan IDs status
- Environment (Sandbox vs Production)
- Common issues checklist
- Next steps

---

## Quick Start: Setting Up PayPal Sandbox

1. **Update credentials in `.env.local`** (already done if you followed the setup)

2. **Run the plan creation script:**
   ```powershell
   .\scripts\create-sandbox-plans.ps1
   ```

3. **Copy the output Plan IDs** and update `.env.local`:
   ```env
   NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY=P-XXXXXXXXXXXXX
   NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY=P-YYYYYYYYYYYYYYY
   ```

4. **Restart your dev server:**
   ```bash
   npm run dev
   ```

5. **Test at** `http://localhost:3000/premium`

---

## Troubleshooting

If scripts fail:

- **401 Unauthorized**: Check Client ID and Secret Key are correct
- **Permission denied**: Run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` before running PowerShell scripts
- **Network error**: Check internet connection and PayPal API status

For more help, see:
- `PAYPAL-SANDBOX-SETUP.md` - Complete sandbox setup guide
- `PAYPAL-CARD-PAYMENT-FIX.md` - Card payment troubleshooting
