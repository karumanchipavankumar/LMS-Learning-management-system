package com.oryfolks.lms_backend.service;

import com.oryfolks.lms_backend.DTO.AddUserForm;
import com.oryfolks.lms_backend.entity.User;

public interface UserService {

    User createUser(User user);

    String login(String username, String password);

    void resetPassword(String username, String newPassword);

    void addUser(AddUserForm user);

    com.oryfolks.lms_backend.entity.UserProfile getProfile(String username);

    com.oryfolks.lms_backend.entity.UserProfile updateProfile(String username,
            com.oryfolks.lms_backend.entity.UserProfile updatedProfile);
}
