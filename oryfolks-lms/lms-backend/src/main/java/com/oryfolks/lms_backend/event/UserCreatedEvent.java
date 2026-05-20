package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.entity.NotificationType;

public class UserCreatedEvent extends AdminNotificationEvent {
    public UserCreatedEvent(Object source, String title, String message, Long relatedEntityId) {
        super(source, NotificationType.USER_CREATED, title, message, relatedEntityId);
    }
}
