package com.main.backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum ClassLevel {
    BEGINNER,
    INTERMEDIATE,
    ADVANCED,
    ALL_LEVEL;

    @JsonCreator
    public static ClassLevel fromValue(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value
                .trim()
                .toUpperCase()
                .replace(' ', '_')
                .replace('-', '_');

        if ("ALL_LEVELS".equals(normalized)) {
            normalized = "ALL_LEVEL";
        }

        for (ClassLevel classLevel : ClassLevel.values()) {
            if (classLevel.name().equals(normalized)) {
                return classLevel;
            }
        }

        throw new IllegalArgumentException("Invalid class level: " + value);
    }
}