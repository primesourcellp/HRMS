package com.hrms.controller;

import com.hrms.entity.EmployeeDocument;
import com.hrms.service.EmployeeDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "http://localhost:3000")
public class EmployeeDocumentController {

    @Autowired
    private EmployeeDocumentService documentService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @RequestParam("employeeId") Long employeeId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "description", required = false) String description) {
        Map<String, Object> response = new HashMap<>();
        try {
            EmployeeDocument document = documentService.uploadDocument(employeeId, file, documentType, description);
            response.put("success", true);
            response.put("message", "Document uploaded successfully");
            response.put("document", document);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<EmployeeDocument>> getEmployeeDocuments(@PathVariable Long employeeId) {
        return ResponseEntity.ok(documentService.getEmployeeDocuments(employeeId));
    }

    @GetMapping("/employee/{employeeId}/type/{documentType}")
    public ResponseEntity<List<EmployeeDocument>> getDocumentsByType(
            @PathVariable Long employeeId, @PathVariable String documentType) {
        return ResponseEntity.ok(documentService.getDocumentsByType(employeeId, documentType));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable Long id) {
        try {
            byte[] fileContent = documentService.downloadDocument(id);
            EmployeeDocument document = documentService.getDocumentById(id);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", document.getFileName());
            
            return ResponseEntity.ok().headers(headers).body(fileContent);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<Map<String, Object>> verifyDocument(
            @PathVariable Long id, @RequestBody Map<String, Boolean> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            EmployeeDocument document = documentService.verifyDocument(id, request.get("verified"));
            response.put("success", true);
            response.put("document", document);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteDocument(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            documentService.deleteDocument(id);
            response.put("success", true);
            response.put("message", "Document deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}

