package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.entity.NotificationType;

public class DailyEnrollmentSummaryEvent extends AdminNotificationEvent {
    public DailyEnrollmentSummaryEvent(Object source, String title, String message, Long relatedEntityId) {
        super(source, NotificationType.DAILY_ENROLLMENT_SUMMARY, title, message, relatedEntityId);
    }
}
