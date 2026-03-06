package com.oryfolks.lms_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserManagementDTO {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String mobile;
    private String gender;
    private String role;
    private String employeeId;
    private String username;

    public UserManagementDTO() {

    }

    // public UserManagementDTO(Long id, String firstName, String lastName, String
    // email, String mobile, String gender,
    // String role, String employeeId, String username) {
    // this.id = id;
    // this.firstName = firstName;
    // this.lastName = lastName;
    // this.email = email;
    // this.mobile = email;
    // this.gender = gender;
    // this.role = role;
    // this.employeeId = employeeId;
    // this.username = username;
    // }

}
