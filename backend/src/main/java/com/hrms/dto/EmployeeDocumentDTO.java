package com.hrms.dto;

import java.time.LocalDateTime;

public class EmployeeDocumentDTO {
    private Long id;
    private Long employeeId;
    private String documentType;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private String description;
    private LocalDateTime uploadedAt;
    private Boolean verified;

    // Constructors
    public EmployeeDocumentDTO() {
    }

    public EmployeeDocumentDTO(Long id, Long employeeId, String documentType, String fileName,
                             String filePath, Long fileSize, String mimeType, String description,
                             LocalDateTime uploadedAt, Boolean verified) {
        this.id = id;
        this.employeeId = employeeId;
        this.documentType = documentType;
        this.fileName = fileName;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.mimeType = mimeType;
        this.description = description;
        this.uploadedAt = uploadedAt;
        this.verified = verified;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
        this.employeeId = employeeId;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public Boolean getVerified() {
        return verified;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified;
    }
}

