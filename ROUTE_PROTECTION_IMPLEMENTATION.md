# Route Protection Implementation Guide

## Overview
This document describes the complete implementation of route protection for the HRMS application, ensuring that:
1. **Frontend**: Unauthenticated users are redirected to the login page
2. **Backend**: Invalid or missing tokens are rejected with 401 Unauthorized

## Implementation Summary

### ✅ Backend - JWT Token Validation

#### 1. JWT Authentication Filter (`JwtAuthenticationFilter.java`)
- **Location**: `backend/src/main/java/com/hrms/filter/JwtAuthenticationFilter.java`
- **Purpose**: Validates JWT tokens for all protected API endpoints

**Key Features**:
- Extends `OncePerRequestFilter` for automatic registration by Spring Boot
- Validates tokens from HttpOnly cookies (`accessToken`) or Authorization header
- **Rejects requests** with 401 if token is missing or invalid
- Extracts user info from valid tokens and sets as request attributes
- Excludes public endpoints (`/api/auth/*` except `/api/auth/verify`)

**Filter Logic**:
```java
// Requires valid token for all protected endpoints
if (token == null || !jwtUtil.validateToken(token)) {
    response.setStatus(401);
    return; // Block request
}
```

#### 2. Token Verification Endpoint (`/api/auth/verify`)
- **Location**: `backend/src/main/java/com/hrms/controller/AuthController.java`
- **Purpose**: Allows frontend to verify token validity

**Endpoint**: `GET /api/auth/verify`
- Protected by `JwtAuthenticationFilter` (requires valid token)
- Returns user info if token is valid
- Returns 401 if token is invalid or missing

**Response Format**:
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "SUPER_ADMIN",
    "userType": "admin"
  }
}
```

#### 3. Filter Order Configuration
- **Location**: `backend/src/main/java/com/hrms/config/FilterOrderConfig.java`
- Ensures CORS filter runs **before** JWT filter (HIGHEST_PRECEDENCE)
- Prevents CORS preflight (OPTIONS) requests from being blocked

### ✅ Frontend - Route Protection

#### 1. Protected Route Component (`App.jsx`)
- **Location**: `frontend/src/App.jsx`
- **Purpose**: Protects all routes except `/login` and `/register`

**Features**:
- Verifies authentication with backend on route access
- Shows loading state while verifying
- Redirects to `/login` if not authenticated
- Uses async token verification for accurate validation

**Implementation**:
```jsx
function ProtectedRoute() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        setIsValid(false)
        setIsVerifying(false)
        return
      }
      const valid = await verifyToken()
      setIsValid(valid)
      setIsVerifying(false)
    }
    checkAuth()
  }, [])

  if (isVerifying) return <LoadingSpinner />
  if (!isValid) return <Navigate to="/login" replace />
  return <Layout />
}
```

#### 2. Authentication Utility (`utils/auth.js`)
- **Location**: `frontend/src/utils/auth.js`
- **Purpose**: Provides authentication helper functions

**Functions**:
- `isAuthenticated()`: Quick synchronous check (localStorage flag)
- `verifyToken()`: Async backend verification (validates actual token)
- `clearAuth()`: Clears all authentication data

**Token Verification**:
```javascript
export const verifyToken = async () => {
  const result = await api.verifyToken()
  if (result.authenticated) {
    localStorage.setItem('isAuthenticated', 'true')
    return true
  } else {
    clearAuth()
    return false
  }
}
```

#### 3. API Service (`services/api.js`)
- **Location**: `frontend/src/services/api.js`
- **Added**: `verifyToken()` method to call `/api/auth/verify` endpoint

## Security Flow

### Login Flow:
1. User submits credentials
2. Backend validates and generates JWT tokens
3. Tokens stored in HttpOnly cookies (secure)
4. Frontend sets `isAuthenticated` flag in localStorage
5. User redirected to dashboard

### Protected Route Access:
1. User navigates to protected route (e.g., `/dashboard`)
2. `ProtectedRoute` component mounts
3. Checks `isAuthenticated()` flag (quick check)
4. Calls `verifyToken()` to validate with backend
5. Backend validates token from cookie
6. If valid → Allow access
7. If invalid → Redirect to `/login`

### API Request Flow:
1. Frontend makes API call (e.g., `api.getEmployees()`)
2. `fetchWithAuth()` includes cookies automatically (`credentials: 'include'`)
3. Backend `JwtAuthenticationFilter` intercepts request
4. Filter validates token:
   - Checks cookie for `accessToken`
   - Falls back to `Authorization: Bearer <token>` header
   - Validates token signature and expiration
5. If valid → Extract user info, allow request
6. If invalid → Return `401 Unauthorized`
7. Frontend handles 401:
   - Tries to refresh token
   - If refresh fails → Clear auth and redirect to login

### Token Expiration:
1. Token expires (after 24 hours)
2. Frontend `ProtectedRoute` calls `verifyToken()`
3. Backend returns 401 (token expired)
4. Frontend clears auth data
5. User redirected to `/login`

## Protected Routes

All routes are protected except:
- `/login` - Login page
- `/register` - Registration page (first Super Admin only)

Protected routes include:
- `/dashboard`
- `/employees`
- `/attendance`
- `/leave`
- `/payroll`
- `/performance`
- `/shifts`
- `/tickets`
- `/analytics`
- `/users`
- `/settings`

## Backend Protected Endpoints

All `/api/*` endpoints are protected except:
- `/api/auth/login` - Admin login
- `/api/auth/employee/login` - Employee login
- `/api/auth/register` - Registration
- `/api/auth/check` - Check user exists
- `/api/auth/check-superadmin` - Check super admin exists
- `/api/auth/refresh` - Token refresh
- `/api/auth/logout` - Logout
- `/api/auth/verify` - **Protected** (requires valid token)

## Testing

### Test Frontend Protection:
1. Clear localStorage: `localStorage.clear()`
2. Try to access `/dashboard` directly
3. Should redirect to `/login`

### Test Backend Protection:
1. Open browser DevTools → Network tab
2. Make API call without token (or with invalid token)
3. Should receive `401 Unauthorized` response

### Test Token Verification:
1. Login successfully
2. Access protected route
3. Should see "Verifying authentication..." briefly
4. Then access granted

## Key Security Features

✅ **HttpOnly Cookies**: Tokens stored in HttpOnly cookies (not accessible to JavaScript)
✅ **Token Validation**: Backend validates token signature and expiration
✅ **Route Protection**: Frontend verifies authentication before allowing access
✅ **Automatic Redirect**: Unauthenticated users redirected to login
✅ **Token Refresh**: Automatic token refresh on expiration
✅ **Secure Logout**: Clears all authentication data

## Troubleshooting

### Issue: Users can still access dashboard without login
**Solution**: 
- Clear browser cache and localStorage
- Restart backend server
- Verify `ProtectedRoute` is wrapping protected routes

### Issue: Getting 401 on all API calls
**Solution**:
- Check if cookies are being sent (`credentials: 'include'`)
- Verify token is not expired
- Check backend filter is not blocking CORS preflight

### Issue: Infinite redirect loop
**Solution**:
- Check `verifyToken()` is not throwing errors
- Verify `/api/auth/verify` endpoint is accessible
- Check browser console for errors

## Files Modified

### Backend:
1. `backend/src/main/java/com/hrms/filter/JwtAuthenticationFilter.java`
   - Updated `shouldNotFilter()` to protect `/api/auth/verify`
   - Already validates tokens and rejects invalid ones

2. `backend/src/main/java/com/hrms/controller/AuthController.java`
   - Added `verifyToken()` endpoint

### Frontend:
1. `frontend/src/App.jsx`
   - Updated `ProtectedRoute` to verify tokens with backend
   - Added loading state

2. `frontend/src/utils/auth.js`
   - Added `verifyToken()` function
   - Improved `isAuthenticated()` documentation

3. `frontend/src/services/api.js`
   - Added `verifyToken()` API method

## Next Steps

For production deployment:
1. Set `Secure` flag to `true` on cookies (requires HTTPS)
2. Configure CORS for production domain
3. Add rate limiting for login endpoints
4. Implement token blacklisting for logout
5. Add refresh token rotation

