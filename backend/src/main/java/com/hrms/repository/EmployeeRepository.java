package com.hrms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hrms.entity.Employee;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
<<<<<<< HEAD


    List<Employee> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDepartmentContainingIgnoreCase(
            String firstName, String lastName, String email, String department);
=======
    List<Employee> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDepartmentContainingIgnoreCase(
            String name, String email, String department);
>>>>>>> 2c550b7884d6f72fa5ebdefcd004805c337ce6fc
    
    java.util.Optional<Employee> findByEmail(String email);
}

