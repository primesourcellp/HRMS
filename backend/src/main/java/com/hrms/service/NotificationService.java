package com.hrms.service;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hrms.entity.Notification;
import com.hrms.entity.TeamMember;
import com.hrms.entity.User;
import com.hrms.repository.NotificationRepository;
import com.hrms.repository.TeamMemberRepository;
import com.hrms.repository.UserRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Find HR_ADMIN users who have the given employee in their assigned teams
     */
    private Set<Long> findHrAdminsForEmployee(Long employeeId) {
        Set<Long> hrAdminIds = new HashSet<>();
        
        // Find all teams where this employee is a member
        List<TeamMember> employeeMemberships = teamMemberRepository.findByEmployeeId(employeeId);
        
        for (TeamMember membership : employeeMemberships) {
            Long teamId = membership.getTeamId();
            
            // Find all HR_ADMIN members in this team
            List<TeamMember> teamMembers = teamMemberRepository.findByTeamId(teamId);
            for (TeamMember member : teamMembers) {
                User user = userRepository.findById(member.getEmployeeId()).orElse(null);
                if (user != null && "HR_ADMIN".equals(user.getRole())) {
                    hrAdminIds.add(user.getId());
                }
            }
        }
        
        return hrAdminIds;
    }

    /**
     * Find all SUPER_ADMIN users
     */
    private Set<Long> findSuperAdmins() {
        return userRepository.findAll().stream()
                .filter(user -> "SUPER_ADMIN".equals(user.getRole()))
                .map(User::getId)
                .collect(Collectors.toSet());
    }

    /**
     * Create notification for leave application by team member
     * If HR_ADMIN applies for leave, notify only SUPER_ADMIN
     * Otherwise, notify HR_ADMINs who manage the employee
     */
    @Transactional
    public void notifyLeaveApplication(Long employeeId, Long leaveId, String employeeName, String leaveType, String startDate, String endDate) {
        // Check if the employee applying for leave is an HR_ADMIN
        User employee = userRepository.findById(employeeId).orElse(null);
        boolean isHrAdmin = employee != null && "HR_ADMIN".equals(employee.getRole());
        
        Set<Long> recipientIds;
        if (isHrAdmin) {
            // If HR_ADMIN applies for leave, notify only SUPER_ADMIN
            recipientIds = findSuperAdmins();
        } else {
            // For other employees, notify HR_ADMINs who manage them
            recipientIds = findHrAdminsForEmployee(employeeId);
        }
        
        String title = "Leave Application Submitted";
        String message = String.format("%s has applied for %s leave from %s to %s", 
                employeeName, leaveType, startDate, endDate);
        
        for (Long recipientId : recipientIds) {
            Notification notification = new Notification();
            notification.setUserId(recipientId);
            notification.setType("LEAVE_APPLIED");
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setRelatedId(leaveId);
            notification.setRelatedType("LEAVE");
            notificationRepository.save(notification);
        }
    }

    /**
     * Create notification for HR ticket creation by team member
     */
    @Transactional
    public void notifyHRTicketCreated(Long employeeId, Long ticketId, String employeeName, String ticketSubject) {
        Set<Long> hrAdminIds = findHrAdminsForEmployee(employeeId);
        
        String title = "HR Ticket Created";
        String message = String.format("%s has created an HR ticket: %s", employeeName, ticketSubject);
        
        for (Long hrAdminId : hrAdminIds) {
            Notification notification = new Notification();
            notification.setUserId(hrAdminId);
            notification.setType("HR_TICKET_CREATED");
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setRelatedId(ticketId);
            notification.setRelatedType("HR_TICKET");
            notificationRepository.save(notification);
        }
    }

    /**
     * Create notification for leave approval (to SUPER_ADMIN and the employee)
     */
    @Transactional
    public void notifyLeaveApproved(Long leaveId, Long employeeId, String employeeName, String leaveType, String startDate, String endDate, Long approvedByUserId) {
        Set<Long> superAdminIds = findSuperAdmins();
        
        // Get approver name
        String approverName = "Unknown";
        User approver = userRepository.findById(approvedByUserId).orElse(null);
        if (approver != null) {
            approverName = approver.getName();
        }
        
        // Notify SUPER_ADMIN
        String title = "Leave Approved";
        String message = String.format("Leave request for %s (%s) from %s to %s has been approved by %s", 
                employeeName, leaveType, startDate, endDate, approverName);
        
        for (Long superAdminId : superAdminIds) {
            Notification notification = new Notification();
            notification.setUserId(superAdminId);
            notification.setType("LEAVE_APPROVED");
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setRelatedId(leaveId);
            notification.setRelatedType("LEAVE");
            notificationRepository.save(notification);
        }
        
        // Notify the employee
        String employeeTitle = "Leave Approved";
        String employeeMessage = String.format("Your %s leave request from %s to %s has been approved by %s", 
                leaveType, startDate, endDate, approverName);
        
        Notification employeeNotification = new Notification();
        employeeNotification.setUserId(employeeId);
        employeeNotification.setType("LEAVE_APPROVED");
        employeeNotification.setTitle(employeeTitle);
        employeeNotification.setMessage(employeeMessage);
        employeeNotification.setRelatedId(leaveId);
        employeeNotification.setRelatedType("LEAVE");
        notificationRepository.save(employeeNotification);
    }

    /**
     * Create notification for leave rejection (to the employee)
     */
    @Transactional
    public void notifyLeaveRejected(Long leaveId, Long employeeId, String employeeName, String leaveType, String startDate, String endDate, String rejectionReason, Long rejectedByUserId) {
        // Get rejector name
        String rejectorName = "Unknown";
        User rejector = userRepository.findById(rejectedByUserId).orElse(null);
        if (rejector != null) {
            rejectorName = rejector.getName();
        }
        
        // Notify the employee
        String title = "Leave Rejected";
        String message = String.format("Your %s leave request from %s to %s has been rejected by %s", 
                leaveType, startDate, endDate, rejectorName);
        
        if (rejectionReason != null && !rejectionReason.trim().isEmpty()) {
            message += String.format(". Reason: %s", rejectionReason);
        }
        
        Notification notification = new Notification();
        notification.setUserId(employeeId);
        notification.setType("LEAVE_REJECTED");
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRelatedId(leaveId);
        notification.setRelatedType("LEAVE");
        notificationRepository.save(notification);
    }

    /**
     * Get all notifications for a user
     */
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get unread notifications for a user
     */
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    /**
     * Get unread notification count for a user
     */
    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Mark notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    /**
     * Delete (clear) a notification for a user
     */
    @Transactional
    public void deleteForUser(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(Objects.requireNonNull(notificationId))
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (notification.getUserId() == null || !notification.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this notification");
        }

        notificationRepository.delete(notification);
    }

    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        for (Notification notification : notifications) {
            notification.setIsRead(true);
        }
        notificationRepository.saveAll(notifications);
    }
}

