-- Add performance review cycles table and connect to performance

CREATE TABLE IF NOT EXISTS review_cycle (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE review_cycle IS 'Defines performance review cycles (quarterly, annual, etc.)';
COMMENT ON COLUMN review_cycle.start_date IS 'Start date of the review cycle';
COMMENT ON COLUMN review_cycle.end_date IS 'End date of the review cycle';

-- Add reference to performance table
ALTER TABLE performance
ADD COLUMN IF NOT EXISTS review_cycle_id BIGINT;

COMMENT ON COLUMN performance.review_cycle_id IS 'Reference to an optional review_cycle';

CREATE INDEX IF NOT EXISTS idx_performance_review_cycle_id ON performance(review_cycle_id);
