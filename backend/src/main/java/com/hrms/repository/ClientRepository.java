package com.hrms.repository;

import com.hrms.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    Optional<Client> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
