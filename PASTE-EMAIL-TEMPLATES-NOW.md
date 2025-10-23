# 📧 Paste Email Templates - Step by Step

## ✅ What Just Happened

1. ✅ AWS Console opened in your browser
2. ✅ Verification email template copied to clipboard
3. ✅ Email template files created locally

---

## 🎯 Follow These Steps Now

### Step 1: Paste Verification Email (Already in Clipboard!)

In the AWS Console that just opened:

1. **Click "Edit" button** in the Email section
2. **Scroll to "Verification message"**
3. **Select "Code" as verification type**
4. **In the "Email subject" field, type:**
   ```
   Verify your Sensa Learn account
   ```
5. **In the "Email message" field:**
   - Click in the text box
   - Press **Ctrl+V** (or Cmd+V on Mac) to paste
   - The HTML template is already in your clipboard!

6. **Don't click Save yet!** Continue to Step 2...

---

### Step 2: Configure Password Reset Email

Still in the same Edit screen:

1. **Scroll down to "Password reset message"**
2. **In the "Email subject" field, type:**
   ```
   Reset your Sensa Learn password
   ```
3. **For the "Email message" field:**
   - Run this command in PowerShell to copy reset email:
   ```powershell
   Get-Content 'cognito-reset-email.html' -Raw | Set-Clipboard
   ```
   - Then click in the text box and press **Ctrl+V**

4. **Now click "Save changes"** at the bottom

---

## ✅ Verification

After saving, test it:

1. **Go to your app** (http://localhost:5173 or your deployed URL)
2. **Try signing up** with a new email
3. **Check your inbox** - you should receive a beautiful verification email
4. **Test password reset** - should receive reset email

---

## 🚀 Quick Commands

### Copy Verification Email:
```powershell
Get-Content 'cognito-verification-email.html' -Raw | Set-Clipboard
```

### Copy Reset Email:
```powershell
Get-Content 'cognito-reset-email.html' -Raw | Set-Clipboard
```

### View Templates:
```powershell
# View verification email
Get-Content 'cognito-verification-email.html'

# View reset email
Get-Content 'cognito-reset-email.html'
```

---

## 📁 Template Files Location

The HTML templates are saved in your project root:
- `cognito-verification-email.html` - Verification email
- `cognito-reset-email.html` - Password reset email

You can open these in a browser to preview them!

---

## ⚠️ Troubleshooting

### Can't find the Edit button?
- Make sure you're on the "Messaging" tab
- Look for the "Email" section
- The Edit button is on the right side

### Templates not saving?
- Make sure you're using HTML format (not plain text)
- Check that `{####}` placeholder is present in the template
- Try refreshing the page and trying again

### Emails not arriving?
- Check spam folder
- Verify your email is not in SES sandbox mode
- Check CloudWatch logs for Cognito

---

## 🎉 You're Almost Done!

Once you paste both templates and click Save:
- ✅ 400 error is fixed (code already updated)
- ✅ Beautiful verification emails will be sent
- ✅ Professional password reset emails will work
- ✅ Your auth flow is complete!

---

**Time to complete:** 2-3 minutes  
**Current step:** Paste templates in AWS Console  
**Next step:** Test signup flow
