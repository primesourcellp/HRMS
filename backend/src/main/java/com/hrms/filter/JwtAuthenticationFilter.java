package com.hrms.filter;

import com.hrms.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        
        // Skip JWT validation for public endpoints
        if (path.startsWith("/api/auth/") || path.equals("/error")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get token from Authorization header
        String authHeader = request.getHeader("Authorization");
        String token = null;
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // Validate token if present
        if (token != null) {
            if (jwtUtil.validateToken(token)) {
                try {
                    String email = jwtUtil.extractEmail(token);
                    String role = jwtUtil.extractRole(token);
                    Long id = jwtUtil.extractId(token);
                    String userType = jwtUtil.extractUserType(token);
                    
                    // Set user info as request attributes for use in controllers
                    request.setAttribute("userEmail", email);
                    request.setAttribute("userRole", role);
                    request.setAttribute("userId", id);
                    request.setAttribute("userType", userType);
                    
                } catch (Exception e) {
                    // Token is invalid, but don't block if it's an optional endpoint
                    // Controllers will handle authorization
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}

