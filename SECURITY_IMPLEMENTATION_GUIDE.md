# Security Implementation Guide - How It Works

## Overview
This document explains how JWT tokens with HttpOnly cookies are used to secure the HRMS application.

## Security Architecture

### 1. Authentication Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Browser │         │ Backend │         │ Database│
└────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │
     │ 1. POST /login    │                   │
     │ (email, password) │                   │
     ├───────────────────>│                   │
     │                   │                   │
     │                   │ 2. Validate      │
     │                   │    credentials    │
     │                   ├───────────────────>│
     │                   │                   │
     │                   │ 3. User data      │
     │                   │<───────────────────┤
     │                   │                   │
     │                   │ 4. Generate JWT   │
     │                   │    tokens         │
     │                   │                   │
     │ 5. Response       │                   │
     │ (HttpOnly cookies)│                   │
     │<───────────────────┤                   │
     │                   │                   │
     │ 6. Store cookies │                   │
     │    (automatic)    │                   │
     └───────────────────┘                   │
```

### 2. Token Storage (HttpOnly Cookies)

#### Before (localStorage) - ❌ Less Secure:
```javascript
// Tokens stored in localStorage
localStorage.setItem('token', 'eyJ...')
localStorage.setItem('refreshToken', 'eyJ...')

// ❌ Visible in DevTools → Application → Local Storage
// ❌ Accessible to JavaScript (XSS vulnerability)
// ❌ Can be stolen by malicious scripts
```

#### After (HttpOnly Cookies) - ✅ Secure:
```javascript
// Backend sets cookies automatically
Cookie: accessToken=eyJ...; HttpOnly; Secure; SameSite=Lax
Cookie: refreshToken=eyJ...; HttpOnly; Secure; SameSite=Lax

// ✅ NOT visible in localStorage
// ✅ NOT accessible to JavaScript
// ✅ Protected from XSS attacks
// ✅ Automatically sent with requests
```

### 3. Request Flow with Security

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│ Browser │         │  Filter │         │Controller│
└────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │
     │ 1. API Request    │                   │
     │ (with cookies)     │                   │
     ├───────────────────>│                   │
     │                   │                   │
     │                   │ 2. Extract token │
     │                   │    from cookie    │
     │                   │                   │
     │                   │ 3. Validate JWT   │
     │                   │    signature       │
     │                   │                   │
     │                   │ 4. Check expiry   │
     │                   │                   │
     │                   │ 5. Extract claims │
     │                   │    (email, role)  │
     │                   │                   │
     │                   │ 6. Set user info  │
     │                   │    in request     │
     │                   ├───────────────────>│
     │                   │                   │
     │                   │ 7. Process request│
     │                   │<───────────────────┤
     │                   │                   │
     │ 8. Response       │                   │
     │<───────────────────┤                   │
     └───────────────────┘                   │
```

## Security Features Explained

### 1. HttpOnly Cookies

**What it does:**
- Cookies are set with `HttpOnly` flag
- JavaScript cannot access these cookies
- Only the browser can send them with requests

**Code Example:**
```java
// Backend (AuthController.java)
Cookie accessTokenCookie = new Cookie("accessToken", token);
accessTokenCookie.setHttpOnly(true);  // ✅ JavaScript cannot access
accessTokenCookie.setSecure(false);   // Set to true in production (HTTPS)
accessTokenCookie.setPath("/");
accessTokenCookie.setMaxAge(86400);   // 24 hours
accessTokenCookie.setAttribute("SameSite", "Lax"); // CSRF protection
httpResponse.addCookie(accessTokenCookie);
```

**Security Benefit:**
- ✅ **XSS Protection**: Even if malicious script runs, it cannot steal tokens
- ✅ **Automatic Management**: Browser handles cookie sending automatically

### 2. JWT Token Structure

**Token Contents:**
```json
{
  "email": "user@example.com",
  "role": "ADMIN",
  "id": 123,
  "userType": "admin",
  "sub": "user@example.com",
  "iat": 1702000000,  // Issued at
  "exp": 1702086400   // Expires at (24 hours later)
}
```

**Security Features:**
- ✅ **Signed**: Token is cryptographically signed with secret key
- ✅ **Tamper-proof**: Any modification invalidates the signature
- ✅ **Expires**: Tokens automatically expire after 24 hours
- ✅ **Stateless**: No server-side session storage needed

### 3. Token Validation Process

**Step-by-Step:**

1. **Request Arrives**
   ```java
   // JwtAuthenticationFilter.java
   Cookie[] cookies = request.getCookies();
   // Extract accessToken from cookie
   ```

2. **Token Validation**
   ```java
   // JwtUtil.java
   if (jwtUtil.validateToken(token)) {
       // Check signature
       // Check expiration
       // Extract claims
   }
   ```

3. **User Info Extraction**
   ```java
   String email = jwtUtil.extractEmail(token);
   String role = jwtUtil.extractRole(token);
   Long id = jwtUtil.extractId(token);
   // Set in request for controller use
   ```

4. **Authorization**
   ```java
   // Controllers can check:
   String userRole = (String) request.getAttribute("userRole");
   if (!"SUPER_ADMIN".equals(userRole)) {
       return ResponseEntity.status(403).build();
   }
   ```

### 4. Automatic Token Refresh

**How it works:**

```
1. Access token expires (401 response)
   ↓
2. Frontend detects 401
   ↓
3. Calls /api/auth/refresh (refreshToken in cookie)
   ↓
4. Backend validates refreshToken
   ↓
5. Generates new accessToken
   ↓
6. Sets new accessToken in cookie
   ↓
7. Frontend retries original request
```

**Code:**
```javascript
// frontend/src/services/api.js
if (response.status === 401) {
  // Refresh token is in HttpOnly cookie
  const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include' // Cookies sent automatically
  })
  // New token set in cookie by backend
  // Retry original request
}
```

## Security Layers

### Layer 1: HttpOnly Cookies
- **Protection**: XSS attacks
- **How**: JavaScript cannot access cookies
- **Implementation**: `setHttpOnly(true)`

### Layer 2: JWT Signature
- **Protection**: Token tampering
- **How**: Cryptographic signature validation
- **Implementation**: HMAC-SHA256 with secret key

### Layer 3: Token Expiration
- **Protection**: Stolen token reuse
- **How**: Tokens expire after 24 hours
- **Implementation**: `exp` claim in JWT

### Layer 4: SameSite Attribute
- **Protection**: CSRF attacks
- **How**: Cookies only sent on same-site requests
- **Implementation**: `SameSite=Lax`

### Layer 5: Secure Flag (Production)
- **Protection**: Man-in-the-middle attacks
- **How**: Cookies only sent over HTTPS
- **Implementation**: `setSecure(true)` (requires HTTPS)

### Layer 6: Backend Validation
- **Protection**: Unauthorized access
- **How**: Every request validated
- **Implementation**: `JwtAuthenticationFilter`

## Security Comparison

### Before (localStorage):
```
❌ Tokens visible in DevTools
❌ Accessible to JavaScript
❌ Vulnerable to XSS
❌ Manual header management
❌ Can be stolen by scripts
```

### After (HttpOnly Cookies):
```
✅ Tokens NOT visible in localStorage
✅ NOT accessible to JavaScript
✅ Protected from XSS
✅ Automatic cookie management
✅ Cannot be stolen by scripts
✅ SameSite CSRF protection
✅ Secure flag for HTTPS (production)
```

## How Each Component Contributes to Security

### 1. Backend - JwtUtil.java
**Role**: Token generation and validation
- Generates cryptographically signed tokens
- Validates token signature and expiration
- Extracts user information securely

### 2. Backend - JwtAuthenticationFilter.java
**Role**: Request interception and validation
- Intercepts all API requests
- Validates tokens from cookies
- Blocks unauthorized requests
- Sets user context for controllers

### 3. Backend - AuthController.java
**Role**: Authentication and token management
- Sets HttpOnly cookies on login
- Manages token refresh
- Clears cookies on logout

### 4. Frontend - api.js
**Role**: Secure API communication
- Includes credentials (cookies) in all requests
- Handles token refresh automatically
- Manages authentication state

### 5. Frontend - auth.js
**Role**: Authentication state management
- Checks authentication status
- Clears auth data on logout
- Validates token expiration

## Security Best Practices Implemented

### ✅ 1. Token Storage
- HttpOnly cookies (not localStorage)
- Secure flag for production
- SameSite protection

### ✅ 2. Token Management
- Short-lived access tokens (24 hours)
- Long-lived refresh tokens (7 days)
- Automatic token refresh

### ✅ 3. Request Security
- All API calls include credentials
- Token validation on every request
- Automatic 401 handling

### ✅ 4. Authentication Enforcement
- Protected routes require valid tokens
- Backend validates all requests
- Frontend checks authentication state

### ✅ 5. Logout Security
- Backend clears cookies
- Frontend clears localStorage
- Complete session termination

## Production Security Checklist

### ⚠️ Before Deploying:

1. **Enable HTTPS**
   ```java
   accessTokenCookie.setSecure(true);
   refreshTokenCookie.setSecure(true);
   ```

2. **Strong Secret Key**
   ```properties
   jwt.secret=${JWT_SECRET}  # Use environment variable
   # Generate: openssl rand -base64 32
   ```

3. **Update CORS**
   ```java
   config.addAllowedOrigin("https://yourdomain.com");
   ```

4. **Environment Variables**
   - Store JWT secret in environment
   - Don't commit secrets to Git

5. **Cookie Domain** (if needed)
   ```java
   cookie.setDomain(".yourdomain.com");
   ```

## Attack Prevention

### XSS (Cross-Site Scripting)
**Prevented by**: HttpOnly cookies
- Malicious scripts cannot access tokens
- Even if XSS occurs, tokens are safe

### CSRF (Cross-Site Request Forgery)
**Prevented by**: SameSite cookie attribute
- Cookies only sent on same-site requests
- Prevents unauthorized cross-site requests

### Token Theft
**Prevented by**: HttpOnly + Secure flags
- JavaScript cannot read tokens
- HTTPS prevents interception

### Token Replay
**Prevented by**: Token expiration
- Tokens expire after 24 hours
- Refresh tokens expire after 7 days

### Man-in-the-Middle
**Prevented by**: HTTPS + Secure flag
- All traffic encrypted
- Cookies only sent over HTTPS

## How to Verify Security

### 1. Check Cookies
```
DevTools → Application → Cookies
✅ Should see: accessToken, refreshToken
✅ HttpOnly: ✓ (checked)
✅ Secure: (false in dev, true in prod)
```

### 2. Test XSS Protection
```javascript
// Try in browser console:
console.log(document.cookie)
// Should NOT show accessToken or refreshToken
// (HttpOnly cookies are not accessible)
```

### 3. Test Token Validation
```bash
# Without token:
curl http://localhost:8080/api/employees
# Should return: 401 Unauthorized

# With valid token:
curl -H "Cookie: accessToken=VALID_TOKEN" http://localhost:8080/api/employees
# Should return: 200 OK with data
```

### 4. Test Expiration
- Wait 24 hours OR manually expire token
- Make API call
- Should automatically refresh or redirect to login

## Summary

**Security is achieved through:**

1. **HttpOnly Cookies** - Tokens not accessible to JavaScript
2. **JWT Signatures** - Tokens cannot be tampered with
3. **Token Expiration** - Limited lifetime reduces risk
4. **Backend Validation** - Every request is checked
5. **Automatic Refresh** - Seamless re-authentication
6. **SameSite Protection** - CSRF prevention
7. **Secure Flag** - HTTPS requirement (production)

**Result**: Maximum security with minimal user friction! 🔒

