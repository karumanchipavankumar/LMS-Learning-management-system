package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.entity.NotificationType;

public class BulkImportCompletedEvent extends AdminNotificationEvent {
    public BulkImportCompletedEvent(Object source, String title, String message, Long relatedEntityId) {
        super(source, NotificationType.BULK_IMPORT_COMPLETED, title, message, relatedEntityId);
    }
}
