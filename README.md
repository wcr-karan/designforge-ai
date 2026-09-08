# DesignForge

<!-- Project Screenshot -->
![DesignForge Preview](./public/preview.png)
Link - https://designforge-ai-vyq7.vercel.app/

DesignForge is an interactive Low-Level Design (LLD) practice platform where learners can select structured design problems, submit their architectural solutions, receive explainable evaluation feedback, and review previous attempts. The application guides users through sectional decomposition, focusing on object modeling, responsibility boundaries, state coordination, and design trade-offs.

## Features

- Curated problem catalog featuring four low-level design challenges: Parking Lot, Elevator System, Vending Machine, and Library Management.
- Modular workspace with problem-specific guidance, sub-sections, and evaluation criteria.
- Automatic draft saving with a 1.5-second debounce window alongside an explicit manual draft save option.
- Attempt lifecycle management supporting unfinished draft resumption and duplicate submission prevention.
- Hybrid evaluation service delivering explainable feedback, section-by-section scores, strengths, improvement recommendations, and next problem suggestions.
- Attempts dashboard with status filtering across all, reviewed, in-progress, and draft attempts.

## Tech Stack

- Framework: Next.js 16 (App Router, Server Actions, Route Handlers)
- Core: React 19, TypeScript
- Styling: Vanilla CSS design tokens with Tailwind CSS utility support
- Database & ORM: PostgreSQL with Prisma ORM 6
- Validation: Zod 4
- Testing: Vitest 5

## Getting Started

### Prerequisites

- Node.js (v20 or v24 recommended)
- PostgreSQL running locally or remotely
- pnpm (v10) or npm

### Installation & Setup

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Initialize the database schema and seed the initial problem data:

```bash
pnpm exec prisma db push
pnpm run seed
```

4. Start the local development server:

```bash
pnpm dev
```

The application will be accessible at `http://localhost:3000`.

## Environment Variables

The project uses the following environment variables defined in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/designforge?schema=public"
AI_PROVIDER="mock"
GEMINI_API_KEY=""
OPENAI_API_KEY=""
```

`AI_PROVIDER` accepts `mock`, `gemini`, or `openai`. Only the configured provider requires its corresponding API key. If left as `mock`, the platform uses a built-in deterministic heuristic evaluator that runs locally without external network dependencies.

## Key Design Decisions

- Monolithic Architecture: Built as a single Next.js application with a clean internal separation of route handlers, domain services, and database utilities to avoid distributed systems overhead.
- Relational Domain Model: Models entities across `Problem`, `ProblemSection`, `Attempt`, `AttemptResponse`, `AIReview`, and `SectionReview` with foreign keys and cascade constraints to ensure data integrity.
- Attempt Persistence and Resumption: Attempts track operational states (`DRAFT`, `IN_PROGRESS`, `SUBMITTED`, `REVIEWED`, `FAILED`), allowing users to leave and resume active drafts seamlessly.
- Provider Abstraction: Evaluation logic is encapsulated behind an `AIEvaluator` interface, isolating LLM API calls from UI and database layers.
- Runtime Schema Enforcement: All evaluation outputs are validated against strict Zod schemas before being committed to PostgreSQL, preventing malformed model outputs from reaching storage.

## Testing

Run the automated test suite using Vitest:

```bash
pnpm test
```

The test suite covers:
- Request and schema validation for attempts, responses, and AI review outputs.
- Evaluator behavior, scoring thresholds, and section review generation.
- End-to-end attempt lifecycle, response persistence, draft updates, submission validation, and duplicate submission guards.

## Build

To compile a production build:

```bash
pnpm run build
pnpm start
```

## Limitations

- The current catalog is limited to the four initial MVP problems.
- User accounts and authentication are not yet implemented; attempts are currently associated with the local session.
- Submissions accept structured natural language and pseudocode rather than executable code compilation.
- Remote LLM evaluations may introduce slight variance compared to the deterministic evaluation engine.

## AI Usage

AI-assisted development tools were utilized during the engineering process. A detailed account of where and how AI was used, prompt design, structured output validation, and system boundaries is documented in:

[AI_USAGE.md](./AI_USAGE.md),
[Research & Technical Decisions](./RESEARCH.md),
[DESIGN.md](./DESIGN.md).
