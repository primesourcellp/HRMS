package com.hrms.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;

import com.hrms.entity.EmployeeDocument;
import com.hrms.repository.EmployeeDocumentRepository;
import com.hrms.repository.EmployeeRepository;
import com.hrms.util.FileStorageService;

@Service
public class EmployeeDocumentService {

    @Autowired
    private EmployeeDocumentRepository documentRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private FileStorageService fileStorageService;

    public EmployeeDocument uploadDocument(@NonNull Long employeeId, MultipartFile file, String documentType, String description) throws IOException {
        employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        String filePath = fileStorageService.storeDocument(file);

        EmployeeDocument document = new EmployeeDocument();
        document.setEmployeeId(employeeId);
        document.setDocumentType(documentType);
        document.setFileName(file.getOriginalFilename());
        document.setFilePath(filePath);
        document.setFileSize(file.getSize());
        document.setMimeType(file.getContentType());
        document.setDescription(description);
        document.setUploadedAt(LocalDateTime.now());
        // Auto-verify documents when uploaded - they can be viewed immediately
        document.setVerified(true);

        return documentRepository.save(document);
    }

    public List<EmployeeDocument> getEmployeeDocuments(@NonNull Long employeeId) {
        return documentRepository.findByEmployeeId(employeeId);
    }

    public List<EmployeeDocument> getDocumentsByType(@NonNull Long employeeId, String documentType) {
        return documentRepository.findByEmployeeIdAndDocumentType(employeeId, documentType);
    }

    public EmployeeDocument getDocumentById(@NonNull Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    public void deleteDocument(@NonNull Long id) {
        EmployeeDocument document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        
        fileStorageService.deleteFile(document.getFilePath());
        documentRepository.deleteById(id);
    }

    public EmployeeDocument verifyDocument(@NonNull Long id, Boolean verified) {
        EmployeeDocument document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        document.setVerified(verified);
        return documentRepository.save(document);
    }

    public byte[] downloadDocument(@NonNull Long id) throws IOException {
        EmployeeDocument document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        return fileStorageService.loadFile(document.getFilePath());
    }
}
