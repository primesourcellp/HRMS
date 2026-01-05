package com.hrms.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    // Store OTPs: email -> {otp, expiryTime, userType}
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();
    private static final long OTP_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
    private final Random random = new Random();

    public String generateOtp(String email, String userType) {
        // Generate 6-digit OTP
        String otp = String.format("%06d", random.nextInt(1000000));
        
        long expiryTime = System.currentTimeMillis() + OTP_EXPIRY_TIME;
        otpStorage.put(email.toLowerCase(), new OtpData(otp, expiryTime, userType));
        
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        OtpData data = otpStorage.get(email.toLowerCase());
        if (data == null) {
            return false;
        }
        
        // Check if OTP is expired
        if (System.currentTimeMillis() > data.getExpiryTime()) {
            otpStorage.remove(email.toLowerCase());
            return false;
        }
        
        // Verify OTP
        boolean isValid = data.getOtp().equals(otp);
        if (isValid) {
            // Keep the OTP valid for password reset (don't remove yet)
            // It will be removed after successful password reset
        }
        return isValid;
    }

    public String getUserType(String email) {
        OtpData data = otpStorage.get(email.toLowerCase());
        if (data == null) {
            return null;
        }
        // Check if OTP is expired
        if (System.currentTimeMillis() > data.getExpiryTime()) {
            otpStorage.remove(email.toLowerCase());
            return null;
        }
        return data.getUserType();
    }

    public void removeOtp(String email) {
        otpStorage.remove(email.toLowerCase());
    }

    // Inner class to store OTP data
    private static class OtpData {
        private final String otp;
        private final long expiryTime;
        private final String userType;

        public OtpData(String otp, long expiryTime, String userType) {
            this.otp = otp;
            this.expiryTime = expiryTime;
            this.userType = userType;
        }

        public String getOtp() {
            return otp;
        }

        public long getExpiryTime() {
            return expiryTime;
        }

        public String getUserType() {
            return userType;
        }
    }
}

