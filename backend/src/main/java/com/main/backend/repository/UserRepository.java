package com.main.backend.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.main.backend.model.User;

public interface UserRepository extends MongoRepository<User, String> {
    // Handle database querying, find a User object by email
    Optional<User> findByEmail(String email);

}
