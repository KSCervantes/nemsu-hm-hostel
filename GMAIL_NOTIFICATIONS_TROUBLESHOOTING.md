# Gmail Notifications Troubleshooting Guide

## Why Emails Are Not Appearing in Gmail

This guide helps you diagnose and fix issues with email notifications not appearing in Gmail.

## Quick Diagnostic Checklist

### 1. Check Server Console Logs

When you start your development server, you should see one of these messages:

**✅ Success:**
```
✅ Email transporter verified successfully
```

**❌ Configuration Missing:**
```
⚠️ EMAIL CONFIGURATION MISSING:
  - EMAIL_USER is not set in environment variables
  - EMAIL_PASSWORD is not set in environment variables
```

**❌ Authentication Failed:**
```
❌ EMAIL TRANSPORTER VERIFICATION FAILED: Invalid login
```

### 2. Check Environment Variables

**Location:** Create a `.env` file in your project root directory

**Required Variables:**
```env
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-16-character-app-password"
```

**How to Check:**
1. Look for `.env` file in project root
2. Verify both variables are set (no empty values)
3. Make sure there are no extra spaces or quotes issues

### 3. Verify Gmail App Password Setup

**Common Issues:**

❌ **Using Regular Password Instead of App Password**
- Gmail requires an App Password for third-party apps
- Your regular Gmail password will NOT work

✅ **Correct Setup:**
1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Other (Custom name)"
4. Copy the 16-character password (remove spaces when pasting)

### 4. Check Email Sending Logs

When an order is placed, check your server console for:

**✅ Success:**
```
✅ Order confirmation email sent to customer@example.com for order #123
```

**❌ Failure:**
```
❌ Email sending failed: Invalid login
   Authentication failed - check EMAIL_USER and EMAIL_PASSWORD
```

### 5. Check Gmail Settings

**Spam Folder:**
- Emails might be going to Spam/Junk folder
- Check "All Mail" folder in Gmail
- Mark as "Not Spam" if found

**Filters:**
- Check if Gmail filters are blocking emails
- Go to Settings → Filters and Blocked Addresses

**Promotions Tab:**
- Check the "Promotions" tab in Gmail
- Emails might be categorized there

## Step-by-Step Fix Guide

### Step 1: Verify Environment Variables

1. Open your project root directory
2. Check if `.env` file exists
3. If not, create it:
   ```bash
   touch .env
   ```
4. Add these lines (replace with your actual values):
   ```env
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASSWORD="abcdefghijklmnop"
   ```
5. **Important:** Remove spaces from App Password
6. **Important:** No quotes needed around values (or use consistent quotes)

### Step 2: Enable Gmail 2-Step Verification

1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification"
3. Click "Get Started" if not enabled
4. Follow the setup process

### Step 3: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. If you don't see this option, 2-Step Verification might not be enabled
3. Select:
   - **App:** Mail
   - **Device:** Other (Custom name)
   - **Name:** Hotel Management System
4. Click "Generate"
5. Copy the 16-character password (it looks like: `abcd efgh ijkl mnop`)
6. **Remove all spaces** when pasting into `.env`

### Step 4: Restart Development Server

After updating `.env`:

```bash
# Stop server (Ctrl+C)
# Then restart
npm run dev
```

Look for the verification message in console.

### Step 5: Test Email Sending

1. Place a test order with a valid email address
2. Check server console for email sending logs
3. Check the recipient's Gmail:
   - Inbox
   - Spam folder
   - Promotions tab
   - All Mail

## Common Error Messages & Solutions

### "Invalid login" or "EAUTH"

**Cause:** Wrong password or App Password not used

**Solution:**
- Make sure you're using App Password, not regular password
- Verify App Password has no spaces
- Regenerate App Password if needed

### "ECONNECTION"

**Cause:** Network/connection issue

**Solution:**
- Check internet connection
- Check firewall settings
- Try again later

### "Email transporter not configured"

**Cause:** Environment variables not set

**Solution:**
- Create `.env` file
- Add EMAIL_USER and EMAIL_PASSWORD
- Restart server

### "EMAIL_USER is not set"

**Cause:** Missing environment variable

**Solution:**
- Add `EMAIL_USER="your-email@gmail.com"` to `.env`
- Restart server

### "EMAIL_PASSWORD is not set"

**Cause:** Missing environment variable

**Solution:**
- Add `EMAIL_PASSWORD="your-app-password"` to `.env`
- Restart server

## Testing Email Configuration

### Method 1: Check Server Startup

When you start the server, you should see:
```
✅ Email transporter verified successfully
```

If you see errors, fix them before testing.

### Method 2: Place Test Order

1. Go to your website
2. Add items to cart
3. Fill in order form with a valid email
4. Submit order
5. Check server console for:
   ```
   ✅ Order confirmation email sent to test@example.com for order #1
   ```

### Method 3: Check Gmail

1. Log into the recipient Gmail account
2. Check:
   - Inbox (primary tab)
   - Promotions tab
   - Spam folder
   - All Mail (search for "Order Confirmation")

## Advanced Troubleshooting

### Check Nodemailer Connection

If emails still don't work, test the connection manually:

1. Create a test file `test-email.js`:
```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});
```

2. Run: `node test-email.js`

### Check Gmail Account Security

1. Go to: https://myaccount.google.com/security
2. Check "Less secure app access" (should be OFF - we use App Passwords)
3. Review "Recent security activity" for blocked login attempts

### Check Server Logs

Look for detailed error messages in your server console:
- Authentication errors
- Connection errors
- Configuration errors

## Still Not Working?

### Alternative Solutions

1. **Use a Different Email Service:**
   - SendGrid (100 emails/day free)
   - Mailgun (5,000 emails/month free)
   - Resend (developer-friendly)

2. **Check Gmail Limits:**
   - Gmail has daily sending limits
   - Personal accounts: 500 emails/day
   - If exceeded, wait 24 hours

3. **Verify Email Address:**
   - Make sure the recipient email is valid
   - Test with your own email first

4. **Check for Typos:**
   - Double-check EMAIL_USER spelling
   - Verify App Password is correct
   - Check for extra spaces or characters

## Summary

Most common issues:
1. ❌ Missing `.env` file or environment variables
2. ❌ Using regular password instead of App Password
3. ❌ 2-Step Verification not enabled
4. ❌ Emails going to Spam folder
5. ❌ Server not restarted after `.env` changes

**Quick Fix:**
1. Create `.env` with EMAIL_USER and EMAIL_PASSWORD
2. Use Gmail App Password (not regular password)
3. Restart server
4. Check console logs for verification

## Need More Help?

Check these files:
- `EMAIL_SETUP.md` - Initial setup guide
- `lib/email.ts` - Email sending code
- Server console logs - Real-time error messages

