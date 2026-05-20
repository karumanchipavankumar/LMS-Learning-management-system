package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.entity.NotificationType;

public class SystemErrorEvent extends AdminNotificationEvent {
    public SystemErrorEvent(Object source, String title, String message, Long relatedEntityId) {
        super(source, NotificationType.SYSTEM_ERROR, title, message, relatedEntityId);
    }
}
