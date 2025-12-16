package com.hrms.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
<<<<<<< HEAD
import org.springframework.lang.NonNull;
=======
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc

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

<<<<<<< HEAD
    public EmployeeDocument uploadDocument(@NonNull Long employeeId, MultipartFile file, String documentType, String description) throws IOException {
=======
    public EmployeeDocument uploadDocument(Long employeeId, MultipartFile file, String documentType, String description) throws IOException {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
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

<<<<<<< HEAD
    public List<EmployeeDocument> getEmployeeDocuments(@NonNull Long employeeId) {
        return documentRepository.findByEmployeeId(employeeId);
    }

    public List<EmployeeDocument> getDocumentsByType(@NonNull Long employeeId, String documentType) {
        return documentRepository.findByEmployeeIdAndDocumentType(employeeId, documentType);
    }

    public EmployeeDocument getDocumentById(@NonNull Long id) {
=======
    public List<EmployeeDocument> getEmployeeDocuments(Long employeeId) {
        return documentRepository.findByEmployeeId(employeeId);
    }

    public List<EmployeeDocument> getDocumentsByType(Long employeeId, String documentType) {
        return documentRepository.findByEmployeeIdAndDocumentType(employeeId, documentType);
    }

    public EmployeeDocument getDocumentById(Long id) {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        return documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }

<<<<<<< HEAD
    public void deleteDocument(@NonNull Long id) {
=======
    public void deleteDocument(Long id) {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        EmployeeDocument document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        
        fileStorageService.deleteFile(document.getFilePath());
        documentRepository.deleteById(id);
    }

<<<<<<< HEAD
    public EmployeeDocument verifyDocument(@NonNull Long id, Boolean verified) {
=======
    public EmployeeDocument verifyDocument(Long id, Boolean verified) {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        EmployeeDocument document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        document.setVerified(verified);
        return documentRepository.save(document);
    }

<<<<<<< HEAD
    public byte[] downloadDocument(@NonNull Long id) throws IOException {
=======
    public byte[] downloadDocument(Long id) throws IOException {
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
        EmployeeDocument document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        return fileStorageService.loadFile(document.getFilePath());
    }
}
<<<<<<< HEAD
=======

>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
