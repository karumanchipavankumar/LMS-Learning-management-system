package com.oryfolks.lms_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.oryfolks.lms_backend.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    // get all employees
    List<User> findByRole(String role);
    long countByRole(String role);
    long countByRoleNot(String role);
}
