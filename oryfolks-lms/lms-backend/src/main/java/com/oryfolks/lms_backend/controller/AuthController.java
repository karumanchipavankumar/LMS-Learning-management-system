package com.oryfolks.lms_backend.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.oryfolks.lms_backend.DTO.LoginRequest;
import com.oryfolks.lms_backend.service.UserService;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest request) {

        String token = userService.login(
                request.getUsername(),
                request.getPassword());

        return ResponseEntity.ok(Map.of("token", token));
    }
}
