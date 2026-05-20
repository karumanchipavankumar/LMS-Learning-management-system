package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.entity.NotificationType;

public class BulkUploadFailedEvent extends AdminNotificationEvent {
    public BulkUploadFailedEvent(Object source, String title, String message, Long relatedEntityId) {
        super(source, NotificationType.BULK_UPLOAD_FAILED, title, message, relatedEntityId);
    }
}
