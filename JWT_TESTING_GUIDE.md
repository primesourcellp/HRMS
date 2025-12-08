# JWT Authentication - Testing Guide

## Secret Key Generated ✅

A secure 256-bit JWT secret key has been generated and configured:
```
8i470klppPQCmEcraOhFcBt5Bvs6x5btoFN9O7b4xok=
```

This key is stored in `backend/src/main/resources/application.properties`

## How to Test JWT Authentication

### Step 1: Start the Backend
```bash
cd backend
mvn spring-boot:run
```
Or run from your IDE.

### Step 2: Start the Frontend
```bash
cd frontend
npm run dev
```

### Step 3: Test Login Flow

#### A. Admin Login
1. Open browser: `http://localhost:3000`
2. Go to Login page
3. Select "Admin Login" tab
4. Enter credentials (e.g., superadmin@hrms.com / superadmin123)
5. Click Login

**What to Check:**
- Open Browser DevTools (F12) → Application/Storage → Local Storage
- You should see:
  - `token`: JWT access token (starts with `eyJ...`)
  - `refreshToken`: JWT refresh token
  - `isAuthenticated`: "true"
  - `userEmail`, `userRole`, `userId`, etc.

#### B. Employee Login
1. Select "Employee Login" tab
2. Enter employee credentials
3. Click Login

**What to Check:**
- Same as above, tokens should be stored in localStorage

### Step 4: Test API Calls with Token

1. **Open Browser DevTools** → Network tab
2. **Make any API call** (e.g., view employees, dashboard, etc.)
3. **Check Request Headers:**
   - Look for: `Authorization: Bearer <your-token>`
   - The token should be automatically included in all API requests

### Step 5: Test Token Validation

#### Test Valid Token:
1. Copy token from localStorage
2. Use Postman or curl:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:8080/api/employees
```
Should return: Employee list (200 OK)

#### Test Invalid Token:
```bash
curl -H "Authorization: Bearer invalid-token" http://localhost:8080/api/employees
```
Should return: 401 Unauthorized

#### Test Missing Token:
```bash
curl http://localhost:8080/api/employees
```
Should return: 401 Unauthorized (if filter is strict) or allow through (current permissive setup)

### Step 6: Test Token Refresh

1. **Wait for token to expire** (24 hours) OR
2. **Manually expire token** by modifying it in localStorage
3. **Make an API call** - Frontend should automatically:
   - Detect 401 error
   - Use refresh token to get new access token
   - Retry the original request

### Step 7: Inspect JWT Token

You can decode JWT tokens at: https://jwt.io

**Token Structure:**
```json
{
  "email": "user@example.com",
  "role": "ADMIN",
  "id": 123,
  "userType": "admin",
  "sub": "user@example.com",
  "iat": 1234567890,
  "exp": 1234654290
}
```

## How to Generate a New Secret Key

### Option 1: PowerShell (Windows)
```powershell
$bytes = New-Object byte[] 32
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### Option 2: Online Generator
Visit: https://generate-secret.vercel.app/32
- Select "Base64" format
- Copy the generated key

### Option 3: OpenSSL (Linux/Mac)
```bash
openssl rand -base64 32
```

### Option 4: Java Code
```java
import java.security.SecureRandom;
import java.util.Base64;

SecureRandom random = new SecureRandom();
byte[] bytes = new byte[32];
random.nextBytes(bytes);
String secret = Base64.getEncoder().encodeToString(bytes);
System.out.println(secret);
```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Admin login returns token and refreshToken
- [ ] Employee login returns token and refreshToken
- [ ] Tokens are stored in localStorage
- [ ] API calls include Authorization header
- [ ] Protected endpoints accept valid tokens
- [ ] Invalid tokens are rejected (401)
- [ ] Token refresh works automatically
- [ ] Logout clears tokens

## Troubleshooting

### Issue: "ClassNotFoundException: io.jsonwebtoken.Claims"
**Solution:** Run `mvn clean install` to download dependencies

### Issue: "Invalid token" errors
**Solution:** 
- Check if secret key is correct in application.properties
- Restart backend after changing secret key
- Clear browser localStorage and login again

### Issue: Tokens not being sent
**Solution:**
- Check browser console for errors
- Verify `fetchWithAuth()` is being used in api.js
- Check Network tab to see if Authorization header is present

### Issue: CORS errors
**Solution:**
- Verify CORS config in `CorsConfig.java`
- Check `application.properties` CORS settings
- Ensure frontend is running on `http://localhost:3000`

## Security Notes

⚠️ **Important:**
- The generated key is for **testing/development only**
- For **production**, generate a new unique key
- **Never commit** production keys to version control
- Use environment variables or secrets manager in production
- Keep the secret key **confidential** - anyone with it can create valid tokens

## Next Steps

1. ✅ Secret key generated and configured
2. ✅ Test login and token generation
3. ✅ Test API calls with tokens
4. ✅ Test token refresh
5. ⚠️ Generate new key for production deployment

Happy Testing! 🚀

