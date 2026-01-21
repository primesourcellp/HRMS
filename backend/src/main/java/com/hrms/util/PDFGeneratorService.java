package com.hrms.util;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;

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
        
        // Attendance Information section removed as per user request

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
        
        // Gross Salary - Recalculate as sum of all earnings components shown
        // Calculate gross salary as sum of all earnings: Basic + HRA + All Allowances + Bonus
        Double grossSalary = basicSalary + hra + specialAllowance + transportAllowance + medicalAllowance + otherAllowances + bonus;
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

        // Net Salary - Calculate if not provided: Gross Salary (includes bonus) - Total Deductions
        Object netSalaryObj = payslipData.get("netSalary");
        Double netSalaryValue = null;
        
        if (netSalaryObj != null) {
            if (netSalaryObj instanceof Number) {
                netSalaryValue = ((Number) netSalaryObj).doubleValue();
            } else {
                try {
                    netSalaryValue = Double.parseDouble(netSalaryObj.toString());
                } catch (NumberFormatException e) {
                    // If parsing fails, calculate from gross salary (includes bonus) and deductions
                    Object deductionsObj = payslipData.get("totalDeductions");
                    Double deductions = deductionsObj != null ? Double.parseDouble(deductionsObj.toString()) : 0.0;
                    // Use the calculated gross salary which already includes bonus
                    netSalaryValue = grossSalary - deductions;
                }
            }
        } else {
            // Calculate net salary if not provided: Gross Salary (includes bonus) - Total Deductions
            Object deductionsObj = payslipData.get("totalDeductions");
            Double deductions = deductionsObj != null ? Double.parseDouble(deductionsObj.toString()) : 0.0;
            // Use the calculated gross salary which already includes bonus
            netSalaryValue = grossSalary - deductions;
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

    public byte[] generateAnnualCTC(Map<String, Object> annualCtcData) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        // Helper methods
        java.util.function.Function<Object, String> getStringValue = (value) -> {
            if (value == null) return "N/A";
            String str = value.toString();
            return str.isEmpty() || str.equals("null") ? "N/A" : str;
        };
        
        java.util.function.Function<Object, Double> getDoubleValue = (value) -> {
            if (value == null) return 0.0;
            try {
                return value instanceof Number ? ((Number) value).doubleValue() : Double.parseDouble(value.toString());
            } catch (Exception e) {
                return 0.0;
            }
        };

        java.util.function.Function<Double, String> formatCurrency = (value) -> {
            return String.format("%.2f", value);
        };

        // Header
        Paragraph header = new Paragraph("ANNUAL CTC STATEMENT")
                .setFontSize(24)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10);
        document.add(header);

        Paragraph subHeader = new Paragraph("Cost to Company")
                .setFontSize(16)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(5);
        document.add(subHeader);

        String employeeName = getStringValue.apply(annualCtcData.get("employeeName"));
        String year = getStringValue.apply(annualCtcData.get("year"));
        Paragraph period = new Paragraph(employeeName + " - " + year)
                .setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(5);
        document.add(period);

        Paragraph generatedDate = new Paragraph("Generated on: " + LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")))
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(generatedDate);

        // Employee Information
        Table infoTable = new Table(4).useAllAvailableWidth();
        infoTable.addCell(createCell("Employee Name", true));
        infoTable.addCell(createCell(getStringValue.apply(annualCtcData.get("employeeName")), false));
        infoTable.addCell(createCell("Employee ID", true));
        infoTable.addCell(createCell(getStringValue.apply(annualCtcData.get("employeeId")), false));
        infoTable.addCell(createCell("Department", true));
        infoTable.addCell(createCell(getStringValue.apply(annualCtcData.get("department")), false));
        
        // Set annual period (January 1 to December 31 of the year)
        String yearStr = getStringValue.apply(annualCtcData.get("year"));
        try {
            int yearInt = Integer.parseInt(yearStr);
            LocalDate annualStart = LocalDate.of(yearInt, 1, 1);
            LocalDate annualEnd = LocalDate.of(yearInt, 12, 31);
            infoTable.addCell(createCell("Payroll Period", true));
            infoTable.addCell(createCell(annualStart.format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")) + " - " + 
                    annualEnd.format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")), false));
        } catch (Exception e) {
            infoTable.addCell(createCell("Payroll Period", true));
            infoTable.addCell(createCell(yearStr, false));
        }
        document.add(infoTable);
        document.add(new Paragraph("\n"));

        // Annual CTC Summary Table
        Double baseSalary = getDoubleValue.apply(annualCtcData.get("baseSalary"));
        Double hra = getDoubleValue.apply(annualCtcData.get("hra"));
        Double medicalAllowance = getDoubleValue.apply(annualCtcData.get("medicalAllowance"));
        Double transportAllowance = getDoubleValue.apply(annualCtcData.get("transportAllowance"));
        Double specialAllowance = getDoubleValue.apply(annualCtcData.get("specialAllowance"));
        Double otherAllowances = getDoubleValue.apply(annualCtcData.get("otherAllowances"));
        Double bonus = getDoubleValue.apply(annualCtcData.get("bonus"));
        Double pfEmployee = getDoubleValue.apply(annualCtcData.get("pfEmployee"));
        Double esiEmployee = getDoubleValue.apply(annualCtcData.get("esiEmployee"));
        Double pfEmployer = getDoubleValue.apply(annualCtcData.get("pfEmployer"));
        Double esiEmployer = getDoubleValue.apply(annualCtcData.get("esiEmployer"));
        Double monthlyGratuity = getDoubleValue.apply(annualCtcData.get("monthlyGratuity"));
        Double monthlyLTA = getDoubleValue.apply(annualCtcData.get("monthlyLTA"));
        Double professionalTax = getDoubleValue.apply(annualCtcData.get("professionalTax"));
        Double monthlyGross = getDoubleValue.apply(annualCtcData.get("monthlyGross"));
        Double monthlyEmployerContribution = getDoubleValue.apply(annualCtcData.get("monthlyEmployerContribution"));
        Double monthlyCTC = getDoubleValue.apply(annualCtcData.get("monthlyCTC"));
        Double annualCTC = getDoubleValue.apply(annualCtcData.get("annualCTC"));

        Table ctcTable = new Table(3).useAllAvailableWidth();
        ctcTable.addCell(createCell("Particulars", true));
        ctcTable.addCell(createCell("Per Month (₹)", true).setTextAlignment(TextAlignment.RIGHT));
        ctcTable.addCell(createCell("Per Annum (₹)", true).setTextAlignment(TextAlignment.RIGHT));

        // Gross Salary Section
        ctcTable.addCell(createCell("Gross Salary (A)", true));
        ctcTable.addCell(createCell("", true));
        ctcTable.addCell(createCell("", true));
        
        ctcTable.addCell(createCell("  Basic Salary", false));
        ctcTable.addCell(createCell("₹" + formatCurrency.apply(baseSalary), false).setTextAlignment(TextAlignment.RIGHT));
        ctcTable.addCell(createCell("₹" + formatCurrency.apply(baseSalary * 12), false).setTextAlignment(TextAlignment.RIGHT));
        
        if (hra > 0) {
            ctcTable.addCell(createCell("  House Rental Allowance (HRA)", false));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(hra), false).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(hra * 12), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (medicalAllowance > 0) {
            ctcTable.addCell(createCell("  Medical Allowance", false));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(medicalAllowance), false).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(medicalAllowance * 12), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (transportAllowance > 0) {
            ctcTable.addCell(createCell("  Travel Allowance", false));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(transportAllowance), false).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(transportAllowance * 12), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (specialAllowance > 0) {
            ctcTable.addCell(createCell("  Special Allowance", false));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(specialAllowance), false).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(specialAllowance * 12), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (otherAllowances > 0) {
            ctcTable.addCell(createCell("  Other Allowances", false));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(otherAllowances), false).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(otherAllowances * 12), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        ctcTable.addCell(createCell("Gross Salary (A)", true));
        ctcTable.addCell(createCell("₹" + formatCurrency.apply(monthlyGross), true).setTextAlignment(TextAlignment.RIGHT));
        ctcTable.addCell(createCell("₹" + formatCurrency.apply(monthlyGross * 12), true).setTextAlignment(TextAlignment.RIGHT));

        // Employer Contribution Section
        ctcTable.addCell(createCell("Employer Contribution (B)", true));
        ctcTable.addCell(createCell("", true));
        ctcTable.addCell(createCell("", true));
        
        if (pfEmployer > 0) {
            ctcTable.addCell(createCell("  PF (Employer)", false));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(pfEmployer), false).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(pfEmployer * 12), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (esiEmployer > 0) {
            ctcTable.addCell(createCell("  ESI (Employer)", false));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(esiEmployer), false).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(esiEmployer * 12), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (bonus > 0) {
            ctcTable.addCell(createCell("  Bonus", false));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(bonus / 12), false).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(bonus), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (monthlyGratuity > 0) {
            ctcTable.addCell(createCell("  Gratuity", false));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(monthlyGratuity), false).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(monthlyGratuity * 12), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (monthlyLTA > 0) {
            ctcTable.addCell(createCell("  LTA (Leave Travel Allowance)", false));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(monthlyLTA), false).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createCell("₹" + formatCurrency.apply(monthlyLTA * 12), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        ctcTable.addCell(createCell("Total Employer Contribution (B)", true));
        ctcTable.addCell(createCell("₹" + formatCurrency.apply(monthlyEmployerContribution), true).setTextAlignment(TextAlignment.RIGHT));
        ctcTable.addCell(createCell("₹" + formatCurrency.apply(monthlyEmployerContribution * 12), true).setTextAlignment(TextAlignment.RIGHT));

        // CTC Total
        ctcTable.addCell(createCell("CTC (A+B)", true));
        ctcTable.addCell(createCell("₹" + formatCurrency.apply(monthlyCTC), true).setTextAlignment(TextAlignment.RIGHT));
        ctcTable.addCell(createCell("₹" + formatCurrency.apply(annualCTC), true).setTextAlignment(TextAlignment.RIGHT));

        document.add(ctcTable);
        document.add(new Paragraph("\n"));

        // Annual CTC Highlight
        Paragraph annualCtcHighlight = new Paragraph("ANNUAL CTC (COST TO COMPANY): ₹" + formatCurrency.apply(annualCTC))
                .setFontSize(18)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20)
                .setMarginBottom(20);
        document.add(annualCtcHighlight);

        // Footer
        Paragraph footer = new Paragraph("This is a system-generated document. For any discrepancies, please contact HR.")
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(30);
        document.add(footer);

        document.close();
        return baos.toByteArray();
    }

    public byte[] generatePFReport(Map<String, Object> reportData) throws IOException {
        return generateComplianceReport(reportData, "PF Report", "Provident Fund");
    }

    public byte[] generateESIReport(Map<String, Object> reportData) throws IOException {
        return generateComplianceReport(reportData, "ESI Report", "Employee State Insurance");
    }

    public byte[] generatePTReport(Map<String, Object> reportData) throws IOException {
        return generateComplianceReport(reportData, "Professional Tax Report", "Professional Tax");
    }

    public byte[] generateTDSReport(Map<String, Object> reportData) throws IOException {
        return generateComplianceReport(reportData, "TDS Report", "Tax Deducted at Source");
    }

    public byte[] generatePayrollRegister(Map<String, Object> registerData) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        java.util.function.Function<Object, String> getStringValue = (value) -> {
            if (value == null) return "N/A";
            String str = value.toString();
            return str.isEmpty() || str.equals("null") ? "N/A" : str;
        };

        java.util.function.Function<Object, Double> getDoubleValue = (value) -> {
            if (value == null) return 0.0;
            try {
                return value instanceof Number ? ((Number) value).doubleValue() : Double.parseDouble(value.toString());
            } catch (Exception e) {
                return 0.0;
            }
        };

        java.util.function.Function<Double, String> formatCurrency = (value) -> {
            return String.format("%.2f", value);
        };

        // Header
        Paragraph header = new Paragraph("PAYROLL REGISTER")
                .setFontSize(24)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10);
        document.add(header);

        Paragraph period = new Paragraph("Period: " + getStringValue.apply(registerData.get("startDate")) + 
                " to " + getStringValue.apply(registerData.get("endDate")))
                .setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(5);
        document.add(period);

        Paragraph generatedDate = new Paragraph("Generated on: " + LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")))
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(generatedDate);

        // Payroll Data Table
        @SuppressWarnings("unchecked")
        java.util.List<java.util.Map<String, Object>> payrollData = 
            (java.util.List<java.util.Map<String, Object>>) registerData.get("payrollData");
        
        if (payrollData != null && !payrollData.isEmpty()) {
            Table table = new Table(9).useAllAvailableWidth();
            table.addCell(createCell("Employee ID", true));
            table.addCell(createCell("Employee Name", true));
            table.addCell(createCell("Department", true));
            table.addCell(createCell("Base Salary", true).setTextAlignment(TextAlignment.RIGHT));
            table.addCell(createCell("Allowances", true).setTextAlignment(TextAlignment.RIGHT));
            table.addCell(createCell("Deductions", true).setTextAlignment(TextAlignment.RIGHT));
            table.addCell(createCell("Bonus", true).setTextAlignment(TextAlignment.RIGHT));
            table.addCell(createCell("Net Salary", true).setTextAlignment(TextAlignment.RIGHT));
            table.addCell(createCell("Status", true));

            for (java.util.Map<String, Object> payData : payrollData) {
                table.addCell(createCell(getStringValue.apply(payData.get("employeeId")), false));
                table.addCell(createCell(getStringValue.apply(payData.get("employeeName")), false));
                table.addCell(createCell(getStringValue.apply(payData.get("department")), false));
                table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(payData.get("baseSalary"))), false).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(payData.get("allowances"))), false).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(payData.get("deductions"))), false).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(payData.get("bonus"))), false).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(payData.get("netSalary"))), false).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell(getStringValue.apply(payData.get("status")), false));
            }

            document.add(table);
        } else {
            // No data message
            Paragraph noData = new Paragraph("No payroll data available for the selected period.")
                    .setFontSize(14)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(40);
            document.add(noData);
        }

        document.close();
        return baos.toByteArray();
    }

    private byte[] generateComplianceReport(java.util.Map<String, Object> reportData, String reportTitle, String reportType) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        java.util.function.Function<Object, String> getStringValue = (value) -> {
            if (value == null) return "N/A";
            String str = value.toString();
            return str.isEmpty() || str.equals("null") ? "N/A" : str;
        };

        java.util.function.Function<Object, Double> getDoubleValue = (value) -> {
            if (value == null) return 0.0;
            try {
                return value instanceof Number ? ((Number) value).doubleValue() : Double.parseDouble(value.toString());
            } catch (Exception e) {
                return 0.0;
            }
        };

        java.util.function.Function<Double, String> formatCurrency = (value) -> {
            return String.format("%.2f", value);
        };

        // Header
        Paragraph header = new Paragraph(reportTitle.toUpperCase())
                .setFontSize(24)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10);
        document.add(header);

        Paragraph period = new Paragraph("Period: " + getStringValue.apply(reportData.get("startDate")) + 
                " to " + getStringValue.apply(reportData.get("endDate")))
                .setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(5);
        document.add(period);

        Paragraph generatedDate = new Paragraph("Generated on: " + LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")))
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(generatedDate);

        // Employee Data Table
        @SuppressWarnings("unchecked")
        java.util.List<java.util.Map<String, Object>> employeeData = 
            (java.util.List<java.util.Map<String, Object>>) reportData.get("employeeData");
        
        if (employeeData != null && !employeeData.isEmpty()) {
            Table table = new Table(5).useAllAvailableWidth();
            
            if (reportType.equals("Provident Fund")) {
                table.addCell(createCell("Employee ID", true));
                table.addCell(createCell("Employee Name", true));
                table.addCell(createCell("Employee PF", true).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("Employer PF", true).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("Total PF", true).setTextAlignment(TextAlignment.RIGHT));

                for (java.util.Map<String, Object> empData : employeeData) {
                    table.addCell(createCell(getStringValue.apply(empData.get("employeeId")), false));
                    table.addCell(createCell(getStringValue.apply(empData.get("employeeName")), false));
                    table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(empData.get("pfEmployee"))), false).setTextAlignment(TextAlignment.RIGHT));
                    table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(empData.get("pfEmployer"))), false).setTextAlignment(TextAlignment.RIGHT));
                    table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(empData.get("pfTotal"))), false).setTextAlignment(TextAlignment.RIGHT));
                }

                // Totals
                table.addCell(createCell("TOTAL", true));
                table.addCell(createCell("", true));
                table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(reportData.get("totalEmployeePF"))), true).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(reportData.get("totalEmployerPF"))), true).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(reportData.get("totalPF"))), true).setTextAlignment(TextAlignment.RIGHT));
            } else if (reportType.equals("Employee State Insurance")) {
                table.addCell(createCell("Employee ID", true));
                table.addCell(createCell("Employee Name", true));
                table.addCell(createCell("Employee ESI", true).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("Employer ESI", true).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("Total ESI", true).setTextAlignment(TextAlignment.RIGHT));

                for (java.util.Map<String, Object> empData : employeeData) {
                    table.addCell(createCell(getStringValue.apply(empData.get("employeeId")), false));
                    table.addCell(createCell(getStringValue.apply(empData.get("employeeName")), false));
                    table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(empData.get("esiEmployee"))), false).setTextAlignment(TextAlignment.RIGHT));
                    table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(empData.get("esiEmployer"))), false).setTextAlignment(TextAlignment.RIGHT));
                    table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(empData.get("esiTotal"))), false).setTextAlignment(TextAlignment.RIGHT));
                }

                // Totals
                table.addCell(createCell("TOTAL", true));
                table.addCell(createCell("", true));
                table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(reportData.get("totalEmployeeESI"))), true).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(reportData.get("totalEmployerESI"))), true).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(reportData.get("totalESI"))), true).setTextAlignment(TextAlignment.RIGHT));
            } else if (reportType.equals("Professional Tax")) {
                table.addCell(createCell("Employee ID", true));
                table.addCell(createCell("Employee Name", true));
                table.addCell(createCell("Professional Tax", true).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("Month", true));
                table.addCell(createCell("Year", true));

                for (java.util.Map<String, Object> empData : employeeData) {
                    table.addCell(createCell(getStringValue.apply(empData.get("employeeId")), false));
                    table.addCell(createCell(getStringValue.apply(empData.get("employeeName")), false));
                    table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(empData.get("professionalTax"))), false).setTextAlignment(TextAlignment.RIGHT));
                    table.addCell(createCell(getStringValue.apply(empData.get("month")), false));
                    table.addCell(createCell(getStringValue.apply(empData.get("year")), false));
                }

                // Totals
                table.addCell(createCell("TOTAL", true));
                table.addCell(createCell("", true));
                table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(reportData.get("totalPT"))), true).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("", true));
                table.addCell(createCell("", true));
            } else if (reportType.equals("Tax Deducted at Source")) {
                table.addCell(createCell("Employee ID", true));
                table.addCell(createCell("Employee Name", true));
                table.addCell(createCell("PAN", true));
                table.addCell(createCell("TDS", true).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("Month/Year", true));

                for (java.util.Map<String, Object> empData : employeeData) {
                    table.addCell(createCell(getStringValue.apply(empData.get("employeeId")), false));
                    table.addCell(createCell(getStringValue.apply(empData.get("employeeName")), false));
                    table.addCell(createCell(getStringValue.apply(empData.get("pan")), false));
                    table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(empData.get("tds"))), false).setTextAlignment(TextAlignment.RIGHT));
                    table.addCell(createCell(getStringValue.apply(empData.get("month")) + "/" + getStringValue.apply(empData.get("year")), false));
                }

                // Totals
                table.addCell(createCell("TOTAL", true));
                table.addCell(createCell("", true));
                table.addCell(createCell("", true));
                table.addCell(createCell("₹" + formatCurrency.apply(getDoubleValue.apply(reportData.get("totalTDS"))), true).setTextAlignment(TextAlignment.RIGHT));
                table.addCell(createCell("", true));
            }

            document.add(table);
        } else {
            // No data message
            Paragraph noData = new Paragraph("No data available for the selected period.")
                    .setFontSize(14)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(40);
            document.add(noData);
        }

        // Summary
        Paragraph summary = new Paragraph("Total Employees: " + getStringValue.apply(reportData.get("totalEmployees")))
                .setFontSize(12)
                .setMarginTop(20);
        document.add(summary);

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

