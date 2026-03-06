package com.oryfolks.lms_backend.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.oryfolks.lms_backend.service.CustomUserDetailsService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7).trim();
                System.out.println("JwtAuthenticationFilter: Processing token");

                String username = jwtUtil.extractUsername(token);
                
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    if (jwtUtil.validateToken(token)) {
                        try {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            
                            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities());

                            System.out.println("JwtAuthenticationFilter: Authenticated user: " + username + " with authorities: " + userDetails.getAuthorities());

                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        } catch (Exception e) {
                            System.err.println("JwtAuthenticationFilter: Failed to load user details for " + username + ": " + e.getMessage());
                        }
                    } else {
                        System.out.println("JwtAuthenticationFilter: Token validation failed or expired");
                    }
                }
            } catch (Exception e) {
                System.err.println("JwtAuthenticationFilter: Error processing JWT token: " + e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
