Project: Learning Management System - AI-assisted Learning Platform Final Fall Design Report
Table of Contents

1. Team names and Project Abstract
●	Quoc Huynh - huynhqk@mail.uc.edu
●	Jay (Tung) Dao - daot4@mail.uc.edu 
●	Khai Nguyen - nguye2kh@mail.uc.edu 
Term: Fall 2025 - University of Cincinnati, CEAS
Advisor: Lee Seokki | seokki.lee@uc.edu

We developed an AI-assisted Learning Management System to streamline course administration and communication. Built on React/Next.js and Python/Django, the platform features secure Google auth, role-based access, and organized learning modules. It empowers teachers with productivity tools while providing students seamless access to educational resources in a scalable environment.



2. Project Description
Problem Statement
In the modern educational landscape, educators often face significant administrative burdens that detract from their primary goal: teaching. Managing course materials, communicating effectively with parents and students, and organizing weekly schedules can become overwhelming without a centralized system. Simultaneously, students require a streamlined, accessible interface to engage with learning materials without technical friction. Existing solutions often lack specific productivity tools for teachers or are too complex for rapid adopt

Project Focus:
-	Course & Module Management: Teachers can create, update, and organize courses and learning modules. Each module can contain files and videos, tailored to different languages and educational levels.
-	Authentication & Role Management: The platform supports secure login and registration for users, including social login via Google. Users are assigned roles (such as teacher or student), with permissions and access tailored to their role.
-	Teacher Productivity Tools: The frontend provides templates for communication (such as emails to parents and class announcements) and weekly planning, helping educators save time and stay organized.
-	Student Resources: Components and tools are provided for students to easily access learning materials and resources.
-	Technology Stack: The project uses React/Next.js (TypeScript) for the frontend and Python/Django for the backend, ensuring scalability and maintainability with enough programmer friendly.
Member Roles:
-	Jay (Front End & UX Development): Develops user-facing features, ensures a responsive design, and leads the user experience (UX) research and design efforts.
-	Quoc (Backend & API): Designs and implements the core server-side logic, database schema, and API endpoints.
-	Khai (Integration & Devops): Manages the CI/CD pipeline, ensures seamless integration between the frontend and backend, and handles deployment.
In summary:
The project’s primary focus is to enable classroom management for teachers and enhance learning for students by providing tools for course administration, communication, scheduling, and secure access.



3. User Stories and Design Diagrams (Assignment #4)
User Stories: The system is designed to support Teachers who need to easily create and organize courses and learning modules to provide a structured, logical environment for their students; they also require access to communication templates for announcements and emails to save administrative time. Students need to securely log in using their Google accounts to quickly access materials without managing new credentials, and they must be able to access learning modules containing embedded videos and files to review content at their own pace. Finally, Administrators require the ability to assign specific roles (Teacher, Student) to new users upon registration to strictly control access permissions and maintain platform security.

Design Diagrams:**
    * [Level 0 Diagram](./docs/diagrams/level0.png)
    * [Level 1 Diagram](./docs/diagrams/level1.png)
    * [Level 2 Diagram](./docs/diagrams/level2.png)
Description of Diagrams:

4. Project Tasks and Timeline
. [Task List](./docs/task_list.md)
[Project Timeline](./docs/timeline.pdf)
[Effort Matrix](./docs/effort_matrix.md)

4. ABET Concerns Essay
Our capstone has a near-zero cash budget, so we will prioritize open-source frameworks, free
academic tiers, and university resources; this constrains cloud choices (e.g., modest compute/storage),
pushes us toward serverless or credits-eligible services, and requires a lean MVP that can run on a single
database and one API. These limits shape scope by forcing simple, automatable operations—seed data,
scripted deployments, and observability we can maintain without paid tools. Legal: Because the system
stores student data and learning records, we must align with education-privacy expectations (FERPA-style
principles) and avoid ingesting any copyrighted materials without permission; that narrows content
sources, requires consent flows, and obligates data-retention and export features. Additionally, we will
license third-party assets carefully and segregate any model prompts/outputs that include copyrighted text
to prevent improper redistribution. Security & Privacy: We will implement role-based access control
(student/teacher/admin), encrypt data at rest and in transit, and minimize personally identifiable
information; this constrains schema design (clear data boundaries), logging (no sensitive payloads), and
feature choices (opt-in analytics, privacy-preserving defaults). AI features must include audit logs and
citation trails so that teachers can review model suggestions and students can contest automated feedback.
We will also harden uploads (MIME/type checks, virus scanning) and follow the principle of least
privilege in API/service accounts. Diversity & Cultural Impact: Our users span English/ Vietnamese/
Chinese contexts and mixed bandwidth environments; this constrains UX (simple language, multilingual
UI, offline-tolerant caching) and content (examples that respect local classroom norms). Pronunciation
and feedback must be inclusive of accents and tone errors without stigmatizing learners, and accessibility
will follow WCAG practices for color contrast, captions, and keyboard navigation. Together, these
constraints steer us toward a small, reliable core: transparent AI assistance with human oversight,
privacy-first data flows, and an interface that degrades gracefully on low-end devices. By embracing these
boundaries early, we reduce risk, protect learners and instructors, and deliver a credible pilot we can scale
only after evidence of value.

5. PPT Slideshow (Assignment #8)
* [Download Final Presentation Slides](./slides/final_presentation.pptx)

6. Self-Assessment Essays (Assignment #3)
My senior design project, TtranPphu/little-startup, is an instructional platform that seeks to assist teachers and students by streamlining classroom management and enhancing learning experiences. From an intellectual perspective, the project allows me to integrate frontend and backend knowledge into one practical application. The site is focused on managing course and modules, where teachers can create, organize, and distribute learning materials, with the added advantage of providing students easy access to study materials. Features like authentication, role management, and teacher productivity features display a full-stack approach by utilizing both React/Next.js with TypeScript for the client-side and Java/Spring Boot for the server-side. This project aligns with my goal of developing software with real, practical relevance to the education industry. By making a contribution to this site, I wish to further my web development, user experience, and system design skills by collaborating as part of a team. The project is an integration of technical application of skill and problem-solving wherein I have cultivated throughout my academic studies.

My studies at the college have provided me with a firm foundation on which to build this project. Courses such as CS301 – Data Structures and Algorithms and CS350 – Software Engineering have educated me on the fundamentals of producing good, maintainable code and development within a structured software life cycle. Additionally, subjects like CS410 – Web Application Development and CS420 – Database Systems have prepared me to manage modern frontend frameworks, backend architectures, and relational databases, which all belong to this platform. Other than technical expertise, my learning in CS430 – Human-Computer Interaction has prepared me to consider usability and user experience, such that the platform becomes usable for both students and instructors. Together, these courses provide a balance of theoretical knowledge and practical application skills, and I am equipped to make good decisions in both system architecture and interface design. I anticipate directly applying these principles in creating modular course management, secure authentication, and interactive learning tools for the project.

My co-op experiences have also shaped my skills in making useful contributions to the project. By working at Honeywell Intelligrated as a Software Engineering Intern, I gained hands-on experience in programming complex software systems and collaborating with cross-functional teams. I undertook activities like automation, debugging, and integration testing that improved my problem-solving, collaboration, and communication skills. I also gained the skill to handle timelines and note work tidily, which is essential in coordinating a multi-component project like our learning platform. Technical skills such as API development, version control mechanisms such as Git, and familiarity with deployment in the cloud have been solidified through my co-op. These lessons learned will guide my approach to designing scalable backend systems, combining frontend components, and making the platform maintainable and fault-tolerant. My co-op has largely connected the classroom with the real world, and that will be most important to this project's success.

I am highly enthusiastic about participating in this project since it combines my love for software development with a meaningful application towards education. I individually hope to create instruments that automate teaching and enhance learning availability, and it is well aligned with the platform's goals. The ability to impact both educators and students through technology is inspiring and drives my commitment to producing quality work. I am particularly excited about integrating features like teacher productivity templates, secure authentication, and multilingual learning modules. This project allows me to apply my technical skills while exercising creativity in designing interfaces and system workflows that meet user needs. Additionally, the collaborative aspect of the project excites me, as it offers an opportunity to learn from teammates and contribute my strengths in frontend and backend development. My fascination is fueled both by technical sophistication and potential practical application of the project.

My first approach to designing the platform is an incremental, modular development plan. I would start with establishing critical backend services like authentication, role management, and course module APIs, then proceed with front-end implementation using React/Next.js components. I shall employ Agile practices to rank tasks, track progress, and repeat on features according to feedback from the team. Deliverables will be a fully functional platform that allows teachers to manage courses and communicate efficiently, and students to navigate resources without obstruction. I shall conduct self-assessment of my work by establishing clear milestones and testing for functionality according to project requirements so that each segment fulfills technical and user experience requirements. The success measure will be the completeness, usability, and stability of the platform, as well as my own cognitive ability to contribute to the team and gain knowledge through the collaborative process. It is a formal cognitive plan aimed at delivering the project within timelines and achieving educational objectives.
<img width="468" height="643" alt="image" src="https://github.com/user-attachments/assets/93a9f630-3a79-422f-9883-ce7e1a11d091" />

Jay Dao Essay

Quoc Huynh Essay

7. Professional Biographies (Assignment #1)
Name: Han Chinh Khai Nguyen.
Phone number: +1 619-415-3337

Email: nguye2kh@mail.uc.edu

Co-op experience:

Software-Engineer Intern at Honeywell Intelligrated(Mason, OH)(3 quarters)

Use Winforms and C# to develop and maintain both front-end and back-end features for XSD-driven, XML-editing tool “MC4 Configurator”
Wrote unit tests for existing features to ensure code quality and reliability
Integrated a tool to parse XML and export specific values in CSV format for manual analysis
Gained real-world experience with version control, code reusing and how to build upon existing code
Designed and created 3 new features in an existing configuration tool using C#,WPF to improve its efficiency.
Collaborated with field engineers to gather requirements, get feedback and implement them into the tools.
Created documentation for the newly added features for future developers as well as users.

8. Budget
* **Expenses to Date:** $[0.00] (Or list specific expenses)
* **Donated Items:**
    * [Item Name]: $[Value] (Source: [Source Name])
    * [Item Name]: $[Value] (Source: [Source Name])

9. Appendix
References & Citations:** [Link to Bibliography](./docs/references.md)
Code Repository:** [Link to Source Code Folder](./src/)
Meeting Notes & Effort Logs:**
    * *Evidence justifying 45 hours of effort per team member.*
    * [Link to Meeting Notes Folder](./meeting_notes/)
