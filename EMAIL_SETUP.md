# Email Notification Setup Guide

## Gmail Configuration for Order Confirmations

After a customer places an order, they will automatically receive a confirmation email with order details. Follow these steps to set up Gmail:

### Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click on **2-Step Verification**
3. Follow the prompts to enable it using your phone number

### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter name: `Hotel Management System`
5. Click **Generate**
6. Copy the 16-character password (without spaces)

### Step 3: Configure Environment Variables

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add the following variables:

```env
# Your Gmail address
EMAIL_USER="your-email@gmail.com"

# The 16-character app password from Step 2
EMAIL_PASSWORD="abcd efgh ijkl mnop"
```

**Important Notes:**

- Remove spaces from the app password when pasting it
- Never commit your `.env` file to version control
- The `.env.example` file is provided as a template

### Step 4: Restart Development Server

After updating the `.env` file:

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

## Email Features

When a customer successfully places an order, they receive:

✅ **Professional HTML Email** with:

- Order confirmation number
- Complete order details (items, quantities, prices)
- Customer information (name, contact, address)
- Total amount with proper formatting
- Delivery date and time (if provided)
- Next steps and contact information

✅ **Automatic Sending** - No manual action required

✅ **Error Handling** - Order still succeeds even if email fails

## Testing

1. Place a test order with a valid email address
2. Check the email inbox (including spam folder)
3. Verify all order details are correct

## Troubleshooting

**Email not received?**

- Check spam/junk folder
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct in `.env`
- Ensure 2-Step Verification is enabled
- Try generating a new App Password
- Check server console for error messages

**"Invalid login" error?**

- Make sure you're using an App Password, not your regular Gmail password
- Remove any spaces from the App Password
- Verify the email address is correct

**Email going to spam?**

- This is normal for development
- For production, consider using a dedicated email service (SendGrid, Mailgun, etc.)

## Security Best Practices

🔒 **Never share your App Password**
🔒 **Don't commit `.env` to Git** (it's already in `.gitignore`)
🔒 **Rotate App Passwords regularly**
🔒 **Use different App Passwords for different apps**

## Alternative Email Services

For production environments, consider using:

- **SendGrid** - Free tier: 100 emails/day
- **Mailgun** - Free tier: 5,000 emails/month
- **AWS SES** - Pay as you go
- **Resend** - Developer-friendly API

These services offer better deliverability and don't require App Passwords.
