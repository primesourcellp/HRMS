-- Migration script to add IP address columns to attendance table
-- Run this script if the attendance table already exists
-- Command: mysql -u root -p hrms < add-attendance-ip-address.sql

USE hrms;

-- Add IP address columns to attendance table for laptop/desktop tracking
-- Note: If columns already exist, you'll get an error - that's okay, just ignore it
ALTER TABLE attendance 
ADD COLUMN check_in_ip_address VARCHAR(45) NULL AFTER check_in_location,
ADD COLUMN check_out_ip_address VARCHAR(45) NULL AFTER check_out_location;

-- Note: VARCHAR(45) is sufficient for both IPv4 (max 15 chars) and IPv6 (max 45 chars)
-- These columns will store the IP address captured when employees check in/out from laptops

