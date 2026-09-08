# Research Note

## The Learner Problem

Low-Level Design (LLD) and Object-Oriented Design (OOD) form a foundational component of software engineering evaluations, particularly for mid-level and senior technical interviews. When preparing for classic problems such as a Parking Lot, Elevator System, Vending Machine, or Library Management, learners encounter a fundamental pedagogical challenge: it is difficult to determine whether their design choices are sound.

Unlike algorithmic coding challenges where correctness is binary (a solution passes or fails automated test suites), software architecture is inherently open-ended:

1. **Multiple Valid Solutions:** Different decomposition approaches, inheritance hierarchies, and design pattern applications can all achieve functional requirements while introducing different trade-offs regarding coupling, cohesion, and extensibility.
2. **Abstract vs. Concrete Struggles:** Learners often understand theoretical object-oriented principles (such as SOLID or encapsulation) in isolation, but struggle to map these principles to domain boundaries, entity lifecycles, and class interactions.
3. **Absence of Immediate, Explainable Feedback:** Candidates typically practice alone in notes or on whiteboards. Without an experienced engineer to review their design, mistakes such as God classes, leaky abstractions, or tightly coupled payment processing go unnoticed.
4. **Insufficiency of Binary Correctness:** Checking whether a candidate wrote syntactically valid code does not evaluate architectural quality. An implementation may function while exhibiting severe anti-patterns.
5. **Lack of Iterative Improvement Loops:** Without persistent tracking of past architectural attempts and rubric-grounded explanations of what worked and what needs improvement, learners struggle to measure their progression over time.

## Existing Approaches

In researching existing learning tools and platforms, three primary categories emerge:

### 1. Automated Coding Practice Platforms (e.g., LeetCode, HackerRank)
- **Strengths:** Excellent automated execution, immediate feedback via test cases, and rigorous performance benchmarking (time and space complexity).
- **Gaps for LLD:** These platforms evaluate algorithmic input/output matching. They cannot evaluate structural qualities, such as whether responsibilities are separated cleanly across classes, whether state transitions are defensive, or whether an interface enables future extensibility without modification.

### 2. Static Content and System Design Interview Guides (e.g., Books, Blogs, Video Courses)
- **Strengths:** High-quality reference architectures, curated design pattern illustrations, and thorough explanations of trade-offs written by experienced practitioners.
- **Gaps for LLD:** Consumption is passive. Learners read or watch completed solutions without engaging in the active cognitive effort of structuring their own models. When learners do write down designs independently, static materials provide no evaluation or corrective feedback.

### 3. General-Purpose AI Chatbots (e.g., ChatGPT, Claude)
- **Strengths:** Capable of analyzing natural language designs and discussing design patterns conversationally.
- **Gaps for LLD:** Unstructured interactions lead to inconsistent evaluations. Chat models frequently produce generic praise ("looks great!") without holding solutions to strict domain rubrics. Furthermore, conversations are unanchored to persistent attempts, structured sectional prompts, or comparative historical tracking.

## Key Gaps

The primary gap in the current ecosystem is the lack of a dedicated, structured practice loop specifically designed for Low-Level Design:

```
Choose Problem
  → Structured Sectional Thinking
    → Draft Persistence & Autosave
      → Submit Design
        → Explainable, Rubric-Grounded Evaluation
          → Review Stored Attempt History
            → Iterate & Try Again
```

To bridge this gap, an effective platform must:
- Structure the open-ended design space into focused conceptual sections (entities, relationships, state flow, extensibility).
- Maintain persistent attempt histories so learners can track their evolution across revisions.
- Provide explainable, multi-dimensional feedback that breaks down scores and observations per section rather than delivering an ungrounded summary.

## Product Direction

DesignForge addresses this need by implementing a focused, pragmatic MVP rather than attempting to build an exhaustive Learning Management System (LMS) or video interview platform:

- **Curated Problem Set:** Focuses on four representative LLD problems (Parking Lot, Elevator System, Vending Machine, Library Management), each exercising different architectural competencies (containment, state coordination, payment extensibility, and catalog abstraction).
- **Section-Based Guidance:** Replaces blank text canvases with structured design prompts tailored to the specific problem domain.
- **Persistent Attempt Lifecycle:** Records every attempt in a relational database, supporting continuous autosave, draft resumption, and historical review.
- **Hybrid Evaluation Model:** Combines deterministic validation guards (empty checks, duplicate submission protection) with explainable, section-by-section rubric evaluation.
- **Actionable Scorecards:** Persists structured assessments, overall scores (0–100), section-level scores (0–10), specific strengths, concrete areas for improvement, and next challenge recommendations.
