package com.hrms.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hrms.dto.NotificationDTO;
import com.hrms.entity.Notification;
import com.hrms.service.NotificationService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    private Long getCurrentUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("userId");
        if (userId instanceof Long) {
            return (Long) userId;
        } else if (userId instanceof Number) {
            return ((Number) userId).longValue();
        }
        return null;
    }

    private NotificationDTO convertToDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setUserId(notification.getUserId());
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setRelatedId(notification.getRelatedId());
        dto.setRelatedType(notification.getRelatedType());
        dto.setIsRead(notification.getIsRead());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Notification> notifications = notificationService.getUserNotifications(userId);
        List<NotificationDTO> dtos = notifications.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Notification> notifications = notificationService.getUnreadNotifications(userId);
        List<NotificationDTO> dtos = notifications.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long count = notificationService.getUnreadCount(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            notificationService.markAsRead(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Notification marked as read");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(HttpServletRequest request) {
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            notificationService.markAllAsRead(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "All notifications marked as read");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}


