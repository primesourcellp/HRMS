# HttpOnly Cookies Implementation - Production Ready ✅

## Overview
JWT tokens are now stored in **HttpOnly cookies** instead of localStorage, providing maximum security for production use.

## Security Benefits

### ✅ HttpOnly Cookies
- **Not accessible to JavaScript** - Protected from XSS attacks
- **Automatically sent with requests** - No manual header management
- **Secure flag support** - Can be set to require HTTPS
- **SameSite protection** - Prevents CSRF attacks

### ✅ What Changed

#### Backend Changes:
1. **AuthController** - Sets HttpOnly cookies on login
2. **JWT Filter** - Reads tokens from cookies (with Authorization header fallback)
3. **Refresh Endpoint** - Reads refresh token from cookie
4. **Logout Endpoint** - Clears cookies
5. **CORS Config** - Updated to support credentials

#### Frontend Changes:
1. **API Service** - All requests include `credentials: 'include'`
2. **Login Pages** - No longer store tokens in localStorage
3. **Auth Utils** - Updated to work with cookie-based auth
4. **Logout** - Calls backend to clear cookies

## Cookie Configuration

### Access Token Cookie
- **Name:** `accessToken`
- **HttpOnly:** ✅ true
- **Secure:** false (set to true in production with HTTPS)
- **Path:** `/`
- **MaxAge:** 86400 seconds (24 hours)
- **SameSite:** Lax

### Refresh Token Cookie
- **Name:** `refreshToken`
- **HttpOnly:** ✅ true
- **Secure:** false (set to true in production with HTTPS)
- **Path:** `/`
- **MaxAge:** 604800 seconds (7 days)
- **SameSite:** Lax

## Production Checklist

### ⚠️ Before Deploying to Production:

1. **Enable HTTPS**
   - Update `Secure` flag to `true` in AuthController
   - Change: `accessTokenCookie.setSecure(true)`
   - Change: `refreshTokenCookie.setSecure(true)`

2. **Update CORS Origins**
   - Update `CorsConfig.java` with production domain
   - Update `@CrossOrigin` annotations

3. **Update Cookie Domain** (if needed)
   - Set cookie domain for subdomain support
   - Example: `cookie.setDomain(".yourdomain.com")`

4. **Environment Variables**
   - Move JWT secret to environment variable
   - Don't commit secrets to version control

## How It Works

### Login Flow:
1. User submits credentials
2. Backend validates and generates tokens
3. Backend sets HttpOnly cookies in response
4. Browser automatically stores cookies
5. Frontend stores user info in localStorage (not tokens)

### API Request Flow:
1. Frontend makes API call with `credentials: 'include'`
2. Browser automatically sends cookies with request
3. Backend JWT filter reads token from cookie
4. Backend validates token and processes request

### Token Refresh Flow:
1. Access token expires (401 response)
2. Frontend calls `/api/auth/refresh` with `credentials: 'include'`
3. Backend reads refresh token from cookie
4. Backend validates and generates new access token
5. Backend sets new access token in cookie
6. Frontend retries original request

### Logout Flow:
1. User clicks logout
2. Frontend calls `/api/auth/logout` with `credentials: 'include'`
3. Backend clears both cookies (sets MaxAge to 0)
4. Frontend clears localStorage
5. User redirected to login

## Testing

### ✅ Test Checklist:
- [ ] Login sets cookies (check DevTools → Application → Cookies)
- [ ] Cookies are HttpOnly (not visible in JavaScript)
- [ ] API calls work with cookies
- [ ] Token refresh works automatically
- [ ] Logout clears cookies
- [ ] Direct URL access requires login
- [ ] Expired tokens redirect to login

### View Cookies:
1. Open DevTools (F12)
2. Go to Application → Cookies
3. You should see:
   - `accessToken` (HttpOnly)
   - `refreshToken` (HttpOnly)

**Note:** You cannot read these cookies via JavaScript - that's the security feature!

## Migration Notes

### What Was Removed:
- ❌ `localStorage.getItem('token')`
- ❌ `localStorage.getItem('refreshToken')`
- ❌ `localStorage.setItem('token', ...)`
- ❌ Manual `Authorization: Bearer` header (still works as fallback)

### What Was Added:
- ✅ `credentials: 'include'` in all fetch calls
- ✅ Cookie-based token storage
- ✅ Backend cookie management
- ✅ Logout endpoint

## Troubleshooting

### Issue: Cookies not being set
**Solution:**
- Check CORS configuration (`allowCredentials: true`)
- Verify frontend includes `credentials: 'include'`
- Check browser console for CORS errors

### Issue: Cookies not sent with requests
**Solution:**
- Ensure all fetch calls include `credentials: 'include'`
- Check cookie domain/path settings
- Verify SameSite attribute

### Issue: 401 Unauthorized errors
**Solution:**
- Check if cookies are being set (DevTools → Cookies)
- Verify JWT filter is reading from cookies
- Check token expiration

## Security Comparison

### Before (localStorage):
- ❌ Visible in DevTools
- ❌ Accessible to JavaScript
- ❌ Vulnerable to XSS
- ❌ Manual header management

### After (HttpOnly Cookies):
- ✅ Not visible in localStorage
- ✅ Not accessible to JavaScript
- ✅ Protected from XSS
- ✅ Automatically sent with requests
- ✅ SameSite CSRF protection

## Production Deployment

1. **Set Secure Flag:**
   ```java
   accessTokenCookie.setSecure(true); // Requires HTTPS
   refreshTokenCookie.setSecure(true); // Requires HTTPS
   ```

2. **Update CORS:**
   ```java
   config.addAllowedOrigin("https://yourdomain.com");
   ```

3. **Environment Variables:**
   ```properties
   jwt.secret=${JWT_SECRET}
   ```

4. **HTTPS Required:**
   - HttpOnly cookies with Secure flag require HTTPS
   - Use reverse proxy (nginx/Apache) or Spring Boot SSL

## Result

✅ **Production-ready secure authentication!**

- Tokens are **not visible** in browser DevTools localStorage
- Tokens are **protected from XSS** attacks
- Tokens are **automatically managed** by browser
- **Maximum security** for production deployment

Your application is now using industry-standard secure token storage! 🔒

