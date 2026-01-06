-- Add manager and self-evaluation columns to performance

ALTER TABLE performance
ADD COLUMN IF NOT EXISTS manager_evaluation TEXT,
ADD COLUMN IF NOT EXISTS self_evaluation TEXT;

COMMENT ON COLUMN performance.manager_evaluation IS 'Manager evaluation comments for the review';
COMMENT ON COLUMN performance.self_evaluation IS 'Employee self-evaluation comments for the review';

-- Backfill: set empty string for nulls to avoid null handling for older records
UPDATE performance SET manager_evaluation = '' WHERE manager_evaluation IS NULL;
UPDATE performance SET self_evaluation = '' WHERE self_evaluation IS NULL;
