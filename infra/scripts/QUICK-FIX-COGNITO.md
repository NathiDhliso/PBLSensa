# 🚀 Quick Fix: Cognito 400 Error & Email Templates

## ✅ Code Fix (Already Applied)

The **"400 unauthorized attribute"** error has been fixed in `src/services/auth.ts`.

**What was changed:**
- Removed `name` attribute from signup request
- Now only sending `email` during registration
- This prevents the "unauthorized attribute" error

## 📧 Email Templates Setup (5 Minutes)

### Quick Steps:

1. **Open AWS Console** → Cognito → User Pools → `eu-west-1_0kcNGnItf`

2. **Click "Messaging" tab** → Scroll to "Email" section → Click "Edit"

3. **Copy-paste these templates:**

---

### ✉️ Verification Email

**Subject:**
```
Verify your Sensa Learn account
```

**Message Type:** Select "Code"

**Message (Simple Version):**
```
Welcome to Sensa Learn!

Your verification code is: {####}

This code expires in 24 hours.

Enter this code on the verification page to complete your registration.

If you didn't sign up, please ignore this email.

- The Sensa Learn Team
```

---

### 🔐 Password Reset Email

**Subject:**
```
Reset your Sensa Learn password
```

**Message Type:** Select "Code"

**Message (Simple Version):**
```
Password Reset Request

Your password reset code is: {####}

This code expires in 1 hour.

Enter this code to reset your password.

⚠️ If you didn't request this, please ignore this email.

- The Sensa Learn Team
```

---

### 4. Click "Save changes"

---

## 🧪 Test It

1. **Test Signup:**
   - Go to your app
   - Try registering with a new email
   - Check inbox for verification code
   - ✅ Should work without 400 error

2. **Test Password Reset:**
   - Click "Forgot Password"
   - Enter email
   - Check inbox for reset code
   - ✅ Should receive email

---

## 🎨 Want Fancy HTML Emails?

See the full HTML templates in: `COGNITO-EMAIL-SETUP-GUIDE.md`

They include:
- Beautiful gradient headers
- Styled code boxes
- Professional branding
- Responsive design

---

## ⚠️ Troubleshooting

### Emails not arriving?

1. **Check spam folder** - Cognito emails often go there initially
2. **Verify SES** - Go to AWS SES and verify your email domain
3. **Check SES Sandbox** - You might be in sandbox mode (limited sending)

### Still getting 400 error?

1. **Clear browser cache**
2. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check browser console** for exact error
4. **Verify code update** - Make sure `src/services/auth.ts` has the fix

---

## 📋 What Was Fixed

| Issue | Solution | Status |
|-------|----------|--------|
| 400 Unauthorized Attribute | Removed `name` from signup | ✅ Fixed |
| No verification emails | Need to configure templates | ⏳ Manual setup |
| No reset emails | Need to configure templates | ⏳ Manual setup |

---

## 🎯 Next Steps

1. ✅ Code is already fixed
2. ⏳ Configure email templates (5 min)
3. ✅ Test signup flow
4. ✅ Test password reset
5. 🎉 Done!

---

**Time to complete:** ~5 minutes  
**Difficulty:** Easy (copy-paste)  
**Impact:** High (fixes critical auth flow)
