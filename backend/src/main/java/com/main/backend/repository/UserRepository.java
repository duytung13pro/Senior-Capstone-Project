package com.main.backend.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.main.backend.model.User;

public interface UserRepository extends MongoRepository<User, String> {
}
