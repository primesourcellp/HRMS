# Authentication & Authorization System

## Overview

The HRMS system implements a role-based access control (RBAC) system with two user roles:

### User Roles

1. **SUPER_ADMIN**
   - Can create Admin and Employee
   - Can manage all users (create, update, delete)
   - Has complete access to all modules
   - Only ONE Super Admin allowed in the system
   - Cannot be deleted

2. **ADMIN**
   - Can only create Employee
   - Cannot create another Admin or Super Admin
   - Has access to all HRMS modules (Employees, Attendance, Leave, Payroll, Performance)
   - Cannot access User Management

## Default Credentials

On first application startup, a default SUPER_ADMIN is automatically created:

- **Email:** superadmin@hrms.com
- **Password:** superadmin123

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/check?email={email}` - Check authentication status

### User Management (Super Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users?role={role}` - Get users by role
- `POST /api/users` - Create new user (requires currentUserRole in body)
- `PUT /api/users/{id}` - Update user (requires currentUserRole in body)
- `DELETE /api/users/{id}?currentUserRole={role}` - Delete user

### Employee Management (Super Admin & Admin)
- `GET /api/employees` - Get all employees
- `POST /api/employees?userRole={role}` - Create employee
- `PUT /api/employees/{id}?userRole={role}` - Update employee
- `DELETE /api/employees/{id}?userRole={role}` - Delete employee

## Security Features

1. **Single Super Admin Constraint**
   - System prevents creating multiple Super Admins
   - Super Admin cannot be deleted
   - Super Admin role cannot be changed to Admin

2. **Role-Based Access Control**
   - All create/update/delete operations require user role validation
   - Frontend hides features based on user role
   - Backend validates permissions on every request

3. **Password Management**
   - Passwords are stored in plain text (for demo purposes)
   - In production, use password hashing (BCrypt recommended)

## Frontend Features

- **Login Page**: Authenticates users and stores role in localStorage
- **User Management Page**: Only visible to Super Admin
- **Role-Based UI**: Features hidden/shown based on user role
- **Protected Routes**: All routes require authentication

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password` - User password
- `role` - SUPER_ADMIN or ADMIN
- `name` - User full name
- `active` - Account status (true/false)

## Usage

1. **First Login**: Use superadmin@hrms.com / superadmin123
2. **Create Admin**: Super Admin can create Admin users from User Management
3. **Create Employee**: Both Super Admin and Admin can create employees
4. **Manage Users**: Only Super Admin can access User Management page

