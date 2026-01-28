package com.hrms.util;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

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
                .setMarginTop(15)
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
        document.add(new Paragraph().setMarginBottom(15));
        
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
            document.add(new Paragraph().setMarginBottom(15));
        }
        
        // Attendance Information section removed as per user request

        // Helper method to format currency with thousand separators
        java.util.function.Function<Object, String> formatCurrency = (value) -> {
            if (value == null) return "0.00";
            try {
                double amount = value instanceof Number ? ((Number) value).doubleValue() : Double.parseDouble(value.toString());
                java.text.DecimalFormat df = new java.text.DecimalFormat("#,##0.00");
                return df.format(amount);
            } catch (Exception e) {
                return "0.00";
            }
        };

        // Earnings
        Table earningsTable = new Table(2).useAllAvailableWidth();
        earningsTable.addCell(createCell("EARNINGS", true));
        earningsTable.addCell(createCell("AMOUNT (₹)", true).setTextAlignment(TextAlignment.RIGHT));
        
        // Basic Salary (always show)
        Double basicSalary = getDoubleValue.apply(payslipData.get("basicSalary"));
        earningsTable.addCell(createCell("Basic Salary", false));
        earningsTable.addCell(createCell("₹" + formatCurrency.apply(basicSalary), false).setTextAlignment(TextAlignment.RIGHT));
        
        // HRA
        Double hra = getDoubleValue.apply(payslipData.get("hra"));
        if (hra > 0) {
            earningsTable.addCell(createCell("HRA (House Rent Allowance)", false));
            earningsTable.addCell(createCell("₹" + formatCurrency.apply(hra), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        // Special Allowance
        Double specialAllowance = getDoubleValue.apply(payslipData.get("specialAllowance"));
        if (specialAllowance > 0) {
            earningsTable.addCell(createCell("Special Allowance", false));
            earningsTable.addCell(createCell("₹" + formatCurrency.apply(specialAllowance), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        // Transport Allowance
        Double transportAllowance = getDoubleValue.apply(payslipData.get("transportAllowance"));
        if (transportAllowance > 0) {
            earningsTable.addCell(createCell("Transport Allowance", false));
            earningsTable.addCell(createCell("₹" + formatCurrency.apply(transportAllowance), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        // Medical Allowance
        Double medicalAllowance = getDoubleValue.apply(payslipData.get("medicalAllowance"));
        if (medicalAllowance > 0) {
            earningsTable.addCell(createCell("Medical Allowance", false));
            earningsTable.addCell(createCell("₹" + formatCurrency.apply(medicalAllowance), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        // Other Allowances
        Double otherAllowances = getDoubleValue.apply(payslipData.get("otherAllowances"));
        if (otherAllowances > 0) {
            earningsTable.addCell(createCell("Other Allowances", false));
            earningsTable.addCell(createCell("₹" + formatCurrency.apply(otherAllowances), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        // Bonus
        Double bonus = getDoubleValue.apply(payslipData.get("bonus"));
        if (bonus > 0) {
            earningsTable.addCell(createCell("Bonus", false));
            earningsTable.addCell(createCell("₹" + formatCurrency.apply(bonus), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        // Gross Salary - Recalculate as sum of all earnings components shown
        // Calculate gross salary as sum of all earnings: Basic + HRA + All Allowances + Bonus
        Double grossSalary = basicSalary + hra + specialAllowance + transportAllowance + medicalAllowance + otherAllowances + bonus;
        earningsTable.addCell(createCell("Gross Salary", true));
        earningsTable.addCell(createCell("₹" + formatCurrency.apply(grossSalary), true).setTextAlignment(TextAlignment.RIGHT));
        document.add(earningsTable);
        document.add(new Paragraph().setMarginBottom(15));

        // Deductions
        Table deductionsTable = new Table(2).useAllAvailableWidth();
        deductionsTable.addCell(createCell("DEDUCTIONS", true));
        deductionsTable.addCell(createCell("AMOUNT (₹)", true).setTextAlignment(TextAlignment.RIGHT));
        
        // PF (Provident Fund)
        Double pf = getDoubleValue.apply(payslipData.get("pf"));
        if (pf > 0) {
            deductionsTable.addCell(createCell("PF (Provident Fund - Employee Share)", false));
            deductionsTable.addCell(createCell("₹" + formatCurrency.apply(pf), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        // ESI (Employee State Insurance)
        Double esi = getDoubleValue.apply(payslipData.get("esi"));
        if (esi > 0) {
            deductionsTable.addCell(createCell("ESI (Employee State Insurance)", false));
            deductionsTable.addCell(createCell("₹" + formatCurrency.apply(esi), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        // Professional Tax
        Double professionalTax = getDoubleValue.apply(payslipData.get("professionalTax"));
        if (professionalTax > 0) {
            deductionsTable.addCell(createCell("Professional Tax", false));
            deductionsTable.addCell(createCell("₹" + formatCurrency.apply(professionalTax), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        // TDS (Tax Deducted at Source)
        Double tds = getDoubleValue.apply(payslipData.get("tds"));
        if (tds > 0) {
            deductionsTable.addCell(createCell("TDS (Tax Deducted at Source)", false));
            deductionsTable.addCell(createCell("₹" + formatCurrency.apply(tds), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        // Other Deductions
        Double otherDeductions = getDoubleValue.apply(payslipData.get("otherDeductions"));
        if (otherDeductions > 0) {
            deductionsTable.addCell(createCell("Other Deductions", false));
            deductionsTable.addCell(createCell("₹" + formatCurrency.apply(otherDeductions), false).setTextAlignment(TextAlignment.RIGHT));
        }
        
        // Total Deductions
        Double totalDeductions = getDoubleValue.apply(payslipData.get("totalDeductions"));
        deductionsTable.addCell(createCell("Total Deductions", true));
        deductionsTable.addCell(createCell("₹" + formatCurrency.apply(totalDeductions), true).setTextAlignment(TextAlignment.RIGHT));
        document.add(deductionsTable);
        document.add(new Paragraph().setMarginBottom(15));

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
        
        // Format net salary with thousand separators
        String netSalaryFormatted = formatCurrency.apply(netSalaryValue != null ? netSalaryValue : 0.0);
        
        Paragraph netSalary = new Paragraph("NET SALARY: ₹" + netSalaryFormatted)
                .setFontSize(16)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20);
        document.add(netSalary);

        // Approved By Section
        document.add(new Paragraph().setMarginTop(30));
        Table approvalTable = new Table(2).useAllAvailableWidth();
        approvalTable.setMarginBottom(20);
        
        Cell approvedByLabel = createStyledValueCell("Approved By:");
        approvedByLabel.setBorder(null);
        Cell approvedByValue = createStyledValueCell("");
        approvedByValue.setBorder(null);
        
        approvalTable.addCell(approvedByLabel);
        approvalTable.addCell(approvedByValue);
        
        Cell signatureLabel = createStyledValueCell("Signature:");
        signatureLabel.setBorder(null);
        Cell signatureValue = createStyledValueCell("");
        signatureValue.setBorder(null);
        
        approvalTable.addCell(signatureLabel);
        approvalTable.addCell(signatureValue);
        
        document.add(approvalTable);

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

        // Helper method to format currency with thousand separators
        java.util.function.Function<Double, String> formatCurrency = (value) -> {
            if (value == null) return "0.00";
            java.text.DecimalFormat df = new java.text.DecimalFormat("#,##0.00");
            return df.format(value);
        };

        // Header Section with enhanced styling
        Paragraph header = new Paragraph("ANNUAL CTC STATEMENT")
                .setFontSize(28)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(15)
                .setMarginBottom(3);
        document.add(header);

        Paragraph subHeader = new Paragraph("Cost to Company")
                .setFontSize(18)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(8);
        document.add(subHeader);

        String employeeName = getStringValue.apply(annualCtcData.get("employeeName"));
        String year = getStringValue.apply(annualCtcData.get("year"));
        Paragraph period = new Paragraph(employeeName + " - " + year)
                .setFontSize(14)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(5);
        document.add(period);

        Paragraph generatedDate = new Paragraph("Generated on: " + LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")))
                .setFontSize(11)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(15);
        document.add(generatedDate);

        // Employee Information Section with enhanced styling
        Table infoTable = new Table(4).useAllAvailableWidth();
        infoTable.setMarginBottom(15);
        
        // Create header cells with blue background
        Cell empNameHeader = createStyledHeaderCell("Employee Name");
        Cell empNameValue = createStyledValueCell(getStringValue.apply(annualCtcData.get("employeeName")));
        Cell empIdHeader = createStyledHeaderCell("Employee ID");
        Cell empIdValue = createStyledValueCell(getStringValue.apply(annualCtcData.get("employeeId")));
        
        infoTable.addCell(empNameHeader);
        infoTable.addCell(empNameValue);
        infoTable.addCell(empIdHeader);
        infoTable.addCell(empIdValue);
        
        Cell deptHeader = createStyledHeaderCell("Department");
        Cell deptValue = createStyledValueCell(getStringValue.apply(annualCtcData.get("department")));
        
        // Set annual period (January 1 to December 31 of the year)
        String yearStr = getStringValue.apply(annualCtcData.get("year"));
        String periodStr = yearStr;
        try {
            int yearInt = Integer.parseInt(yearStr);
            LocalDate annualStart = LocalDate.of(yearInt, 1, 1);
            LocalDate annualEnd = LocalDate.of(yearInt, 12, 31);
            periodStr = annualStart.format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")) + " - " + 
                    annualEnd.format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
        } catch (Exception e) {
            // Use yearStr as is
        }
        
        Cell periodHeader = createStyledHeaderCell("Payroll Period");
        Cell periodValue = createStyledValueCell(periodStr);
        
        infoTable.addCell(deptHeader);
        infoTable.addCell(deptValue);
        infoTable.addCell(periodHeader);
        infoTable.addCell(periodValue);
        
        document.add(infoTable);
        document.add(new Paragraph().setMarginBottom(15));

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

        // Section Header
        Paragraph sectionHeader = new Paragraph("CTC BREAKDOWN")
                .setFontSize(16)
                .setBold()
                .setTextAlignment(TextAlignment.LEFT)
                .setMarginBottom(8);
        document.add(sectionHeader);
        
        Table ctcTable = new Table(3).useAllAvailableWidth();
        ctcTable.setMarginBottom(15);
        
        // Enhanced header cells
        Cell particularsHeader = createStyledHeaderCell("Particulars");
        Cell monthlyHeader = createStyledHeaderCell("Per Month (₹)").setTextAlignment(TextAlignment.RIGHT);
        Cell annualHeader = createStyledHeaderCell("Per Annum (₹)").setTextAlignment(TextAlignment.RIGHT);
        
        ctcTable.addCell(particularsHeader);
        ctcTable.addCell(monthlyHeader);
        ctcTable.addCell(annualHeader);

        // Gross Salary Section with section header
        Cell grossHeader = new Cell(1, 3).add(new Paragraph("GROSS SALARY (A)").setBold().setFontSize(11));
        grossHeader.setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(229, 231, 235));
        grossHeader.setPadding(5);
        ctcTable.addCell(grossHeader);
        
        ctcTable.addCell(createStyledValueCell("  Basic Salary"));
        ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(baseSalary)).setTextAlignment(TextAlignment.RIGHT));
        ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(baseSalary * 12)).setTextAlignment(TextAlignment.RIGHT));
        
        if (hra > 0) {
            ctcTable.addCell(createStyledValueCell("  House Rental Allowance (HRA)"));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(hra)).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(hra * 12)).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (medicalAllowance > 0) {
            ctcTable.addCell(createStyledValueCell("  Medical Allowance"));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(medicalAllowance)).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(medicalAllowance * 12)).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (transportAllowance > 0) {
            ctcTable.addCell(createStyledValueCell("  Travel Allowance"));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(transportAllowance)).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(transportAllowance * 12)).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (specialAllowance > 0) {
            ctcTable.addCell(createStyledValueCell("  Special Allowance"));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(specialAllowance)).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(specialAllowance * 12)).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (otherAllowances > 0) {
            ctcTable.addCell(createStyledValueCell("  Other Allowances"));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(otherAllowances)).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(otherAllowances * 12)).setTextAlignment(TextAlignment.RIGHT));
        }
        
        // Gross Salary Total
        Cell grossTotalLabel = createStyledTotalCell("Total Gross Salary (A)");
        Cell grossTotalMonthly = createStyledTotalCell("₹" + formatCurrency.apply(monthlyGross)).setTextAlignment(TextAlignment.RIGHT);
        Cell grossTotalAnnual = createStyledTotalCell("₹" + formatCurrency.apply(monthlyGross * 12)).setTextAlignment(TextAlignment.RIGHT);
        ctcTable.addCell(grossTotalLabel);
        ctcTable.addCell(grossTotalMonthly);
        ctcTable.addCell(grossTotalAnnual);

        // Employee Deductions Section
        Cell deductionsHeader = new Cell(1, 3).add(new Paragraph("EMPLOYEE DEDUCTIONS (C)").setBold().setFontSize(11));
        deductionsHeader.setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(229, 231, 235));
        deductionsHeader.setPadding(5);
        ctcTable.addCell(deductionsHeader);
        
        if (pfEmployee > 0) {
            ctcTable.addCell(createStyledValueCell("  PF (Employee Contribution)"));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(pfEmployee)).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(pfEmployee * 12)).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (esiEmployee > 0) {
            ctcTable.addCell(createStyledValueCell("  ESI (Employee Contribution)"));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(esiEmployee)).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(esiEmployee * 12)).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (professionalTax > 0) {
            ctcTable.addCell(createStyledValueCell("  Professional Tax"));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(professionalTax)).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(professionalTax * 12)).setTextAlignment(TextAlignment.RIGHT));
        }
        
        Double totalMonthlyDeductions = pfEmployee + esiEmployee + professionalTax;
        Double totalAnnualDeductions = totalMonthlyDeductions * 12;
        
        Cell deductionsTotalLabel = createStyledTotalCell("Total Employee Deductions (C)");
        Cell deductionsTotalMonthly = createStyledTotalCell("₹" + formatCurrency.apply(totalMonthlyDeductions)).setTextAlignment(TextAlignment.RIGHT);
        Cell deductionsTotalAnnual = createStyledTotalCell("₹" + formatCurrency.apply(totalAnnualDeductions)).setTextAlignment(TextAlignment.RIGHT);
        ctcTable.addCell(deductionsTotalLabel);
        ctcTable.addCell(deductionsTotalMonthly);
        ctcTable.addCell(deductionsTotalAnnual);

        // Employer Contribution Section
        Cell employerHeader = new Cell(1, 3).add(new Paragraph("EMPLOYER CONTRIBUTION (B)").setBold().setFontSize(11));
        employerHeader.setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(229, 231, 235));
        employerHeader.setPadding(5);
        ctcTable.addCell(employerHeader);
        
        if (pfEmployer > 0) {
            ctcTable.addCell(createStyledValueCell("  PF (Employer)"));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(pfEmployer)).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(pfEmployer * 12)).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (esiEmployer > 0) {
            ctcTable.addCell(createStyledValueCell("  ESI (Employer)"));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(esiEmployer)).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(esiEmployer * 12)).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (bonus > 0) {
            ctcTable.addCell(createStyledValueCell("  Bonus"));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(bonus / 12)).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(bonus)).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (monthlyGratuity > 0) {
            ctcTable.addCell(createStyledValueCell("  Gratuity"));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(monthlyGratuity)).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(monthlyGratuity * 12)).setTextAlignment(TextAlignment.RIGHT));
        }
        
        if (monthlyLTA > 0) {
            ctcTable.addCell(createStyledValueCell("  LTA (Leave Travel Allowance)"));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(monthlyLTA)).setTextAlignment(TextAlignment.RIGHT));
            ctcTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(monthlyLTA * 12)).setTextAlignment(TextAlignment.RIGHT));
        }
        
        Cell employerTotalLabel = createStyledTotalCell("Total Employer Contribution (B)");
        Cell employerTotalMonthly = createStyledTotalCell("₹" + formatCurrency.apply(monthlyEmployerContribution)).setTextAlignment(TextAlignment.RIGHT);
        Cell employerTotalAnnual = createStyledTotalCell("₹" + formatCurrency.apply(monthlyEmployerContribution * 12)).setTextAlignment(TextAlignment.RIGHT);
        ctcTable.addCell(employerTotalLabel);
        ctcTable.addCell(employerTotalMonthly);
        ctcTable.addCell(employerTotalAnnual);

        // CTC Total - Highlighted
        Cell ctcTotalLabel = createStyledHighlightCell("TOTAL CTC (A+B)");
        Cell ctcTotalMonthly = createStyledHighlightCell("₹" + formatCurrency.apply(monthlyCTC)).setTextAlignment(TextAlignment.RIGHT);
        Cell ctcTotalAnnual = createStyledHighlightCell("₹" + formatCurrency.apply(annualCTC)).setTextAlignment(TextAlignment.RIGHT);
        ctcTable.addCell(ctcTotalLabel);
        ctcTable.addCell(ctcTotalMonthly);
        ctcTable.addCell(ctcTotalAnnual);

        document.add(ctcTable);
        document.add(new Paragraph().setMarginBottom(15));

        // CTC Summary Section
        Paragraph summarySectionHeader = new Paragraph("CTC SUMMARY")
                .setFontSize(16)
                .setBold()
                .setTextAlignment(TextAlignment.LEFT)
                .setMarginTop(15)
                .setMarginBottom(8);
        document.add(summarySectionHeader);
        
        Table summaryTable = new Table(2).useAllAvailableWidth();
        summaryTable.setMarginBottom(15);
        
        Cell summaryHeader = createStyledHeaderCell("Description");
        Cell summaryAmountHeader = createStyledHeaderCell("Amount (₹)").setTextAlignment(TextAlignment.RIGHT);
        summaryTable.addCell(summaryHeader);
        summaryTable.addCell(summaryAmountHeader);
        
        summaryTable.addCell(createStyledValueCell("Annual Gross Salary"));
        summaryTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(monthlyGross * 12)).setTextAlignment(TextAlignment.RIGHT));
        
        summaryTable.addCell(createStyledValueCell("Less: Employee Deductions"));
        summaryTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(totalAnnualDeductions)).setTextAlignment(TextAlignment.RIGHT));
        
        Double annualNetSalary = (monthlyGross * 12) - totalAnnualDeductions;
        summaryTable.addCell(createStyledTotalCell("Annual Net Salary (Take Home)"));
        summaryTable.addCell(createStyledTotalCell("₹" + formatCurrency.apply(annualNetSalary)).setTextAlignment(TextAlignment.RIGHT));
        
        summaryTable.addCell(createStyledValueCell("Add: Employer Contributions"));
        summaryTable.addCell(createStyledValueCell("₹" + formatCurrency.apply(monthlyEmployerContribution * 12)).setTextAlignment(TextAlignment.RIGHT));
        
        summaryTable.addCell(createStyledHighlightCell("ANNUAL CTC (COST TO COMPANY)"));
        summaryTable.addCell(createStyledHighlightCell("₹" + formatCurrency.apply(annualCTC)).setTextAlignment(TextAlignment.RIGHT));
        
        document.add(summaryTable);
        document.add(new Paragraph().setMarginBottom(15));

        // Annual CTC Highlight Box
        Paragraph annualCtcHighlight = new Paragraph("ANNUAL CTC (COST TO COMPANY): ₹" + formatCurrency.apply(annualCTC))
                .setFontSize(20)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(15)
                .setMarginBottom(15);
        document.add(annualCtcHighlight);

        // Approved By Section
        document.add(new Paragraph().setMarginTop(30));
        Table approvalTable = new Table(2).useAllAvailableWidth();
        approvalTable.setMarginBottom(20);
        
        Cell approvedByLabel = createStyledValueCell("Approved By:");
        approvedByLabel.setBorder(null);
        Cell approvedByValue = createStyledValueCell("");
        approvedByValue.setBorder(null);
        
        approvalTable.addCell(approvedByLabel);
        approvalTable.addCell(approvedByValue);
        
        Cell signatureLabel = createStyledValueCell("Signature:");
        signatureLabel.setBorder(null);
        Cell signatureValue = createStyledValueCell("");
        signatureValue.setBorder(null);
        
        approvalTable.addCell(signatureLabel);
        approvalTable.addCell(signatureValue);
        
        document.add(approvalTable);

        // Footer
        Paragraph footer = new Paragraph("This is a system-generated document. For any discrepancies, please contact HR.")
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20)
                .setMarginBottom(20);
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
        cell.setPadding(8); // Add padding to all cells
        if (isHeader) {
            cell.setBackgroundColor(ColorConstants.LIGHT_GRAY);
            cell.setBold();
            cell.setPadding(10); // Slightly more padding for headers
        }
        return cell;
    }
    
    // Enhanced cell creation methods for Annual CTC
    private Cell createStyledHeaderCell(String text) {
        Cell cell = new Cell().add(new Paragraph(text).setBold().setFontSize(11));
        cell.setBackgroundColor(ColorConstants.LIGHT_GRAY);
        cell.setPadding(8);
        return cell;
    }
    
    private Cell createStyledValueCell(String text) {
        Cell cell = new Cell().add(new Paragraph(text).setFontSize(10));
        cell.setPadding(6);
        cell.setBackgroundColor(com.itextpdf.kernel.colors.ColorConstants.WHITE);
        return cell;
    }
    
    private Cell createStyledTotalCell(String text) {
        Cell cell = new Cell().add(new Paragraph(text).setBold().setFontSize(10));
        cell.setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(243, 244, 246)); // Very light gray
        cell.setPadding(6);
        return cell;
    }
    
    private Cell createStyledHighlightCell(String text) {
        Cell cell = new Cell().add(new Paragraph(text).setBold().setFontSize(11));
        cell.setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(243, 244, 246)); // Very light gray
        cell.setPadding(6);
        return cell;
    }
}

