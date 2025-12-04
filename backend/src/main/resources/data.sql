-- HRMS Database Initialization Script
-- This script creates sample data for testing
-- Note: Users are created automatically by DataInitializer on first run

-- Insert sample employees (optional - can be added through UI)
INSERT IGNORE INTO employees (name, email, phone, department, position, salary, join_date, status, avatar) VALUES
('John Doe', 'john.doe@company.com', '+1 234-567-8900', 'Engineering', 'Senior Developer', 95000.00, '2022-01-15', 'Active', 'JD'),
('Jane Smith', 'jane.smith@company.com', '+1 234-567-8901', 'HR', 'HR Manager', 85000.00, '2021-06-20', 'Active', 'JS'),
('Mike Johnson', 'mike.johnson@company.com', '+1 234-567-8902', 'Sales', 'Sales Manager', 80000.00, '2023-03-10', 'Active', 'MJ'),
('Sarah Williams', 'sarah.williams@company.com', '+1 234-567-8903', 'Marketing', 'Marketing Director', 90000.00, '2022-08-05', 'Active', 'SW'),
('David Brown', 'david.brown@company.com', '+1 234-567-8904', 'Finance', 'Finance Manager', 88000.00, '2021-11-12', 'Active', 'DB');

