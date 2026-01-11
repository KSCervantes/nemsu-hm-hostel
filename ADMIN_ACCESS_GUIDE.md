# Admin Panel Access Guide

## Overview
This document provides a comprehensive guide on how to access the admin panel in the browser for the Hotel Management Hostel application.

---

## 🔐 Accessing the Admin Panel

### Step 1: Start the Development Server

```bash
npm run dev
```

The application will run at: **http://localhost:3000**

### Step 2: Navigate to Admin Login Page

**URL:** `http://localhost:3000/admin/login`

You can access it by:
- Directly typing the URL in your browser
- Clicking a link if available on the homepage (currently not implemented)

---

## 📋 Admin Routes

The application has the following admin routes:

| Route | Description | Authentication Required |
|-------|-------------|------------------------|
| `/admin/login` | Admin login page | ❌ No (public) |
| `/admin/Dashboard` | Main admin dashboard | ✅ Yes |
| `/admin/orders` | Order management page | ✅ Yes |
| `/admin/food-menu` | Food menu management | ✅ Yes |
| `/admin/archive` | Archived orders | ✅ Yes |
| `/admin/profile` | Admin profile page | ✅ Yes |
| `/admin/settings` | Admin settings page | ✅ Yes |

**Note:** The Dashboard route uses a capital "D" (`/admin/Dashboard`), not `/admin/dashboard`.

---

## 🔑 Authentication Flow

### Login Process

1. **Navigate to Login Page:**
   - URL: `http://localhost:3000/admin/login`

2. **Enter Credentials:**
   - The login form has placeholders suggesting:
     - Username: `admin`
     - Password: `password123`
   - ⚠️ **These are just placeholders** - actual credentials depend on your database

3. **Submit Login:**
   - Shows loading spinner with "Logging in..."
   - On success: Shows "Welcome Back!" alert and redirects to `/admin/Dashboard`
   - On failure: Shows error message

4. **Session Management:**
   - Successfully logged-in users get `admin_token` stored in `localStorage`
   - Value: `"local-session"` (simple token, not JWT)
   - All protected admin pages check for this token

### Protection Mechanism

All admin pages (except login) check for authentication:

```typescript
useEffect(() => {
  let hasToken = false;
  try {
    hasToken = Boolean(localStorage.getItem("admin_token"));
  } catch (e) {
    hasToken = false;
  }
  if (!hasToken) {
    router.push("/admin/login");
    return;
  }
  // ... rest of page logic
}, [router]);
```

If no token is found, users are automatically redirected to `/admin/login`.

---

## 👤 Creating Admin Users

### Issue: No Admin Users by Default

The seed file (`prisma/seed.ts`) does **NOT** create any admin users. You need to create them manually.

### Option 1: Using the Register API (Recommended)

**API Endpoint:** `POST /api/admin/register`

**Request Body:**
```json
{
  "username": "admin",
  "password": "your-secure-password"
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-secure-password"}'
```

**Example using fetch in browser console:**
```javascript
fetch('/api/admin/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'your-secure-password'
  })
})
.then(r => r.json())
.then(console.log)
```

### Option 2: Using Prisma Studio

1. Run Prisma Studio:
   ```bash
   npm run prisma:studio
   ```

2. Navigate to `AdminUser` table
3. Manually create a user with:
   - `username`: Your desired username
   - `passwordHash`: A bcrypt hash of your password (requires generating the hash separately)

### Option 3: Direct Database Insert

⚠️ **Not Recommended** - Requires bcrypt password hashing

### Option 4: Create Registration Page (Future Enhancement)

Consider creating a UI registration page at `/admin/register` for easier admin user creation during setup.

---

## 🚨 Common Issues and Solutions

### Issue 1: "Invalid credentials" Error

**Cause:** No admin user exists in the database, or wrong credentials.

**Solution:**
1. Create an admin user using the Register API (see above)
2. Verify the username and password are correct
3. Check that the database connection is working

### Issue 2: Redirected to Login After Login

**Cause:** 
- Token not being saved to localStorage (e.g., cookies disabled, private mode)
- Token being cleared immediately

**Solution:**
- Check browser console for errors
- Ensure localStorage is enabled
- Clear browser cache and try again

### Issue 3: Cannot Access `/admin/Dashboard`

**Possible Causes:**
- Typo in URL (note: capital "D" in Dashboard)
- Not logged in (missing token)
- Browser has disabled localStorage

**Solution:**
- Use exact URL: `http://localhost:3000/admin/Dashboard`
- Ensure you've logged in successfully
- Check browser settings allow localStorage

### Issue 4: Database Connection Error

**Solution:**
1. Check `.env` file has correct `DATABASE_URL`
2. Ensure database is running
3. Run migrations: `npm run prisma:migrate`
4. Generate Prisma client: `npm run prisma:generate`

---

## 🔍 Security Considerations

### Current Implementation

1. **Simple Token System:**
   - Uses `localStorage` with a simple string token
   - Token value is static: `"local-session"`
   - ⚠️ **Not secure** - anyone can set this token and gain access

2. **No Server-Side Session Validation:**
   - Authentication is client-side only
   - API routes don't verify the token
   - ⚠️ **Major security flaw** - API endpoints are not protected

3. **Password Storage:**
   - ✅ Uses bcrypt for password hashing (good)
   - ✅ Secure password comparison

### Recommended Improvements

1. **Implement JWT Tokens:**
   - Generate JWT on login
   - Store in httpOnly cookies or secure localStorage
   - Validate on server-side for all API requests

2. **Add Middleware:**
   - Create `middleware.ts` to protect routes
   - Verify tokens on server-side

3. **Session Management:**
   - Implement token expiration
   - Add logout functionality that clears tokens
   - Add refresh token mechanism

4. **API Route Protection:**
   - Add authentication middleware to all admin API routes
   - Verify tokens before processing requests

---

## 📝 Quick Start Checklist

- [ ] Database is running and connected
- [ ] Migrations are applied: `npm run prisma:migrate`
- [ ] Prisma client is generated: `npm run prisma:generate`
- [ ] At least one admin user exists (create via API)
- [ ] Development server is running: `npm run dev`
- [ ] Navigate to: `http://localhost:3000/admin/login`
- [ ] Login with admin credentials
- [ ] Should redirect to: `http://localhost:3000/admin/Dashboard`

---

## 🎯 Summary

**To Access Admin Panel:**

1. **URL:** `http://localhost:3000/admin/login`
2. **Create Admin User First:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/register \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"your-password"}'
   ```
3. **Login** with the credentials you created
4. **Access Dashboard:** Automatically redirects to `/admin/Dashboard`

**Important Notes:**
- ⚠️ No admin users are created by default - you must create one
- ⚠️ Current authentication is client-side only - not secure for production
- ✅ Password hashing is secure (bcrypt)
- ✅ Login page has good UX with SweetAlert2 notifications

---

## 🔗 Related Files

- Login Page: `app/admin/login/page.tsx`
- Login API: `app/api/admin/login/route.ts`
- Register API: `app/api/admin/register/route.ts`
- Dashboard: `app/admin/Dashboard/page.tsx`
- Database Schema: `prisma/schema.prisma`
- Seed File: `prisma/seed.ts` (doesn't seed admin users)




