package com.oryfolks.lms_backend.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private static final String SECRET_STRING = "mySuperSecretKeyForJwtSigningWhichIsAtLeast256Bits!";
    private static final Key SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes());

    public String generateToken(
            Long userId,
            String username,
            String role) {

        return Jwts.builder()

                // Username
                .setSubject(username)

                // Role
                .claim("role", role)

                // User ID
                .claim("userId", userId)

                // Token generated time
                .setIssuedAt(new Date())

                // Expiry time
                .setExpiration(
                        new Date(
                                System.currentTimeMillis() + 86400000))

                // Signature
                .signWith(
                        SECRET_KEY,
                        SignatureAlgorithm.HS256)

                .compact();
    }

    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        return !getClaims(token).getExpiration().before(new Date());
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder() // Use parserBuilder instead of parser()
                .setSigningKey(SECRET_KEY) // Set the signing key as a Key object
                .build() // Build the parser
                .parseClaimsJws(token) // Parse the JWT
                .getBody(); // Get the Claims
    }
}
