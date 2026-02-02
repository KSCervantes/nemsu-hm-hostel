# Firebase Setup Guide

This guide will help you set up Firebase as the backend for your Hotel Management System.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "hotel-management-hostel")
4. Follow the setup wizard (you can disable Google Analytics if not needed)

## Step 2: Enable Firestore Database

1. In your Firebase project, go to **Build** > **Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode** (we'll set up security rules later)
4. Select a location closest to your users
5. Click "Enable"

## Step 3: Create a Web App

1. In the Firebase Console, click the gear icon ⚙️ > **Project settings**
2. Scroll down to "Your apps" section
3. Click the Web icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "hotel-management-web")
5. Copy the Firebase configuration values

## Step 4: Update Your .env File

Update your `.env` file with the Firebase configuration values:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

## Step 5: Set Up Firebase Admin SDK (For Migration)

If you want to migrate existing data from MySQL:

1. In Firebase Console, go to ⚙️ > **Project settings** > **Service accounts**
2. Click "Generate new private key"
3. Save the file as `firebase-service-account.json` in your project root
4. **IMPORTANT**: Add `firebase-service-account.json` to your `.gitignore`

## Step 6: Set Up Firestore Security Rules

Go to **Firestore Database** > **Rules** and set up the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if request is from server
    function isServerRequest() {
      return request.auth != null && request.auth.token.admin == true;
    }

    // Admin users collection - read/write restricted
    match /adminUsers/{userId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server-side operations
    }

    // Food items - public read, admin write
    match /foodItems/{itemId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Orders - authenticated users only
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if true; // Allow public order creation
      allow update, delete: if request.auth != null;
    }

    // Order items - follow parent order rules
    match /orderItems/{itemId} {
      allow read: if request.auth != null;
      allow create: if true;
      allow update, delete: if request.auth != null;
    }

    // Reservations
    match /reservations/{reservationId} {
      allow read: if request.auth != null;
      allow create: if true;
      allow update, delete: if request.auth != null;
    }

    // Audit logs - admin only
    match /auditLogs/{logId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // App settings - admin only
    match /appSettings/{settingId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Counters - server only
    match /counters/{counterId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 7: Create Firestore Indexes

Go to **Firestore Database** > **Indexes** and create the following composite indexes:

1. **Orders by archived and numericId**
   - Collection: `orders`
   - Fields: `archived` (Ascending), `numericId` (Descending)

2. **Order items by orderId**
   - Collection: `orderItems`
   - Fields: `orderId` (Ascending)

3. **Food items by numericId**
   - Collection: `foodItems`
   - Fields: `numericId` (Ascending)

## Step 8: Migrate Existing Data (Optional)

If you have existing data in MySQL, run the migration script:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-to-firebase.ts
```

## Step 9: Verify the Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Test the API endpoint:

   ```
   http://localhost:3000/api/admin/test
   ```

3. Check the Firebase Console to see if data is being created

## Firebase Collections Structure

| Collection     | Description                                          |
| -------------- | ---------------------------------------------------- |
| `adminUsers`   | Admin user accounts with hashed passwords            |
| `foodItems`    | Menu items with prices, categories, and availability |
| `orders`       | Customer orders with status and customer info        |
| `orderItems`   | Individual items within each order                   |
| `reservations` | Room reservations                                    |
| `auditLogs`    | System audit trail for deleted/modified records      |
| `appSettings`  | Application configuration settings                   |
| `counters`     | Auto-increment counters for IDs                      |

## Troubleshooting

### "Permission denied" errors

- Check your Firestore security rules
- Make sure you're authenticated for protected routes

### "Firebase app not initialized" errors

- Verify your environment variables are correct
- Check that the `.env` file is in the project root

### Data not appearing in Firebase Console

- Check the browser console for errors
- Verify your Firebase project ID is correct

### Migration script fails

- Ensure `firebase-service-account.json` exists
- Check that MySQL database is running
- Verify `DATABASE_URL` is correct in `.env`

## Removing Prisma (Optional)

Once you've verified Firebase is working correctly, you can remove Prisma:

1. Remove Prisma dependencies:

   ```bash
   npm uninstall @prisma/client prisma
   ```

2. Delete the `prisma` folder

3. Remove Prisma scripts from `package.json`

4. Remove the `lib/prisma.ts` file

## Support

If you encounter issues:

1. Check the Firebase Console logs
2. Review the browser developer console
3. Check your Next.js server logs
