package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.entity.NotificationType;

public class ManagerPendingApprovalEvent extends AdminNotificationEvent {
    public ManagerPendingApprovalEvent(Object source, String title, String message, Long relatedEntityId) {
        super(source, NotificationType.MANAGER_PENDING_APPROVAL, title, message, relatedEntityId);
    }
}
