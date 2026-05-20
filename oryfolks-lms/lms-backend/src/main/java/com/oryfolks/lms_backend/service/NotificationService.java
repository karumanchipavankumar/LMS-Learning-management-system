package com.oryfolks.lms_backend.service;

import com.oryfolks.lms_backend.DTO.NotificationDTO;
import com.oryfolks.lms_backend.entity.Notification;
import com.oryfolks.lms_backend.entity.NotificationType;
import com.oryfolks.lms_backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public void createNotification(Long recipientId, NotificationType type, String title, String message, Long relatedEntityId) {
        Notification notification = new Notification();
        notification.setRecipientId(recipientId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    public List<NotificationDTO> getLatestNotifications(Long recipientId) {
        return notificationRepository.findTop10ByRecipientIdOrderByCreatedAtDesc(recipientId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public Page<NotificationDTO> getAllNotifications(Long recipientId, Pageable pageable) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId, pageable)
                .map(this::mapToDTO);
    }

    public long getUnreadCount(Long recipientId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(recipientId);
    }

    public void markAsRead(Long notificationId, Long recipientId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getRecipientId().equals(recipientId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(Long recipientId) {
        List<Notification> unreadNotifications = notificationRepository.findByRecipientIdAndIsReadFalse(recipientId);
        for (Notification n : unreadNotifications) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unreadNotifications);
    }

    public void deleteNotification(Long notificationId, Long recipientId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getRecipientId().equals(recipientId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        notificationRepository.delete(notification);
    }

    public void deleteAllNotifications(Long recipientId) {
        notificationRepository.deleteByRecipientId(recipientId);
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 0 * * *") // Run at midnight every day
    public void autoDeleteOldNotifications() {
        java.time.LocalDateTime expiryDate = java.time.LocalDateTime.now().minusDays(15);
        notificationRepository.deleteByCreatedAtBefore(expiryDate);
    }

    @Autowired
    private com.oryfolks.lms_backend.repository.EmployeeCourseRepository employeeCourseRepository;

    @Autowired
    private com.oryfolks.lms_backend.repository.CourseRepository courseRepository;

    @Autowired
    private com.oryfolks.lms_backend.repository.UserRepository userRepository;

    @Autowired
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 1 * * *") // Run at 1 AM every day
    public void checkMissedDeadlines() {
        java.time.LocalDate today = java.time.LocalDate.now();
        List<com.oryfolks.lms_backend.entity.EmployeeCourse> courses = employeeCourseRepository.findAll();
        
        for (com.oryfolks.lms_backend.entity.EmployeeCourse ec : courses) {
            if (ec.getDeadline() != null && ec.getDeadline().isBefore(today) && !"COMPLETED".equals(ec.getStatus())) {
                com.oryfolks.lms_backend.entity.Course course = courseRepository.findById(ec.getCourseId()).orElse(null);
                String courseTitle = course != null ? course.getTitle() : "a course";
                
                com.oryfolks.lms_backend.entity.User employee = userRepository.findById(ec.getEmployeeId()).orElse(null);
                String empName = employee != null ? employee.getUsername() : "An employee";

                eventPublisher.publishEvent(new com.oryfolks.lms_backend.event.ManagerNotificationEvent(
                        this,
                        NotificationType.DEADLINE_MISSED,
                        "Course Deadline Missed",
                        empName + " has missed the deadline for '" + courseTitle + "'",
                        ec.getCourseId()
                ));
            }
        }
    }

    private NotificationDTO mapToDTO(Notification notification) {
        return new NotificationDTO(
                notification.getId(),
                notification.getRecipientId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getRelatedEntityId(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
