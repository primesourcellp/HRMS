# How to Generate JWT Secret Keys

## Quick Reference

For JWT HMAC-SHA256 signing, you need a **minimum 256-bit (32 bytes)** secret key.

## Methods to Generate

### 1. PowerShell (Windows) - Recommended
```powershell
$bytes = New-Object byte[] 32
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### 2. Online Generator
- Visit: https://generate-secret.vercel.app/32
- Select "Base64" format
- Copy the generated key

### 3. OpenSSL (Linux/Mac/Git Bash)
```bash
openssl rand -base64 32
```

### 4. Java Code
```java
import java.security.SecureRandom;
import java.util.Base64;

public class GenerateSecret {
    public static void main(String[] args) {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String secret = Base64.getEncoder().encodeToString(bytes);
        System.out.println("JWT Secret: " + secret);
    }
}
```

### 5. Node.js
```javascript
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('base64');
console.log(secret);
```

### 6. Python
```python
import secrets
import base64

secret = base64.b64encode(secrets.token_bytes(32)).decode('utf-8')
print(secret)
```

## Key Requirements

- **Minimum Length:** 32 bytes (256 bits)
- **Format:** Base64-encoded string
- **Security:** Use cryptographically secure random generator
- **Storage:** Keep secret and never commit to version control

## Current Configuration

Your current secret key is in:
```
backend/src/main/resources/application.properties
```

Property: `jwt.secret`

## For Production

1. Generate a new unique key using one of the methods above
2. Store it in environment variable:
   ```properties
   jwt.secret=${JWT_SECRET}
   ```
3. Set environment variable on your server
4. Never commit production keys to Git

## Example Environment Variable Setup

### Windows (PowerShell)
```powershell
$env:JWT_SECRET="your-generated-secret-here"
```

### Linux/Mac
```bash
export JWT_SECRET="your-generated-secret-here"
```

### application.properties
```properties
jwt.secret=${JWT_SECRET:8i470klppPQCmEcraOhFcBt5Bvs6x5btoFN9O7b4xok=}
```
(Default fallback for development)

