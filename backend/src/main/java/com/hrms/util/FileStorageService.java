package com.hrms.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.document-dir}")
    private String documentDir;

    @Value("${file.payslip-dir}")
    private String payslipDir;

    @Value("${file.offer-letter-dir}")
    private String offerLetterDir;

    public String storeFile(MultipartFile file, String subDirectory) throws IOException {
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get(uploadDir, subDirectory);
        
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        return subDirectory + "/" + fileName;
    }

    public String storeDocument(MultipartFile file) throws IOException {
        return storeFile(file, "documents");
    }

    public String storePayslip(MultipartFile file) throws IOException {
        return storeFile(file, "payslips");
    }

    public String storeOfferLetter(MultipartFile file) throws IOException {
        return storeFile(file, "offer-letters");
    }

    public byte[] loadFile(String filePath) throws IOException {
        Path path = Paths.get(uploadDir, filePath);
        return Files.readAllBytes(path);
    }

    public boolean deleteFile(String filePath) {
        try {
            Path path = Paths.get(uploadDir, filePath);
            return Files.deleteIfExists(path);
        } catch (IOException e) {
            return false;
        }
    }
}

