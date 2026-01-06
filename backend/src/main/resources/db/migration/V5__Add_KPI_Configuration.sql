-- Add KPI configuration table and KPI fields to performance table

CREATE TABLE IF NOT EXISTS kpi_configuration (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target VARCHAR(100),
    weight INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE kpi_configuration IS 'Stores KPI templates/configuration used in performance reviews';
COMMENT ON COLUMN kpi_configuration.target IS 'Target value or expression for the KPI (e.g., 100 sales, 99% uptime)';

-- Add KPI columns to performance
ALTER TABLE performance
ADD COLUMN IF NOT EXISTS kpi_config_id BIGINT,
ADD COLUMN IF NOT EXISTS kpi_results TEXT;

COMMENT ON COLUMN performance.kpi_config_id IS 'Optional reference to a KPI configuration used for this review';
COMMENT ON COLUMN performance.kpi_results IS 'JSON or line-delimited KPI results recorded for the review';

-- Index for kpi_config_id lookup
CREATE INDEX IF NOT EXISTS idx_performance_kpi_config_id ON performance(kpi_config_id);
