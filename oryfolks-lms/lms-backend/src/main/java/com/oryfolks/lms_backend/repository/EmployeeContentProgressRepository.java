package com.oryfolks.lms_backend.repository;

import com.oryfolks.lms_backend.entity.EmployeeContentProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface EmployeeContentProgressRepository extends JpaRepository<EmployeeContentProgress, Long> {
    Optional<EmployeeContentProgress> findByEmployeeIdAndContentId(Long employeeId, Long contentId);
    List<EmployeeContentProgress> findByEmployeeId(Long employeeId);
    void deleteByEmployeeId(Long employeeId);
}
