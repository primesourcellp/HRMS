# HRMS Backend - Spring Boot Application

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+
- IDE (IntelliJ IDEA, Eclipse, or VS Code)

## Database Setup

1. Create MySQL database:
```sql
CREATE DATABASE hrms;
```

2. Update database credentials in `src/main/resources/application.properties` if needed:
   - Username: root
   - Password: root
   - Database: hrms

## Running the Application

### Option 1: Using Maven
```bash
cd backend
mvn spring-boot:run
```

### Option 2: Using IDE
1. Open the project in your IDE
2. Run `HrmsApplication.java` as a Java Application

### Option 3: Build and Run JAR
```bash
cd backend
mvn clean package
java -jar target/hrms-backend-1.0.0.jar
```

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees?search={term}` - Search employees
- `GET /api/employees/{id}` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

### Attendance
- `GET /api/attendance` - Get all attendance records
- `GET /api/attendance/date/{date}` - Get attendance by date
- `GET /api/attendance/employee/{employeeId}` - Get attendance by employee
- `POST /api/attendance/mark` - Mark attendance

### Leaves
- `GET /api/leaves` - Get all leaves
- `GET /api/leaves?status={status}` - Get leaves by status
- `GET /api/leaves/{id}` - Get leave by ID
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/{id}/status` - Update leave status

### Payrolls
- `GET /api/payrolls` - Get all payrolls
- `GET /api/payrolls/{id}` - Get payroll by ID
- `GET /api/payrolls/employee/{employeeId}` - Get payrolls by employee
- `GET /api/payrolls/month/{month}` - Get payrolls by month
- `POST /api/payrolls` - Create payroll

### Performance
- `GET /api/performance` - Get all performance reviews
- `GET /api/performance/{id}` - Get performance review by ID
- `GET /api/performance/employee/{employeeId}` - Get reviews by employee
- `GET /api/performance/top/{minRating}` - Get top performers
- `POST /api/performance` - Create performance review

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/stats?date={date}` - Get stats for specific date

## Server Configuration

- Port: 8080
- Base URL: http://localhost:8080
- CORS: Enabled for http://localhost:3000

## Database Schema

The application uses JPA/Hibernate with `spring.jpa.hibernate.ddl-auto=update`, which automatically creates/updates tables based on entity definitions.

## Troubleshooting

1. **Database Connection Error**: Ensure MySQL is running and credentials are correct
2. **Port Already in Use**: Change `server.port` in `application.properties`
3. **CORS Issues**: Verify CORS configuration in `CorsConfig.java`

