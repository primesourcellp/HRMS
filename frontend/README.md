# HRMS - Human Resource Management System

A complete, modern HRMS software with React frontend and Spring Boot backend, featuring a professional UI and comprehensive workflow management.

## Architecture

- **Frontend**: React 18 with Vite, Tailwind CSS, React Router
- **Backend**: Spring Boot 3.2.0 with Java 17
- **Database**: MySQL 8.0+
- **Build Tool**: Maven

## Features

### 🎯 Core Modules

1. **Dashboard**
   - Real-time analytics and statistics
   - Visual charts and graphs
   - Quick overview of key metrics
   - Recent employee activity

2. **Employee Management**
   - Add, edit, and delete employees
   - Search and filter functionality
   - Employee profile management
   - Department and position tracking

3. **Attendance Management**
   - Daily attendance tracking
   - Check-in/Check-out recording
   - Present/Absent status management
   - Attendance statistics and reports

4. **Leave Management**
   - Leave request submission
   - Leave approval/rejection workflow
   - Leave type management (Sick, Vacation, Personal, etc.)
   - Leave history tracking

5. **Payroll Management**
   - Salary processing
   - Allowances and deductions
   - Bonus management
   - Payroll history and reports

6. **Performance Reviews**
   - Employee performance tracking
   - Rating system (1-5 stars)
   - Goals and achievements tracking
   - Feedback management

7. **Settings**
   - User profile management
   - Notification preferences
   - Security settings
   - Data management

## Prerequisites

### Frontend
- Node.js (v16 or higher)
- npm or yarn

### Backend
- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+

## Installation & Setup

### 1. Database Setup

```sql
CREATE DATABASE hrms;
```

Update database credentials in `backend/src/main/resources/application.properties` if needed:
- Username: root
- Password: root
- Database: hrms

### 2. Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The backend will run on `http://localhost:8080`

### 3. Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Login Credentials

- **Email:** admin@hrms.com
- **Password:** admin123

## Project Structure

```
Billing_Software/
├── backend/                    # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/hrms/
│   │   │   │   ├── entity/      # JPA Entities
│   │   │   │   ├── repository/   # JPA Repositories
│   │   │   │   ├── service/      # Business Logic
│   │   │   │   ├── controller/   # REST Controllers
│   │   │   │   └── config/       # Configuration
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml
│
├── src/                        # React Frontend
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── services/
│   └── App.jsx
│
├── package.json
├── vite.config.js
└── README.md
```

## API Endpoints

### Base URL: `http://localhost:8080/api`

### Employees
- `GET /employees` - Get all employees
- `GET /employees?search={term}` - Search employees
- `GET /employees/{id}` - Get employee by ID
- `POST /employees` - Create new employee
- `PUT /employees/{id}` - Update employee
- `DELETE /employees/{id}` - Delete employee

### Attendance
- `GET /attendance` - Get all attendance records
- `GET /attendance/date/{date}` - Get attendance by date
- `POST /attendance/mark` - Mark attendance

### Leaves
- `GET /leaves` - Get all leaves
- `GET /leaves?status={status}` - Get leaves by status
- `POST /leaves` - Create leave request
- `PUT /leaves/{id}/status` - Update leave status

### Payrolls
- `GET /payrolls` - Get all payrolls
- `POST /payrolls` - Create payroll

### Performance
- `GET /performance` - Get all performance reviews
- `POST /performance` - Create performance review

### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics

## Development

### Running Backend
```bash
cd backend
mvn spring-boot:run
```

### Running Frontend
```bash
npm run dev
```

### Building for Production

**Backend:**
```bash
cd backend
mvn clean package
java -jar target/hrms-backend-1.0.0.jar
```

**Frontend:**
```bash
npm run build
```

## Database Schema

The application uses JPA/Hibernate with automatic table creation. Tables are created automatically based on entity definitions:
- `employees`
- `attendance`
- `leaves`
- `payrolls`
- `performance`

## Configuration

### Backend Configuration
Edit `backend/src/main/resources/application.properties`:
- Database connection settings
- Server port
- CORS configuration

### Frontend Configuration
Edit `src/services/api.js`:
- API base URL (default: `http://localhost:8080/api`)

## Troubleshooting

1. **Database Connection Error**: 
   - Ensure MySQL is running
   - Verify credentials in `application.properties`
   - Check database exists: `CREATE DATABASE hrms;`

2. **Port Already in Use**: 
   - Backend: Change `server.port` in `application.properties`
   - Frontend: Change port in `vite.config.js`

3. **CORS Issues**: 
   - Verify CORS configuration in `CorsConfig.java`
   - Check API base URL in frontend

4. **Build Errors**:
   - Ensure Java 17+ is installed
   - Run `mvn clean install` in backend directory
   - Run `npm install` in root directory

## Technology Stack

### Frontend
- React 18
- React Router
- Tailwind CSS
- Recharts
- Lucide React
- Date-fns
- Vite

### Backend
- Spring Boot 3.2.0
- Spring Data JPA
- MySQL Connector
- Lombok
- Maven

## License

This project is open source and available for use.

## Support

For issues or questions, please check the documentation or create an issue in the repository.
