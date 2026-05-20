package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.entity.NotificationType;

public class CourseCreatedEvent extends AdminNotificationEvent {
    public CourseCreatedEvent(Object source, String title, String message, Long relatedEntityId) {
        super(source, NotificationType.COURSE_CREATED, title, message, relatedEntityId);
    }
}
