package com.oryfolks.lms_backend.repository;

import com.oryfolks.lms_backend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findTop10ByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    
    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);
    
    long countByRecipientIdAndIsReadFalse(Long recipientId);
    
    List<Notification> findByRecipientIdAndIsReadFalse(Long recipientId);

    void deleteByRecipientId(Long recipientId);

    void deleteByCreatedAtBefore(java.time.LocalDateTime expiryDate);
}
