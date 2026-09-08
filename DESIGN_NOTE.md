# Design Note: DesignForge Architecture & Implementation

**Author:** Karan Thakur  
**Role:** Full-Stack & Systems Architecture  
**Date:** September 2026  

---

## 1. MVP Overview

DesignForge is designed as a lean, robust Next.js monolith providing a low-friction practice environment for Low-Level Design (LLD). The MVP delivers:

1. **Problem Catalogue:** Four foundational problems spanning various OOD dimensions (Parking Lot, Elevator System, Vending Machine, Library Management).
2. **Interactive Workspace:** Clean sectional text editors customized to each problem's design facets.
3. **Lifecycle Persistence:** Draft autosaving, resumption of unfinished work, explicit draft saves, and final submissions.
4. **Explainable AI Evaluation:** Section-by-section rubric evaluation, overall scoring, strengths, areas for improvement, and next challenge recommendations.
5. **Historical Portfolio:** "My Attempts" dashboard tracking historical submissions with status filtering and detailed review breakdowns.

---

## 2. Complete User Flow

```
1. Discovery (Home Page)
   └── User views curated problems, filters by difficulty (ALL, EASY, MEDIUM, HARD).
   └── Selects a challenge (e.g., "PARKING LOT").

2. Initialization (Practice Route)
   └── App Router mounts `/practice/[slug]`.
   └── Client sends POST `/api/attempts` with `{ problemSlug: "parking-lot" }`.
   └── Backend checks if an active (`IN_PROGRESS` or `DRAFT`) attempt exists:
       ├── If YES: Returns existing attempt, restoring previously typed responses.
       └── If NO: Creates new attempt in database with status `IN_PROGRESS`.

3. Authoring & Autosave (Workspace)
   └── User enters design text in section editors.
   └── Debounced timer triggers after 1500ms of inactivity:
       └── Sends PATCH `/api/attempts/:id` with responses payload.
       └── UI updates status subtly: "SAVING..." -> "CHANGES SAVED" -> "IN PROGRESS".
   └── Optional: User clicks "SAVE DRAFT" to immediately persist with status `DRAFT`.

4. Submission & Evaluation
   └── User clicks "SUBMIT DESIGN".
   └── Validation ensures at least one section has substantive content.
   └── Backend marks attempt status as `SUBMITTED` with `submittedAt = now()`.
   └── Submission Coordinator passes problem, rubrics, and user responses to `AIEvaluator`.
   └── Evaluator generates structured score, assessments, and section reviews.
   └── Validated via Zod `AIReviewOutputSchema`.
   └── Atomic DB transaction commits `AIReview`, `SectionReview` records, and updates Attempt to `REVIEWED`.
   └── Frontend redirects seamlessly to `/attempts/:id`.

5. Review & Progression
   └── User reviews overall score (0–100), assessment badge, design summary, strengths, and weaknesses.
   └── Analyzes section-by-section user response vs AI feedback.
   └── Clicks "START [NEXT CHALLENGE] →" to progress or "TRY AGAIN →" to reattempt.
   └── Can review all prior work at `/attempts` with filters (`ALL`, `REVIEWED`, `IN PROGRESS`, `DRAFTS`).
```

---

## 3. Important Classes, Models, and Interfaces

### 3.1 Relational Data Models (Prisma)
- **`Problem`**: Identifies system design challenges with unique slugs, requirement lists, difficulty, and focus areas.
- **`ProblemSection`**: Represents discrete conceptual boundaries (e.g., "Classes & Responsibilities", "State Transitions") paired with specific `evaluationCriteria`.
- **`Attempt`**: State machine entity tracking `status` (`DRAFT`, `IN_PROGRESS`, `SUBMITTED`, `REVIEWED`, `FAILED`).
- **`AttemptResponse`**: Captures user input per section with composite unique constraint `[attemptId, sectionId]`.
- **`AIReview`**: 1-to-1 relationship with `Attempt`, storing `overallScore`, `assessment`, `designSummary`, `strengths`, `improvements`, and `nextProblemRecommendation`.
- **`SectionReview`**: 1-to-many from `AIReview`, storing granular section scores (`Float`) and qualitative feedback (`Text`).

### 3.2 Evaluation Service Abstraction
```typescript
export interface EvaluationInput {
  problemTitle: string
  problemSlug: string
  problemDescription: string
  requirements: string[]
  sections: Array<{
    id: string
    title: string
    description: string
    evaluationCriteria: string
  }>
  responses: Array<{
    sectionId: string
    response: string
  }>
}

export interface AIEvaluator {
  evaluate(input: EvaluationInput): Promise<AIReviewOutput>
}
```

Implementations:
- **`DeterministicRuleEvaluator`**: Baseline rule-based LLD heuristic analyzer that checks depth, domain entity coverage, design patterns, and trade-offs.
- **`GeminiAIEvaluator`**: Remote Gemini LLM integration via JSON schema generation.
- **`OpenAIEvaluator`**: Remote OpenAI integration via structured outputs.
- **`getAIEvaluator()`**: Factory returning the configured provider from environment variables.

---

## 4. Evaluation Approach: The Hybrid Model

Evaluation follows a strict two-stage pipeline:
1. **Deterministic Guards:**
   - Empty response validation: Blocks submissions without content with actionable user errors.
   - Duplicate submission protection: Prevents concurrent or repeated submissions from re-running evaluation on already reviewed attempts.
2. **Qualitative Rubric Scoring:**
   - The evaluator receives the exact `evaluationCriteria` defined in the seeded problem sections.
   - Outputs are strictly constrained to numeric intervals: Section scores are normalized on a 0–10 scale, and overall score is normalized on a 0–100 scale.
   - Assessment categories map directly to score bands:
     - 90–100: `EXCELLENT ARCHITECTURE`
     - 75–89: `STRONG FOUNDATION`
     - 60–74: `DEVELOPING APPROACH`
     - <60: `NEEDS REFINEMENT`

---

## 5. Architectural Trade-offs

1. **Monolith vs. Distributed Services:**
   - *Decision:* Monolithic Next.js architecture with PostgreSQL.
   - *Rationale:* An LLD practice platform does not have distinct scaling vectors between its catalog and submission paths. A monolith avoids network latency, serialization boundaries, distributed transactions, and unnecessary deployment overhead.
2. **PostgreSQL + Prisma vs. Document Store (MongoDB):**
   - *Decision:* PostgreSQL with Prisma ORM.
   - *Rationale:* Problems, sections, attempts, and reviews are inherently relational. Foreign keys, unique composite indexes (e.g. `[attemptId, sectionId]`), and ACID transactions ensure response consistency and atomic submission reviews.
3. **Debounced Autosave (1500ms):**
   - *Decision:* 1.5-second debounce window.
   - *Rationale:* Typing in natural language occurs in bursts. 1500ms provides optimal perceived performance without causing write locks or thrashing connection pools.
4. **Preservation of Existing Frontend Design:**
   - *Decision:* Zero visual modifications to colors, fonts, spacing, or DOM hierarchy.
   - *Rationale:* The existing design system is distinctive and purpose-built. Real functionality (state management, fetch calls, loading disabled states) was injected without introducing foreign CSS or UI bloat.

---

## 6. Extensibility Decisions

1. **Adding New Problems:**
   - New problems require only adding entries to `prisma/seed.ts` and running `pnpm run seed`. The schema, API handlers, and UI dynamically render any number of sections without code changes.
2. **Switching AI Providers:**
   - Any new provider (e.g., Anthropic Claude, local Ollama/Mistral) can be added by implementing the `AIEvaluator` interface and registering it in `getAIEvaluator()`. No UI or database changes are required.
3. **Adding Authentication:**
   - The `Attempt` model already includes an optional `userId` foreign key to `User`. Integrating NextAuth, Clerk, or Supabase Auth requires only populating `userId` during `POST /api/attempts`, leaving the rest of the application completely unchanged.
