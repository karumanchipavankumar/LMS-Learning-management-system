package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.entity.NotificationType;

public class UserDeletedEvent extends AdminNotificationEvent {
    public UserDeletedEvent(Object source, String title, String message, Long relatedEntityId) {
        super(source, NotificationType.USER_DELETED, title, message, relatedEntityId);
    }
}
