Table of Contents

1.  Team names and Project Abstract: [Click Here](./teamNameProjectAbstract)

2.  Project Description: [Click Here](./projectDescription.md)

3.  User Stories and Design Diagrams

          User Stories: [Click Here](./userStories.md)

          Design Diagrams:**
          [Level 0 Diagram](./docs/diagrams/level0.png)
          [Level 1 Diagram](./docs/diagrams/level1.png)
          [Level 2 Diagram](./docs/diagrams/level2.png)

    Description of Diagrams:

4.  Project Tasks and Timeline
    [Task List](./docs/task_list.md)
    [Project Timeline](./docs/timeline.pdf)
    [Effort Matrix](./docs/effort_matrix.md)

5.  ABET Concerns Essay: [Click Here](./abetConcernsEssay.md)

6.  PPT Slideshow (Assignment #8)

- [Download Final Presentation Slides](./slides/final_presentation.pptx)

7. Self-Assessment Essays

Khai Nguyen: [Click Here](./khaiSelfAssessmentEssay.md)

Jay Dao Essay

Quoc Huynh Essay

8. Professional Biographies (Assignment #1)
   Khai Nguyen" [Click Here](./khaiBiography.md)

Jay Dao birography

Quoc Huynh Biography

8. Budget

- **Expenses to Date:** $[0.00] (Or list specific expenses)
- **Donated Items:**
  - [Item Name]: $[Value] (Source: [Source Name])
  - [Item Name]: $[Value] (Source: [Source Name])

9. Appendix
   References & Citations:** [Link to Bibliography](./docs/references.md)
   Code Repository:** [Link to Source Code Folder](./src/)
   Meeting Notes & Effort Logs:\*\* \* _Evidence justifying 45 hours of effort per team member._ \* [Link to Meeting Notes Folder](./meeting_notes/)

## Backend Profiles & MongoDB

Backend now uses Spring profile-specific Mongo host settings:

- `dev` profile: `mongo:27017`
- `prod` profile: `mongo:27017`

Shared Mongo settings are defined in `backend/src/main/resources/application.properties` and can be overridden with environment variables:

- `SPRING_DATA_MONGODB_HOST`
- `SPRING_DATA_MONGODB_PORT`
- `SPRING_DATA_MONGODB_DATABASE`
- `SPRING_DATA_MONGODB_USERNAME`
- `SPRING_DATA_MONGODB_PASSWORD`
- `SPRING_DATA_MONGODB_AUTHENTICATION_DATABASE`

Run examples:

```bash
# Dev profile (Docker Mongo service "mongo")
cd backend
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run

# Prod profile (Docker service name "mongo")
cd backend
SPRING_PROFILES_ACTIVE=prod ./mvnw spring-boot:run
```
