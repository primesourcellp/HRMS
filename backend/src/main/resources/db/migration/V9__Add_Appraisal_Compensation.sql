-- V9__Add_Appraisal_Compensation.sql
-- Adds appraisal-linked compensation records to track recommended/approved compensation changes tied to performance reviews

CREATE TABLE IF NOT EXISTS appraisal_compensation (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  performance_id BIGINT,
  employee_id BIGINT NOT NULL,
  recommended_percentage DOUBLE,
  recommended_amount DOUBLE,
  status VARCHAR(50) DEFAULT 'PENDING',
  approved_by BIGINT,
  effective_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comp_perf ON appraisal_compensation(performance_id);
CREATE INDEX idx_comp_emp ON appraisal_compensation(employee_id);
