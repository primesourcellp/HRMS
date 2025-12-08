-- Add new columns to payrolls table if they don't exist
-- Run this SQL script in your MySQL database

ALTER TABLE payrolls 
ADD COLUMN IF NOT EXISTS start_date DATE NULL,
ADD COLUMN IF NOT EXISTS end_date DATE NULL;

-- Update existing records to have default values if needed
UPDATE payrolls 
SET start_date = STR_TO_DATE(CONCAT(year, '-', 
    CASE month 
        WHEN '01' THEN '01'
        WHEN '02' THEN '02'
        WHEN '03' THEN '03'
        WHEN '04' THEN '04'
        WHEN '05' THEN '05'
        WHEN '06' THEN '06'
        WHEN '07' THEN '07'
        WHEN '08' THEN '08'
        WHEN '09' THEN '09'
        WHEN '10' THEN '10'
        WHEN '11' THEN '11'
        WHEN '12' THEN '12'
        ELSE '01'
    END, '-01'), '%Y-%m-%d'),
    end_date = LAST_DAY(STR_TO_DATE(CONCAT(year, '-', 
    CASE month 
        WHEN '01' THEN '01'
        WHEN '02' THEN '02'
        WHEN '03' THEN '03'
        WHEN '04' THEN '04'
        WHEN '05' THEN '05'
        WHEN '06' THEN '06'
        WHEN '07' THEN '07'
        WHEN '08' THEN '08'
        WHEN '09' THEN '09'
        WHEN '10' THEN '10'
        WHEN '11' THEN '11'
        WHEN '12' THEN '12'
        ELSE '01'
    END, '-01'), '%Y-%m-%d'))
WHERE start_date IS NULL OR end_date IS NULL;

