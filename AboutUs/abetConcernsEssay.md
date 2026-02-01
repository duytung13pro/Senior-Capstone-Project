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
