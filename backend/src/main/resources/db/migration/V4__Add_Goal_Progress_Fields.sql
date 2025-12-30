-- Add goal progress tracking fields to performance table
ALTER TABLE performance 
ADD COLUMN goal_progress TEXT,
ADD COLUMN overall_progress INT DEFAULT 0;

-- Add comments to describe the new columns
ALTER TABLE performance 
COMMENT ON COLUMN goal_progress IS 'JSON field storing individual goal progress with completion percentages',
COMMENT ON COLUMN overall_progress IS 'Overall goal completion percentage (0-100)';

-- Create index for better query performance on goal progress
CREATE INDEX idx_performance_goal_progress ON performance(employee_id, overall_progress);

-- Update existing records to calculate overall progress based on goals
UPDATE performance 
SET overall_progress = CASE 
    WHEN goals IS NULL OR goals = '' THEN 0
    WHEN goals LIKE '%100%' THEN 100
    WHEN goals LIKE '%75%' THEN 75
    WHEN goals LIKE '%50%' THEN 50
    WHEN goals LIKE '%25%' THEN 25
    ELSE 0
END;
