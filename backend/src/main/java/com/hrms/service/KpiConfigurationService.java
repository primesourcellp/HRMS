package com.hrms.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hrms.entity.KpiConfiguration;
import com.hrms.repository.KpiConfigurationRepository;

@Service
public class KpiConfigurationService {

    @Autowired
    private KpiConfigurationRepository kpiRepository;

    public List<KpiConfiguration> getAllKpis() {
        return kpiRepository.findAll();
    }

    public KpiConfiguration getKpiById(Long id) {
        return kpiRepository.findById(id).orElse(null);
    }

    public KpiConfiguration createKpi(KpiConfiguration kpi) {
        return kpiRepository.save(kpi);
    }

    public KpiConfiguration updateKpi(Long id, KpiConfiguration kpi) {
        return kpiRepository.findById(id).map(existing -> {
            existing.setName(kpi.getName());
            existing.setDescription(kpi.getDescription());
            existing.setTarget(kpi.getTarget());
            existing.setWeight(kpi.getWeight());
            existing.setActive(kpi.getActive());
            return kpiRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("KPI not found"));
    }

    public void deleteKpi(Long id) {
        kpiRepository.deleteById(id);
    }
}
