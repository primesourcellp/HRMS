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

        // Employee Info
        Table infoTable = new Table(2).useAllAvailableWidth();
        infoTable.addCell(createCell("Employee Name: " + payslipData.get("employeeName"), false));
        infoTable.addCell(createCell("Employee ID: " + payslipData.get("employeeId"), false));
        infoTable.addCell(createCell("Department: " + payslipData.get("department"), false));
        infoTable.addCell(createCell("Designation: " + payslipData.get("designation"), false));
        infoTable.addCell(createCell("Pay Period: " + payslipData.get("payPeriod"), false));
        infoTable.addCell(createCell("Pay Date: " + payslipData.get("payDate"), false));
        document.add(infoTable);
        document.add(new Paragraph("\n"));

        // Earnings
        Table earningsTable = new Table(2).useAllAvailableWidth();
        earningsTable.addCell(createCell("EARNINGS", true));
        earningsTable.addCell(createCell("AMOUNT", true));
        earningsTable.addCell(createCell("Basic Salary", false));
        earningsTable.addCell(createCell(String.valueOf(payslipData.get("basicSalary")), false));
        if (payslipData.get("hra") != null) {
            earningsTable.addCell(createCell("HRA", false));
            earningsTable.addCell(createCell(String.valueOf(payslipData.get("hra")), false));
        }
        if (payslipData.get("allowances") != null) {
            earningsTable.addCell(createCell("Allowances", false));
            earningsTable.addCell(createCell(String.valueOf(payslipData.get("allowances")), false));
        }
        earningsTable.addCell(createCell("Gross Salary", true));
        earningsTable.addCell(createCell(String.valueOf(payslipData.get("grossSalary")), true));
        document.add(earningsTable);
        document.add(new Paragraph("\n"));

        // Deductions
        Table deductionsTable = new Table(2).useAllAvailableWidth();
        deductionsTable.addCell(createCell("DEDUCTIONS", true));
        deductionsTable.addCell(createCell("AMOUNT", true));
        if (payslipData.get("pf") != null) {
            deductionsTable.addCell(createCell("PF", false));
            deductionsTable.addCell(createCell(String.valueOf(payslipData.get("pf")), false));
        }
        if (payslipData.get("esi") != null) {
            deductionsTable.addCell(createCell("ESI", false));
            deductionsTable.addCell(createCell(String.valueOf(payslipData.get("esi")), false));
        }
        if (payslipData.get("tds") != null) {
            deductionsTable.addCell(createCell("TDS", false));
            deductionsTable.addCell(createCell(String.valueOf(payslipData.get("tds")), false));
        }
        deductionsTable.addCell(createCell("Total Deductions", true));
        deductionsTable.addCell(createCell(String.valueOf(payslipData.get("totalDeductions")), true));
        document.add(deductionsTable);
        document.add(new Paragraph("\n"));

        // Net Salary
        Paragraph netSalary = new Paragraph("NET SALARY: " + payslipData.get("netSalary"))
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

