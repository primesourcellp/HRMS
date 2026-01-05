package com.hrms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@primesourcellp.com");
            message.setTo(toEmail);
            message.setSubject("HRMS - Password Reset OTP");
            message.setText(
                "Dear User,\n\n" +
                "You have requested to reset your password for the HRMS Portal.\n\n" +
                "Your OTP (One-Time Password) is: " + otp + "\n\n" +
                "This OTP is valid for 10 minutes. Please do not share this OTP with anyone.\n\n" +
                "If you did not request a password reset, please ignore this email.\n\n" +
                "Best regards,\n" +
                "HRMS Team"
            );
            
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    public void sendPasswordResetSuccessEmail(String toEmail, String userName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@primesourcellp.com");
            message.setTo(toEmail);
            message.setSubject("HRMS - Password Reset Successful");
            message.setText(
                "Dear " + userName + ",\n\n" +
                "Your password has been successfully reset.\n\n" +
                "If you did not perform this action, please contact the system administrator immediately.\n\n" +
                "Best regards,\n" +
                "HRMS Team"
            );
            
            mailSender.send(message);
        } catch (Exception e) {
            // Log error but don't fail the password reset
            System.err.println("Failed to send password reset confirmation email: " + e.getMessage());
        }
    }
}

