package com.oryfolks.lms_backend.DTO;

import com.oryfolks.lms_backend.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private Long recipientId;
    private NotificationType type;
    private String title;
    private String message;
    private Long relatedEntityId;
    private boolean isRead;
    private LocalDateTime createdAt;
}
