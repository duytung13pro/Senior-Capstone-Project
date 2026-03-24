package com.main.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.main.backend.model.LessonPlan;
import com.main.backend.repository.LessonPlanRepository;

@ExtendWith(MockitoExtension.class)
class LessonPlanControllerWebTest {

    @Mock
    private LessonPlanRepository lessonPlanRepository;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().findAndRegisterModules();
        LessonPlanController controller = new LessonPlanController(lessonPlanRepository);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void postLessonPlanAcceptsArrayPayloadsForTextFields() throws Exception {
        when(lessonPlanRepository.save(any(LessonPlan.class))).thenAnswer(invocation -> {
            LessonPlan saved = invocation.getArgument(0);
            saved.setId("lp-test-1");
            saved.setCreatedAt(Instant.parse("2026-03-17T00:00:00Z"));
            saved.setUpdatedAt(Instant.parse("2026-03-17T00:00:00Z"));
            return saved;
        });

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("teacherId", "teacher-1");
        payload.put("classId", "class-1");
        payload.put("moduleId", "module-1");
        payload.put("title", "Lesson with arrays");
        payload.put("date", "2026-03-17T10:00:00Z");
        payload.put("status", "Draft");
        payload.put("objectives", List.of("Obj A", "Obj B"));
        payload.put("activities", List.of("Act A", "Act B"));
        payload.put("materials", List.of("Mat A", "Mat B"));
        payload.put("assessment", List.of("Ass A", "Ass B"));
        payload.put("template", false);

        mockMvc.perform(post("/api/lesson-plans")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("lp-test-1"))
                .andExpect(jsonPath("$.objectives").value("Obj A\nObj B"))
                .andExpect(jsonPath("$.activities").value("Act A\nAct B"))
                .andExpect(jsonPath("$.materials").value("Mat A\nMat B"))
                .andExpect(jsonPath("$.assessment").value("Ass A\nAss B"));

        ArgumentCaptor<LessonPlan> captor = ArgumentCaptor.forClass(LessonPlan.class);
        verify(lessonPlanRepository, times(1)).save(captor.capture());

        LessonPlan persisted = captor.getValue();
        org.junit.jupiter.api.Assertions.assertEquals("Obj A\nObj B", persisted.getObjectives());
        org.junit.jupiter.api.Assertions.assertEquals("Act A\nAct B", persisted.getActivities());
        org.junit.jupiter.api.Assertions.assertEquals("Mat A\nMat B", persisted.getMaterials());
        org.junit.jupiter.api.Assertions.assertEquals("Ass A\nAss B", persisted.getAssessment());
    }
}
