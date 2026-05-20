package com.oryfolks.lms_backend.event;

import com.oryfolks.lms_backend.entity.NotificationType;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ManagerNotificationEvent extends ApplicationEvent {

    private final NotificationType type;
    private final String title;
    private final String message;
    private final Long relatedEntityId;

    public ManagerNotificationEvent(Object source, NotificationType type, String title, String message, Long relatedEntityId) {
        super(source);
        this.type = type;
        this.title = title;
        this.message = message;
        this.relatedEntityId = relatedEntityId;
    }
}
