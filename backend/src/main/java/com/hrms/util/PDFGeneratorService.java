package com.hrms.util;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.properties.TextAlignment;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
public class PDFGeneratorService {

    @Value("${file.payslip-dir}")
    private String payslipDir;

    @Value("${file.offer-letter-dir}")
    private String offerLetterDir;

    public byte[] generatePayslip(Map<String, Object> payslipData) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Header
        Paragraph header = new Paragraph("PAYSLIP")
                .setFontSize(20)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(header);

        // Helper method to safely get string value
        java.util.function.Function<Object, String> getStringValue = (value) -> {
            if (value == null) return "N/A";
            String str = value.toString();
            return str.isEmpty() || str.equals("null") ? "N/A" : str;
        };
        
        // Helper method to check if value is greater than 0
        java.util.function.Function<Object, Double> getDoubleValue = (value) -> {
            if (value == null) return 0.0;
            try {
                return value instanceof Number ? ((Number) value).doubleValue() : Double.parseDouble(value.toString());
            } catch (Exception e) {
                return 0.0;
            }
        };

        // Employee Info
        Table infoTable = new Table(2).useAllAvailableWidth();
        infoTable.addCell(createCell("Employee Name: " + getStringValue.apply(payslipData.get("employeeName")), false));
        infoTable.addCell(createCell("Employee ID: " + getStringValue.apply(payslipData.get("employeeId")), false));
        infoTable.addCell(createCell("Department: " + getStringValue.apply(payslipData.get("department")), false));
        infoTable.addCell(createCell("Designation: " + getStringValue.apply(payslipData.get("designation")), false));
        infoTable.addCell(createCell("Pay Period: " + getStringValue.apply(payslipData.get("payPeriod")), false));
        infoTable.addCell(createCell("Pay Date: " + getStringValue.apply(payslipData.get("payDate")), false));
        document.add(infoTable);
        document.add(new Paragraph("\n"));
        
        // Statutory & Banking Information (if available)
        Object uan = payslipData.get("uan");
        Object pfAccountNumber = payslipData.get("pfAccountNumber");
        Object bankAccountNumber = payslipData.get("bankAccountNumber");
        Object bankName = payslipData.get("bankName");
        Object ifscCode = payslipData.get("ifscCode");
        
        boolean hasAccountInfo = (uan != null && !getStringValue.apply(uan).equals("N/A")) ||
                                 (pfAccountNumber != null && !getStringValue.apply(pfAccountNumber).equals("N/A")) ||
                                 (bankAccountNumber != null && !getStringValue.apply(bankAccountNumber).equals("N/A"));
        
        if (hasAccountInfo) {
            Table accountTable = new Table(2).useAllAvailableWidth();
            accountTable.addCell(createCell("STATUTORY & BANKING INFORMATION", true));
            accountTable.addCell(createCell("", true));
            
            if (uan != null && !getStringValue.apply(uan).equals("N/A")) {
                accountTable.addCell(createCell("UAN Number", false));
                accountTable.addCell(createCell(getStringValue.apply(uan), false));
            }
            if (pfAccountNumber != null && !getStringValue.apply(pfAccountNumber).equals("N/A")) {
                accountTable.addCell(createCell("PF Account Number", false));
                accountTable.addCell(createCell(getStringValue.apply(pfAccountNumber), false));
            }
            if (bankAccountNumber != null && !getStringValue.apply(bankAccountNumber).equals("N/A")) {
                accountTable.addCell(createCell("Bank Account Number", false));
                // Mask bank account (show only last 4 digits)
                String accountStr = getStringValue.apply(bankAccountNumber);
                if (!accountStr.equals("N/A") && accountStr.length() > 4) {
                    accountStr = "****" + accountStr.substring(accountStr.length() - 4);
                } else if (accountStr.equals("N/A")) {
                    accountStr = "N/A";
                } else {
                    accountStr = "****";
                }
                accountTable.addCell(createCell(accountStr, false));
            }
            if (bankName != null && !getStringValue.apply(bankName).equals("N/A")) {
                accountTable.addCell(createCell("Bank Name", false));
                accountTable.addCell(createCell(getStringValue.apply(bankName), false));
            }
            if (ifscCode != null && !getStringValue.apply(ifscCode).equals("N/A")) {
                accountTable.addCell(createCell("IFSC Code", false));
                accountTable.addCell(createCell(getStringValue.apply(ifscCode), false));
            }
            
            document.add(accountTable);
            document.add(new Paragraph("\n"));
        }
        
        // Attendance Information (if available)
        Double workingDays = getDoubleValue.apply(payslipData.get("workingDays"));
        Double presentDays = getDoubleValue.apply(payslipData.get("presentDays"));
        Double leaveDays = getDoubleValue.apply(payslipData.get("leaveDays"));
        Double lopDays = getDoubleValue.apply(payslipData.get("lopDays"));
        
        if (workingDays > 0 || presentDays > 0) {
            Table attendanceTable = new Table(2).useAllAvailableWidth();
            attendanceTable.addCell(createCell("ATTENDANCE INFORMATION", true));
            attendanceTable.addCell(createCell("", true));
            
            if (workingDays > 0) {
                attendanceTable.addCell(createCell("Working Days", false));
                attendanceTable.addCell(createCell(String.format("%.0f days", workingDays), false));
            }
            if (presentDays > 0) {
                attendanceTable.addCell(createCell("Present Days", false));
                attendanceTable.addCell(createCell(String.format("%.0f days", presentDays), false));
            }
            if (leaveDays > 0) {
                attendanceTable.addCell(createCell("Leave Days", false));
                attendanceTable.addCell(createCell(String.format("%.0f days", leaveDays), false));
            }
            if (lopDays > 0) {
                attendanceTable.addCell(createCell("LOP Days", false));
                attendanceTable.addCell(createCell(String.format("%.0f days", lopDays), false));
            }
            
            document.add(attendanceTable);
            document.add(new Paragraph("\n"));
        }

        // Helper method to format currency
        java.util.function.Function<Object, String> formatCurrency = (value) -> {
            if (value == null) return "0.00";
            try {
                double amount = value instanceof Number ? ((Number) value).doubleValue() : Double.parseDouble(value.toString());
                return String.format("%.2f", amount);
            } catch (Exception e) {
                return "0.00";
            }
        };

        // Earnings
        Table earningsTable = new Table(2).useAllAvailableWidth();
        earningsTable.addCell(createCell("EARNINGS", true));
        earningsTable.addCell(createCell("AMOUNT (₹)", true));
        
        // Basic Salary (always show)
        Double basicSalary = getDoubleValue.apply(payslipData.get("basicSalary"));
        earningsTable.addCell(createCell("Basic Salary", false));
        earningsTable.addCell(createCell("₹" + formatCurrency.apply(basicSalary), false));
        
        // HRA
        Double hra = getDoubleValue.apply(payslipData.get("hra"));
        if (hra > 0) {
            earningsTable.addCell(createCell("HRA (House Rent Allowance)", false));
            earningsTable.addCell(createCell("₹" + formatCurrency.apply(hra), false));
        }
        
        // Special Allowance
        Double specialAllowance = getDoubleValue.apply(payslipData.get("specialAllowance"));
        if (specialAllowance > 0) {
            earningsTable.addCell(createCell("Special Allowance", false));
            earningsTable.addCell(createCell("₹" + formatCurrency.apply(specialAllowance), false));
        }
        
        // Transport Allowance
        Double transportAllowance = getDoubleValue.apply(payslipData.get("transportAllowance"));
        if (transportAllowance > 0) {
            earningsTable.addCell(createCell("Transport Allowance", false));
            earningsTable.addCell(createCell("₹" + formatCurrency.apply(transportAllowance), false));
        }
        
        // Medical Allowance
        Double medicalAllowance = getDoubleValue.apply(payslipData.get("medicalAllowance"));
        if (medicalAllowance > 0) {
            earningsTable.addCell(createCell("Medical Allowance", false));
            earningsTable.addCell(createCell("₹" + formatCurrency.apply(medicalAllowance), false));
        }
        
        // Other Allowances
        Double otherAllowances = getDoubleValue.apply(payslipData.get("otherAllowances"));
        if (otherAllowances > 0) {
            earningsTable.addCell(createCell("Other Allowances", false));
            earningsTable.addCell(createCell("₹" + formatCurrency.apply(otherAllowances), false));
        }
        
        // Bonus
        Double bonus = getDoubleValue.apply(payslipData.get("bonus"));
        if (bonus > 0) {
            earningsTable.addCell(createCell("Bonus", false));
            earningsTable.addCell(createCell("₹" + formatCurrency.apply(bonus), false));
        }
        
        // Gross Salary
        Double grossSalary = getDoubleValue.apply(payslipData.get("grossSalary"));
        earningsTable.addCell(createCell("Gross Salary", true));
        earningsTable.addCell(createCell("₹" + formatCurrency.apply(grossSalary), true));
        document.add(earningsTable);
        document.add(new Paragraph("\n"));

        // Deductions
        Table deductionsTable = new Table(2).useAllAvailableWidth();
        deductionsTable.addCell(createCell("DEDUCTIONS", true));
        deductionsTable.addCell(createCell("AMOUNT (₹)", true));
        
        // PF (Provident Fund)
        Double pf = getDoubleValue.apply(payslipData.get("pf"));
        if (pf > 0) {
            deductionsTable.addCell(createCell("PF (Provident Fund - Employee Share)", false));
            deductionsTable.addCell(createCell("₹" + formatCurrency.apply(pf), false));
        }
        
        // ESI (Employee State Insurance)
        Double esi = getDoubleValue.apply(payslipData.get("esi"));
        if (esi > 0) {
            deductionsTable.addCell(createCell("ESI (Employee State Insurance)", false));
            deductionsTable.addCell(createCell("₹" + formatCurrency.apply(esi), false));
        }
        
        // Professional Tax
        Double professionalTax = getDoubleValue.apply(payslipData.get("professionalTax"));
        if (professionalTax > 0) {
            deductionsTable.addCell(createCell("Professional Tax", false));
            deductionsTable.addCell(createCell("₹" + formatCurrency.apply(professionalTax), false));
        }
        
        // TDS (Tax Deducted at Source)
        Double tds = getDoubleValue.apply(payslipData.get("tds"));
        if (tds > 0) {
            deductionsTable.addCell(createCell("TDS (Tax Deducted at Source)", false));
            deductionsTable.addCell(createCell("₹" + formatCurrency.apply(tds), false));
        }
        
        // Other Deductions
        Double otherDeductions = getDoubleValue.apply(payslipData.get("otherDeductions"));
        if (otherDeductions > 0) {
            deductionsTable.addCell(createCell("Other Deductions", false));
            deductionsTable.addCell(createCell("₹" + formatCurrency.apply(otherDeductions), false));
        }
        
        // Total Deductions
        Double totalDeductions = getDoubleValue.apply(payslipData.get("totalDeductions"));
        deductionsTable.addCell(createCell("Total Deductions", true));
        deductionsTable.addCell(createCell("₹" + formatCurrency.apply(totalDeductions), true));
        document.add(deductionsTable);
        document.add(new Paragraph("\n"));

        // Net Salary - Calculate if not provided
        Object netSalaryObj = payslipData.get("netSalary");
        Double netSalaryValue = null;
        
        if (netSalaryObj != null) {
            if (netSalaryObj instanceof Number) {
                netSalaryValue = ((Number) netSalaryObj).doubleValue();
            } else {
                try {
                    netSalaryValue = Double.parseDouble(netSalaryObj.toString());
                } catch (NumberFormatException e) {
                    // If parsing fails, calculate from gross salary and deductions
                    Object grossObj = payslipData.get("grossSalary");
                    Object deductionsObj = payslipData.get("totalDeductions");
                    Double gross = grossObj != null ? Double.parseDouble(grossObj.toString()) : 0.0;
                    Double deductions = deductionsObj != null ? Double.parseDouble(deductionsObj.toString()) : 0.0;
                    netSalaryValue = gross - deductions;
                }
            }
        } else {
            // Calculate net salary if not provided
            Object grossObj = payslipData.get("grossSalary");
            Object deductionsObj = payslipData.get("totalDeductions");
            Double gross = grossObj != null ? Double.parseDouble(grossObj.toString()) : 0.0;
            Double deductions = deductionsObj != null ? Double.parseDouble(deductionsObj.toString()) : 0.0;
            netSalaryValue = gross - deductions;
        }
        
        // Format net salary with 2 decimal places
        String netSalaryFormatted = String.format("%.2f", netSalaryValue != null ? netSalaryValue : 0.0);
        
        Paragraph netSalary = new Paragraph("NET SALARY: ₹" + netSalaryFormatted)
                .setFontSize(16)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20);
        document.add(netSalary);

        document.close();
        return baos.toByteArray();
    }

    public byte[] generateForm16(Map<String, Object> form16Data) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        Paragraph header = new Paragraph("FORM 16")
                .setFontSize(20)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(header);

        Table table = new Table(2).useAllAvailableWidth();
        table.addCell(createCell("Employee Name", true));
        table.addCell(createCell(String.valueOf(form16Data.get("employeeName")), false));
        table.addCell(createCell("PAN", true));
        table.addCell(createCell(String.valueOf(form16Data.get("pan")), false));
        table.addCell(createCell("Assessment Year", true));
        table.addCell(createCell(String.valueOf(form16Data.get("assessmentYear")), false));
        table.addCell(createCell("Total Income", true));
        table.addCell(createCell(String.valueOf(form16Data.get("totalIncome")), false));
        table.addCell(createCell("Tax Deducted", true));
        table.addCell(createCell(String.valueOf(form16Data.get("taxDeducted")), false));

        document.add(table);
        document.close();
        return baos.toByteArray();
    }

    public byte[] generateOfferLetter(Map<String, Object> offerData) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        Paragraph header = new Paragraph("OFFER LETTER")
                .setFontSize(20)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(header);

        Paragraph date = new Paragraph("Date: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMMM yyyy")))
                .setMarginBottom(10);
        document.add(date);

        Paragraph greeting = new Paragraph("Dear " + offerData.get("candidateName") + ",")
                .setMarginBottom(10);
        document.add(greeting);

        Paragraph content = new Paragraph("We are pleased to offer you the position of " + 
                offerData.get("position") + " in our " + offerData.get("department") + 
                " department. Your starting date will be " + offerData.get("joiningDate") + 
                " and your annual salary will be " + offerData.get("salary") + ".")
                .setMarginBottom(10);
        document.add(content);

        Paragraph closing = new Paragraph("We look forward to welcoming you to our team.")
                .setMarginTop(20);
        document.add(closing);

        document.close();
        return baos.toByteArray();
    }

    private Cell createCell(String text, boolean isHeader) {
        Cell cell = new Cell().add(new Paragraph(text));
        if (isHeader) {
            cell.setBackgroundColor(ColorConstants.LIGHT_GRAY);
            cell.setBold();
        }
        return cell;
    }
}

