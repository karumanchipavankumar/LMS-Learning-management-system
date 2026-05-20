package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.entity.NotificationType;

public class CourseDeletedEvent extends AdminNotificationEvent {
    public CourseDeletedEvent(Object source, String title, String message, Long relatedEntityId) {
        super(source, NotificationType.COURSE_DELETED, title, message, relatedEntityId);
    }
}
