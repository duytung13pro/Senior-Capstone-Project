package com.main.backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.main.backend.dto.ClassResponse;
import com.main.backend.dto.CreateClassRequest;
import com.main.backend.model.Class;
import com.main.backend.repository.ClassRepository;

@RestController
@RequestMapping("/api/classes")
@CrossOrigin(origins = "http://localhost:3000")
public class ClassController {

    private final ClassRepository classRepository;

    public ClassController(ClassRepository classRepository) {
        this.classRepository = classRepository;
    }


    @PostMapping
    public ResponseEntity<?> createClass(@RequestBody CreateClassRequest req) {

        Class c = new Class();
        c.setName(req.getName());
        c.setLevel(req.getLevel());
        c.setTime(req.getTime());
        c.setDays(req.getDays());
        c.setDescription(req.getDescription());
        c.setTeacherId(req.getTeacherId());

        classRepository.save(c);

        return ResponseEntity.ok(new ClassResponse(c));
    }


    @GetMapping("/my")
    public List<ClassResponse> getMyClasses(@RequestParam String teacherId) {

        return classRepository
            .findByTeacherId(teacherId)
            .stream()
            .map(ClassResponse::new)
            .collect(Collectors.toList());
    }
}
