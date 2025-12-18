package com.hrms.service;

import com.hrms.entity.EmployeeDocument;
import com.hrms.repository.EmployeeDocumentRepository;
import com.hrms.util.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class EmployeeDocumentService {

    @Autowired
    private EmployeeDocumentRepository documentRepository;

    @Autowired
    private FileStorageService fileStorageService;

    public EmployeeDocument uploadDocument(@NonNull Long employeeId, MultipartFile file,
                                          String documentType, String description) throws IOException {
        String filePath = fileStorageService.storeDocument(file);

        EmployeeDocument document = new EmployeeDocument();
        document.setEmployeeId(Objects.requireNonNull(employeeId));
        document.setDocumentType(documentType);
        document.setFileName(file.getOriginalFilename());
        document.setFilePath(filePath);
        document.setFileSize(file.getSize());
        document.setMimeType(file.getContentType());
        document.setDescription(description);
        document.setUploadedAt(LocalDateTime.now());
        document.setVerified(false);

        return documentRepository.save(document);
    }

    public List<EmployeeDocument> getEmployeeDocuments(@NonNull Long employeeId) {
        return documentRepository.findByEmployeeId(Objects.requireNonNull(employeeId));
    }

    public List<EmployeeDocument> getDocumentsByType(@NonNull Long employeeId, String documentType) {
        return documentRepository.findByEmployeeIdAndDocumentType(Objects.requireNonNull(employeeId), documentType);
    }

    public EmployeeDocument getDocumentById(@NonNull Long id) {
        return documentRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    public byte[] downloadDocument(@NonNull Long id) throws IOException {
        EmployeeDocument document = getDocumentById(Objects.requireNonNull(id));
        return fileStorageService.loadFile(document.getFilePath());
    }

    public EmployeeDocument verifyDocument(@NonNull Long id, Boolean verified) {
        EmployeeDocument document = getDocumentById(Objects.requireNonNull(id));
        document.setVerified(verified != null && verified);
        return documentRepository.save(document);
    }

    public void deleteDocument(@NonNull Long id) {
        EmployeeDocument document = getDocumentById(Objects.requireNonNull(id));
        fileStorageService.deleteFile(document.getFilePath());
        documentRepository.delete(document);
    }
}

