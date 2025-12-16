package com.hrms.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;
import java.util.Objects;

import com.hrms.entity.EmployeeDocument;
import com.hrms.service.EmployeeDocumentService;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "http://localhost:3000")
public class EmployeeDocumentController {

    @Autowired
    private EmployeeDocumentService documentService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @RequestParam("employeeId") @NonNull Long employeeId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "description", required = false) String description) {
        Map<String, Object> response = new HashMap<>();
        try {
            EmployeeDocument document = documentService.uploadDocument(Objects.requireNonNull(employeeId), file, documentType, description);
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
    public ResponseEntity<List<EmployeeDocument>> getEmployeeDocuments(@PathVariable @NonNull Long employeeId) {
        return ResponseEntity.ok(documentService.getEmployeeDocuments(Objects.requireNonNull(employeeId)));
    }

    @GetMapping("/employee/{employeeId}/type/{documentType}")
    public ResponseEntity<List<EmployeeDocument>> getDocumentsByType(
            @PathVariable @NonNull Long employeeId, @PathVariable String documentType) {
        return ResponseEntity.ok(documentService.getDocumentsByType(Objects.requireNonNull(employeeId), documentType));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable long id) {
        try {
            EmployeeDocument document = documentService.getDocumentById(Objects.requireNonNull(id));
            if (document == null) {
                System.err.println("Document not found for ID: " + id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            System.out.println("Downloading document ID: " + id + ", File path: " + document.getFilePath());
            byte[] fileContent = documentService.downloadDocument(Objects.requireNonNull(id));
            if (fileContent == null || fileContent.length == 0) {
                System.err.println("File content is empty for document ID: " + id + ", File path: " + document.getFilePath());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            HttpHeaders headers = new HttpHeaders();
            
            // Set proper content type based on file mime type
            String mimeType = document.getMimeType();
            if (mimeType != null && !mimeType.isEmpty()) {
                try {
                    headers.setContentType(MediaType.parseMediaType(mimeType));
                } catch (Exception e) {
                    // Fallback to application/octet-stream if mime type is invalid
                    headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
                }
            } else {
                headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            }
            
            // Handle filename encoding for special characters
            String fileName = document.getFileName();
            String encodedFileName = java.net.URLEncoder.encode(fileName, java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20");
            
            // For PDFs and images, use inline to view in browser; for others, use attachment to download
            String fileNameExtension = fileName.toLowerCase();
            boolean isViewable = fileNameExtension.endsWith(".pdf") || 
                                fileNameExtension.endsWith(".jpg") || 
                                fileNameExtension.endsWith(".jpeg") || 
                                fileNameExtension.endsWith(".png") || 
                                fileNameExtension.endsWith(".gif") || 
                                fileNameExtension.endsWith(".webp");
            
            String disposition = isViewable ? "inline" : "attachment";
            // Set Content-Disposition header only once with proper encoding
            // Escape quotes in filename
            String safeFileName = fileName.replace("\"", "\\\"")
                                         .replace("\n", "")
                                         .replace("\r", "");
            String contentDisposition = disposition + "; filename=\"" + safeFileName + "\"; filename*=UTF-8''" + encodedFileName;
            headers.set("Content-Disposition", contentDisposition);
            
            System.out.println("Successfully prepared document for download: " + fileName + " (" + fileContent.length + " bytes)");
            return ResponseEntity.ok().headers(headers).body(fileContent);
        } catch (java.io.FileNotFoundException | java.nio.file.NoSuchFileException e) {
            System.err.println("File not found for document ID: " + id + " - " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            System.err.println("Error downloading document ID: " + id + " - " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/verify")
    public ResponseEntity<Map<String, Object>> verifyDocument(
            @PathVariable @NonNull Long id, @RequestBody Map<String, Boolean> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            EmployeeDocument document = documentService.verifyDocument(Objects.requireNonNull(id), request.get("verified"));
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
    public ResponseEntity<Map<String, Object>> deleteDocument(@PathVariable long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            documentService.deleteDocument(Objects.requireNonNull(id));
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
