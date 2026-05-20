package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.entity.NotificationType;

public class HighActivityAlertEvent extends AdminNotificationEvent {
    public HighActivityAlertEvent(Object source, String title, String message, Long relatedEntityId) {
        super(source, NotificationType.HIGH_ACTIVITY_ALERT, title, message, relatedEntityId);
    }
}
