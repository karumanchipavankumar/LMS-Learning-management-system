package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventListener {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.oryfolks.lms_backend.repository.UserRepository userRepository;

    @EventListener
    public void handleNotificationEvent(NotificationEvent event) {
        notificationService.createNotification(
                event.getRecipientId(),
                event.getType(),
                event.getTitle(),
                event.getMessage(),
                event.getRelatedEntityId()
        );
    }

    @EventListener
    public void handleManagerNotificationEvent(ManagerNotificationEvent event) {
        java.util.List<com.oryfolks.lms_backend.entity.User> managers = userRepository.findByRole("MANAGER");
        for (com.oryfolks.lms_backend.entity.User manager : managers) {
            notificationService.createNotification(
                    manager.getId(),
                    event.getType(),
                    event.getTitle(),
                    event.getMessage(),
                    event.getRelatedEntityId()
            );
        }
    }

    @EventListener
    public void handleAdminNotificationEvent(AdminNotificationEvent event) {
        System.out.println("NotificationEventListener: Received AdminNotificationEvent: type=" + event.getType() + ", title=" + event.getTitle());
        java.util.List<com.oryfolks.lms_backend.entity.User> admins = userRepository.findByRole("ADMIN");
        System.out.println("NotificationEventListener: Found " + (admins != null ? admins.size() : 0) + " admin(s) to notify.");
        if (admins != null) {
            for (com.oryfolks.lms_backend.entity.User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        event.getType(),
                        event.getTitle(),
                        event.getMessage(),
                        event.getRelatedEntityId()
                );
            }
        }
    }
}
