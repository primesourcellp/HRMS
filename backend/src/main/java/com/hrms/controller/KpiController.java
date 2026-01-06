package com.hrms.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import com.hrms.entity.KpiConfiguration;
import com.hrms.service.KpiConfigurationService;

@RestController
@RequestMapping("/api/kpis")
@CrossOrigin(origins = "http://localhost:3000")
public class KpiController {

    @Autowired
    private KpiConfigurationService kpiService;

    @GetMapping
    public ResponseEntity<List<KpiConfiguration>> getAllKpis() {
        return ResponseEntity.ok(kpiService.getAllKpis());
    }

    @GetMapping("/{id}")
    public ResponseEntity<KpiConfiguration> getKpiById(@PathVariable Long id) {
        KpiConfiguration kpi = kpiService.getKpiById(id);
        if (kpi == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(kpi);
    }

    @PostMapping
    public ResponseEntity<KpiConfiguration> createKpi(@RequestBody KpiConfiguration kpi) {
        return ResponseEntity.status(HttpStatus.CREATED).body(kpiService.createKpi(kpi));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateKpi(@PathVariable Long id, @RequestBody KpiConfiguration kpi) {
        try {
            return ResponseEntity.ok(kpiService.updateKpi(id, kpi));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteKpi(@PathVariable Long id) {
        kpiService.deleteKpi(id);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
