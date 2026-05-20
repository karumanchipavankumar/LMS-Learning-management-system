package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.entity.NotificationType;

public class SecurityAlertEvent extends AdminNotificationEvent {
    public SecurityAlertEvent(Object source, String title, String message, Long relatedEntityId) {
        super(source, NotificationType.SECURITY_ALERT, title, message, relatedEntityId);
    }
}
