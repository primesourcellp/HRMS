-- Migration script to add password column to employees table
-- Run this script if the employees table already exists
-- Command: mysql -u root -p hrms < add-employee-password.sql

USE hrms;

-- Add password column to employees table
-- Note: If column already exists, you'll get an error - that's okay, just ignore it
ALTER TABLE employees 
ADD COLUMN password VARCHAR(255) NULL AFTER shift_id;

-- Note: Existing employees will have NULL passwords
-- Super Admin/Admin should set passwords when creating new employees or updating existing ones
-- Employees with NULL passwords cannot login until a password is set

