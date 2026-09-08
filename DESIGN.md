# Design Note

## MVP

DesignForge is designed as an interactive Low-Level Design (LLD) practice platform that provides a structured, reproducible environment for practicing system architecture. The minimum viable product (MVP) implements the following end-to-end journey:

1. **Choose Problem:** The learner browses the curated problem catalogue on the home page and filters challenges by difficulty (`ALL`, `EASY`, `MEDIUM`, `HARD`).
2. **Start or Resume Attempt:** Selecting a problem navigates to the practice workspace. The application checks whether an active unfinished attempt exists in PostgreSQL, resuming it if present or creating a new attempt.
3. **Work Through Design Sections:** The learner writes their solution across structured problem-specific sections (such as domain entities, relationships, state transitions, or dispatch algorithms) rather than an unstructured text box.
4. **Save Responses:** The workspace automatically persists responses in the database using a 1.5-second debounced background save, accompanied by an explicit **SAVE DRAFT** action.
5. **Submit:** The learner triggers **SUBMIT DESIGN**, which validates non-empty input and safeguards against duplicate submissions.
6. **AI Evaluation:** The backend orchestrates evaluation against the problem's rubric using the configured evaluation service.
7. **Review Feedback:** The application saves the evaluation atomically and redirects to the attempt details page, displaying an overall score (0–100), qualitative assessment, design summary, strengths, areas to improve, section-level scores (0–10), and next challenge recommendations.
8. **View Attempt History:** The learner visits **MY ATTEMPTS** to inspect past submissions with status filters (`ALL`, `REVIEWED`, `IN PROGRESS`, `DRAFTS`).
9. **Try Again:** From the review page, the learner can reattempt the problem to incorporate the feedback.

## User Flow

```
[Home Page (/)]
       │
       ▼ (Selects Problem: parking-lot, elevator-system, etc.)
[Practice Workspace (/practice/[slug])]
       │
       ├──> POST /api/attempts -> Resolves or creates Attempt in DB
       ├──> Hydrates saved responses into section editors
       ├──> Learner types -> Debounced PATCH /api/attempts/:id (Autosave)
       ├──> Clicks "SAVE DRAFT" -> PATCH /api/attempts/:id with status 'DRAFT'
       │
       ▼ (Clicks "SUBMIT DESIGN")
[Submission Coordinator (/api/attempts/:id/submit)]
       │
       ├──> Deterministic Guards: Rejects empty input, prevents duplicate review
       ├──> Updates status to 'SUBMITTED' with timestamp
       ├──> Invokes AIEvaluator service with problem brief, rubrics & user text
       ├──> Validates output via Zod AIReviewOutputSchema
       ├──> Atomic DB Transaction: Commits AIReview & SectionReviews
       └──> Updates Attempt status to 'REVIEWED' with overallScore
       │
       ▼ (Automatic Redirect)
[Attempt Review (/attempts/:id)]
       │
       ├──> Renders scorecard, design summary, strengths, and improvement areas
       ├──> Displays section-by-section comparison: User Response vs AI Feedback
       └──> Links to recommended next challenge or reattempt
       │
       ▼
[My Attempts (/attempts)]
       └──> Lists all historical attempts with status badges and filters
```

## Domain Model

The application uses PostgreSQL with Prisma ORM. The domain model reflects the operational entities required to manage problems, sectional requirements, user attempts, and structured evaluations:

```
┌──────────────┐          ┌────────────────────┐
│   Problem    │───1:N───<│   ProblemSection   │
└──────────────┘          └────────────────────┘
       │                             │
      1:N                           1:N
       │                             │
       ▼                             ▼
┌──────────────┐          ┌────────────────────┐
│   Attempt    │───1:N───<│  AttemptResponse   │
└──────────────┘          └────────────────────┘
       │
      1:1
       │
       ▼
┌──────────────┐          ┌────────────────────┐
│   AIReview   │───1:N───<│   SectionReview    │
└──────────────┘          └────────────────────┘
```

### 1. Problem
- **Responsibility:** Represents a system design challenge.
- **Attributes:** Unique `slug`, display `number`, `title`, `description`, `context`, `difficulty`, `estimatedTime`, `focus`, and functional `requirements` array.
- **Relationships:** Has many `ProblemSection` records; has many `Attempt` records.

### 2. ProblemSection
- **Responsibility:** Represents a discrete architectural facet of a problem (e.g., "Classes & Responsibilities", "Elevator States").
- **Attributes:** `problemId`, `title`, `description` (prompt), `placeholder`, `order`, and domain-grounded `evaluationCriteria`.
- **Relationships:** Belongs to `Problem`; has many `AttemptResponse` records; has many `SectionReview` records. Unique on `[problemId, order]`.

### 3. Attempt
- **Responsibility:** Represents a learner's practicing session for a specific problem.
- **Attributes:** `problemId`, optional `userId`, `status` (`DRAFT`, `IN_PROGRESS`, `SUBMITTED`, `REVIEWED`, `FAILED`), nullable `overallScore`, nullable `submittedAt`, `createdAt`, `updatedAt`.
- **Relationships:** Belongs to `Problem`; optional foreign key to `User`; has many `AttemptResponse` records; has one `AIReview`.

### 4. AttemptResponse
- **Responsibility:** Captures the learner's text response for a specific section within an attempt.
- **Attributes:** `attemptId`, `sectionId`, `response` (text), timestamps.
- **Relationships:** Belongs to `Attempt` (cascading delete); belongs to `ProblemSection` (cascading delete). Unique on `[attemptId, sectionId]`.

### 5. AIReview
- **Responsibility:** Stores the synthesized architectural evaluation for a submitted attempt.
- **Attributes:** `attemptId`, `overallScore` (Float), `assessment` (string category), `designSummary` (text), `strengths` (JSON array), `improvements` (JSON array), `nextProblemRecommendation` (JSON object).
- **Relationships:** Belongs to `Attempt` (unique 1:1, cascading delete); has many `SectionReview` records.

### 6. SectionReview
- **Responsibility:** Stores the granular, rubric-specific evaluation for a single section within an attempt.
- **Attributes:** `aiReviewId`, `sectionId`, numeric `score` (0–10), qualitative `feedback` (text).
- **Relationships:** Belongs to `AIReview` (cascading delete); belongs to `ProblemSection` (cascading delete). Unique on `[aiReviewId, sectionId]`.

### 7. User
- **Responsibility:** Represents an optional user identity for future authentication integration.
- **Attributes:** `id`, `name`, unique optional `email`, timestamps.
- **Relationships:** Has many `Attempt` records.

## Important Interfaces / Abstractions

### 1. The Evaluation Service Abstraction (`lib/services/ai-evaluator.ts`)

To avoid coupling the core business logic to a single model provider or external SDK, evaluation is encapsulated behind the `AIEvaluator` interface:

```typescript
export interface EvaluationSectionInput {
  id: string
  title: string
  description: string
  evaluationCriteria: string
}

export interface EvaluationInput {
  problemTitle: string
  problemSlug: string
  problemDescription: string
  requirements: string[]
  sections: EvaluationSectionInput[]
  responses: Array<{
    sectionId: string
    response: string
  }>
}

export interface AIEvaluator {
  evaluate(input: EvaluationInput): Promise<AIReviewOutput>
}
```

### 2. Provider Implementations

The codebase implements three concrete providers:
- **`DeterministicRuleEvaluator`:** A local, offline heuristic evaluator that analyzes domain terminology, structural depth, pattern identification, and trade-off justifications against each section's rubric. It guarantees zero external network dependency and consistent scores.
- **`GeminiAIEvaluator`:** Invokes Google Gemini (`gemini-1.5-flash`) with structured JSON schema output, falling back automatically to the deterministic evaluator if the external API is unreachable.
- **`OpenAIEvaluator`:** Invokes OpenAI (`gpt-4o-mini`) using JSON object mode, with identical fallback behavior.

### 3. Factory Selection

The active provider is resolved at runtime via `getAIEvaluator()` based on the `AI_PROVIDER` environment variable (`mock`, `gemini`, or `openai`).

### 4. Runtime Schema Contracts (`lib/validation/schemas.ts`)

All evaluation outputs must conform to `AIReviewOutputSchema` via Zod before the persistence layer accepts them:
- `overallScore`: integer between 0 and 100.
- `assessment`: one of four discrete categories (`EXCELLENT ARCHITECTURE`, `STRONG FOUNDATION`, `DEVELOPING APPROACH`, `NEEDS REFINEMENT`).
- `sectionReviews`: array containing `sectionId`, `score` (0–10), and non-empty `feedback`.

## Evaluation Approach

The evaluation pipeline follows these operational steps:

1. **Submission Ingestion:** The learner submits their design via `POST /api/attempts/:id/submit`. Any unsaved client responses are persisted immediately.
2. **Context Compilation:** The submission coordinator fetches the attempt, problem title, description, requirements, problem sections, section evaluation criteria, and the learner's responses from the database.
3. **Provider Execution:** The active `AIEvaluator` processes the compiled context.
4. **Structured Generation:** The evaluator generates section-specific feedback and scoring based on the rubric, along with holistic strengths, improvement points, and next problem recommendations.
5. **Atomic Persistence:** Using a Prisma `$transaction`, the system creates `AIReview` and associated `SectionReview` records, updates the `Attempt` status to `REVIEWED`, and records the overall score.
6. **Presentation:** The frontend renders the persisted evaluation on `/attempts/:id`.

### Handling Multiple Valid Solutions

In Low-Level Design, multiple object models can be valid. The evaluation prompts and rubrics evaluate:
- Whether domain entities have cohesive, well-defined responsibilities.
- Whether containment (composition) vs association relationships are modeled correctly.
- Whether state transitions are made explicit and defend against invalid states.
- Whether trade-offs are articulated (e.g., choosing a specific dispatch strategy or spot allocation algorithm).

Feedback focuses on explaining the consequences of design decisions rather than checking against a rigid canonical class diagram.

## Deterministic vs AI Evaluation

A central architectural decision in DesignForge is the division between deterministic logic and model-assisted reasoning:

### Deterministic Responsibilities
- **Data Persistence & Integrity:** Storing attempts, responses, and reviews with foreign keys and cascade rules.
- **Workflow State Transitions:** Transitioning attempt status (`DRAFT` → `IN_PROGRESS` → `SUBMITTED` → `REVIEWED` or `FAILED`).
- **Validation Guards:** Blocking submissions with empty responses; enforcing 1.5s debounced autosave.
- **Idempotency & Concurrency:** Preventing duplicate evaluations on already reviewed attempts.
- **Schema Conformance:** Runtime verification of JSON response shapes via Zod.

### Model-Assisted Responsibilities
- **Qualitative Reasoning:** Evaluating whether class responsibilities violate the Single Responsibility Principle.
- **Trade-off Analysis:** Assessing the justification provided for algorithmic choices (such as LOOK vs SCAN elevator scheduling).
- **Contextual Synthesis:** Identifying key strengths and articulating tailored, actionable recommendations for subsequent design iterations.

## Extensibility

The codebase is structured to accommodate future enhancements with minimal refactoring:

- **Adding AI Providers:** Implement the `AIEvaluator` interface in `lib/services/ai-evaluator.ts` and register the provider key in `getAIEvaluator()`. No route handlers or UI components require changes.
- **Adding Evaluation Strategies:** The service layer can support alternative rubrics (e.g., senior vs junior rubrics, peer review workflows, or weighted section scoring) by parametrizing `EvaluationInput`.
- **Alternative Submission Formats:** The `AttemptResponse` table stores text. Supporting UML markdown, Mermaid diagram syntax, or TypeScript type stubs requires only adding schema validators and updating section editor views.

## Failure and Practical Considerations

### Current Behaviour
- **Synchronous Evaluation:** Evaluation executes inline during the `POST /api/attempts/:id/submit` request.
- **Failure Preservation:** If evaluation fails (e.g., network timeout or external API error), the attempt status is marked as `FAILED` in PostgreSQL. All user responses remain intact in `AttemptResponse`.
- **UI Error Feedback:** The frontend displays an inline error message notifying the user that their responses were saved and allows them to retry submission without data loss.
- **Duplicate Protection:** If a user submits an already `REVIEWED` attempt, the server returns the existing review immediately without re-triggering evaluation.

### Possible Future Improvements
- **Background Worker Queues:** Offloading evaluation to an asynchronous task queue (e.g., BullMQ or Celery with Redis) to handle long-running LLM requests without holding open HTTP connections.
- **Client Polling or Server-Sent Events (SSE):** Streaming evaluation progress indicators to the user interface.
- **Automatic Retries with Exponential Backoff:** Automatically retrying transient provider failures before marking an attempt as failed.

## Key Trade-offs

### 1. Monolithic Next.js Architecture vs. Microservices
- **Choice:** Monolithic application with Next.js App Router and Prisma.
- **Rationale:** A monolithic structure eliminates network hops, serialization overhead, and distributed deployment complexity, allowing rapid, robust feature delivery suitable for this scope.

### 2. Structured Sectional Text vs. Executable Code Sandbox
- **Choice:** Section-based natural language and pseudocode editors.
- **Rationale:** LLD interviews evaluate conceptual decomposition, entity lifecycles, and interface design. Running executable code over-indexes on language syntax and compiler boilerplate while failing to test architectural thinking.

### 3. Hybrid Evaluation with Deterministic Fallback vs. Pure Remote LLM
- **Choice:** Dual-engine architecture with deterministic fallback.
- **Rationale:** External AI APIs can experience rate limits, downtime, or latency. The deterministic rule engine ensures the platform remains 100% functional, testable, and demonstrable offline.

### 4. Relational Database with Granular Entities vs. Single Document Blob
- **Choice:** Normalized PostgreSQL schema (`ProblemSection`, `AttemptResponse`, `SectionReview`).
- **Rationale:** Relational modeling enables section-level scoring, queryable attempt filtering (`ALL`, `REVIEWED`, `IN PROGRESS`, `DRAFTS`), and cascading deletes, preventing orphaned data.

### 5. Focused Practice MVP vs. Full-Featured Learning Management System
- **Choice:** Concentrated focus on the core practice-evaluate-review loop.
- **Rationale:** Prioritizing problem briefs, robust autosave, reliable submission, and explainable scorecards delivers higher pedagogical value than building peripheral LMS features such as forums, user profiles, or leaderboards.
