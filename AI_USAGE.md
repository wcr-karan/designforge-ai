# AI Usage & Evaluation Architecture

This document details where and how Artificial Intelligence is integrated into the DesignForge platform, how evaluations are structured and validated, and the known limitations of automated LLD assessments.

---

## 1. Where AI is Used in the Project

In DesignForge, AI is applied selectively and purposefully in **design solution evaluation**:
- **Location:** The AI integration is isolated exclusively within the server-side service layer (`lib/services/ai-evaluator.ts` and `lib/services/evaluation-service.ts`).
- **Trigger:** Evaluator is invoked exclusively when a user explicitly clicks **SUBMIT DESIGN** on an attempt.
- **Client Isolation:** No AI SDKs, keys, or direct model calls exist within frontend React components. All interactions occur through authenticated server-side API endpoints (`POST /api/attempts/:id/submit`).

---

## 2. AI Evaluation Purpose

Low-Level Design (LLD) is fundamentally about:
- Decomposing requirements into cohesive domain entities.
- Assigning clear responsibilities (Single Responsibility Principle).
- Structuring appropriate relationships (Composition, Aggregation, Association).
- Modeling state machines and transitions.
- Making conscious architectural trade-offs and preserving extensibility (Open/Closed Principle).

Traditional automated testing cannot assess these qualities because they require qualitative reasoning about software structure and intent. The AI evaluator acts as an objective, rubric-driven Senior Staff/Principal Engineer reviewing the candidate's design decisions.

---

## 3. What Information is Sent for Evaluation

To ensure relevant and objective feedback, the evaluation service constructs a structured evaluation payload containing:

1. **Problem Metadata:**
   - Problem Title (e.g., "PARKING LOT")
   - Context Description (the system overview)
   - Specific Functional Requirements (ordered bullet points)
2. **Section Rubrics:**
   - Section Title (e.g., "CLASSES & RESPONSIBILITIES")
   - Section Prompt / Focus (what the user was instructed to design)
   - Evaluation Criteria (the specific LLD concepts, edge cases, and design patterns being evaluated)
3. **User Responses:**
   - The user's submitted natural-language design and pseudo-code mapped strictly to each corresponding section ID.

No private user identifiers, credentials, or irrelevant session details are sent to the evaluator.

---

## 4. Why Structured Output is Used

Unstructured LLM output (freeform markdown or conversational prose) causes severe operational problems in software applications:
- Fragile UI rendering (e.g., unparseable scores or missing sections).
- Inconsistent scoring scales across attempts.
- Vulnerability to conversational drift or sycophantic responses.

DesignForge enforces **Structured JSON Output** matching this schema:

```typescript
{
  overallScore: number, // 0 to 100
  assessment: "EXCELLENT ARCHITECTURE" | "STRONG FOUNDATION" | "DEVELOPING APPROACH" | "NEEDS REFINEMENT",
  designSummary: string,
  whatWorkedWell: Array<{ title: string, description: string }>,
  areasToImprove: Array<{ title: string, description: string }>,
  sectionReviews: Array<{
    sectionId: string,
    score: number, // 0 to 10
    feedback: string
  }>,
  nextProblemRecommendation: {
    problemSlug: string,
    reason: string
  }
}
```

This guarantees that:
- Every section receives an individual numeric score and concrete feedback.
- The UI can reliably render the scorecard, strengths, weaknesses, and section breakdowns without regex parsing.
- Overall score mathematically correlates with section performance.

---

## 5. Validation Approach: The Hybrid Model

To prevent hallucinations or storing malformed payloads, DesignForge implements a multi-tiered validation pipeline:

```
User Submission
      │
      ▼
[1. Deterministic Validation Checks]
  - Rejects empty designs
  - Rejects duplicate submissions on already reviewed attempts
  - Verifies section presence
      │
      ▼
[2. Evaluator Execution]
  - Provider Abstraction (Deterministic Rule Evaluator / Gemini / OpenAI)
  - Temperature set to 0.2 for deterministic, analytical consistency
      │
      ▼
[3. Zod Runtime Schema Validation]
  - AIReviewOutputSchema.parse(rawResult)
  - Enforces numeric boundaries (0-100 overall, 0-10 per section)
  - Validates non-empty strings and array lengths
      │
      ▼
[4. Atomic Database Transaction]
  - Stores AIReview and SectionReviews in PostgreSQL
  - Updates Attempt status to 'REVIEWED'
```

If the external model fails or returns invalid JSON, the system catches the error, marks the attempt safely as `FAILED` (preserving all user inputs), and logs the incident without corrupting state.

---

## 6. Limitations of AI Evaluation

While AI evaluation provides immediate, structured feedback, it has inherent limitations that users and evaluators should understand:

1. **No Real Runtime Execution:** The evaluator assesses design descriptions and architectural intent; it does not compile or execute code against runtime stress tests.
2. **Natural Language Ambiguity:** If a user expresses a correct design with non-standard phrasing or shorthand, the model might assign a lower confidence score than a human interviewer would.
3. **Depth vs. Brevity Trade-off:** LLMs can be biased toward longer responses; DesignForge mitigates this through rubric grounding, but concise yet brilliant designs may require explicit detail to receive full marks.
4. **Context Window Nuances:** The evaluator grades based on the provided brief and requirements; it does not make assumptions about external enterprise infrastructure unless stated.
