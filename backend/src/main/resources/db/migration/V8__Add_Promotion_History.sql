-- V8__Add_Promotion_History.sql
-- Adds a promotion history table to track employee promotions

CREATE TABLE IF NOT EXISTS promotion_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  employee_id BIGINT NOT NULL,
  effective_date DATE,
  from_position VARCHAR(255),
  to_position VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promotion_employee ON promotion_history(employee_id);
