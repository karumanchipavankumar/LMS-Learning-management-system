package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.entity.NotificationType;

public class PasswordChangedEvent extends AdminNotificationEvent {
    public PasswordChangedEvent(Object source, String title, String message, Long relatedEntityId) {
        super(source, NotificationType.PASSWORD_CHANGED, title, message, relatedEntityId);
    }
}
