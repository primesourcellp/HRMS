package com.hrms.filter;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.lang.NonNull;

import com.hrms.util.JwtUtil;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;
    
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        
        // Skip filtering for:
        // 1. OPTIONS requests (CORS preflight) - must be handled by CORS filter first
        // 2. Public auth endpoints
        // 3. Error pages
        return "OPTIONS".equalsIgnoreCase(method) || 
               path.startsWith("/api/auth/") || 
               path.equals("/error");
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        
        // Additional safety check (should not reach here due to shouldNotFilter, but just in case)
        if (path.startsWith("/api/auth/") || path.equals("/error")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get token from cookie (preferred) or Authorization header (fallback)
        String token = null;
        
        // First try to get from cookie (HttpOnly cookie)
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }
        
        // Fallback to Authorization header if cookie not found
        if (token == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }

        // Require valid token for all protected API endpoints
        if (token == null || !jwtUtil.validateToken(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Token is missing or invalid. Please login again.\"}");
            return;
        }

        // Token is valid, extract user info
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
            // Token validation passed but extraction failed - still reject
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Invalid token format\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
