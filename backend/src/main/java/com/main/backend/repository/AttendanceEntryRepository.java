package com.main.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.main.backend.model.AttendanceEntry;

public interface AttendanceEntryRepository extends MongoRepository<AttendanceEntry, String> {
    List<AttendanceEntry> findByClassId(String classId);

    void deleteByClassId(String classId);

    List<AttendanceEntry> findByClassIdAndDate(String classId, String date);

    AttendanceEntry findTopByClassIdAndDateAndStudentId(String classId, String date, String studentId);
}
