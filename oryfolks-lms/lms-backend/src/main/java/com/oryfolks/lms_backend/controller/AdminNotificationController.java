package com.oryfolks.lms_backend.controller;

import com.oryfolks.lms_backend.event.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/notifications")
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminNotificationController {

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @PostMapping("/simulate")
    public ResponseEntity<?> simulateEvent(@RequestBody Map<String, Object> payload) {
        String type = (String) payload.getOrDefault("type", "");
        String title = (String) payload.getOrDefault("title", "Simulated Event");
        String message = (String) payload.getOrDefault("message", "This is a simulated notification.");
        
        Long relatedEntityId = null;
        if (payload.containsKey("relatedEntityId") && payload.get("relatedEntityId") != null) {
            relatedEntityId = Long.valueOf(String.valueOf(payload.get("relatedEntityId")));
        }

        switch (type.toUpperCase()) {
            case "USER_CREATED":
                eventPublisher.publishEvent(new UserCreatedEvent(this, title, message, relatedEntityId));
                break;
            case "USER_DELETED":
                eventPublisher.publishEvent(new UserDeletedEvent(this, title, message, relatedEntityId));
                break;
            case "COURSE_CREATED":
                eventPublisher.publishEvent(new CourseCreatedEvent(this, title, message, relatedEntityId));
                break;
            case "COURSE_DELETED":
                eventPublisher.publishEvent(new CourseDeletedEvent(this, title, message, relatedEntityId));
                break;
            case "DAILY_ENROLLMENT_SUMMARY":
                eventPublisher.publishEvent(new DailyEnrollmentSummaryEvent(this, title, message, relatedEntityId));
                break;
            case "MANAGER_PENDING_APPROVAL":
                eventPublisher.publishEvent(new ManagerPendingApprovalEvent(this, title, message, relatedEntityId));
                break;
            default:
                return ResponseEntity.badRequest().body(Map.of("error", "Unknown simulation type: " + type));
        }

        return ResponseEntity.ok(Map.of("message", "Simulated event of type " + type + " published successfully."));
    }
}
