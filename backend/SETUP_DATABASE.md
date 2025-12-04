# Database Setup Instructions

## Quick Setup

The `hrms` database needs to be created before running the Spring Boot application.

### Option 1: Using MySQL Command Line

1. Open MySQL command line or MySQL Workbench
2. Run the following command:

```sql
CREATE DATABASE IF NOT EXISTS hrms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or use the provided script:
```bash
mysql -u root -p < create-database.sql
```

### Option 2: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Click on "Server" → "Data Import"
4. Or simply run this SQL in a query window:
   ```sql
   CREATE DATABASE IF NOT EXISTS hrms;
   ```

### Option 3: Using Command Prompt (Windows)

```cmd
mysql -u root -p
```

Then enter your password and run:
```sql
CREATE DATABASE IF NOT EXISTS hrms;
exit;
```

### Verify Database Creation

After creating the database, verify it exists:
```sql
SHOW DATABASES;
```

You should see `hrms` in the list.

### Next Steps

Once the database is created, you can start the Spring Boot application:
```bash
mvn spring-boot:run
```

The application will automatically create all necessary tables on first run.

