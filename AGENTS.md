# AGENTS.md

This file defines repository-wide working rules for AI coding agents.

The goal is to produce a small, clear, maintainable recruitment code-test solution. Favor correctness, simplicity, and verified behavior over cleverness or feature count.

## 1. Source of Truth

Before implementing or changing behavior:

1. Read `TASK.md`.
2. Inspect the relevant existing code.
3. Inspect the supplied input files or assets when the task depends on them.
4. Base decisions on actual repository contents, not assumptions about what they probably contain.

`TASK.md` is the primary source of truth for product requirements.

Do not modify the supplied task inputs unless explicitly instructed:

* `TASK.md`
* `map.ascii`
* `bookings.json`
* provided files under `assets/`

If implementation and `TASK.md` disagree, follow `TASK.md`.

---

## 2. Recruitment Priorities

The employer explicitly values these qualities:

### Simplicity

Prefer clear, straightforward code over clever or highly abstract solutions.

Use the smallest design that correctly solves the requirement.

### Conciseness

Solve the requested problem directly.

Do not add layers, indirection, configuration, or abstractions without a concrete need.

### Adherence to standards

Use idiomatic TypeScript, Node.js, Express, React, and testing-library conventions.

Prefer conventional framework patterns over custom mechanisms.

### Practicality

Make reasonable engineering trade-offs.

Optimize for code that another engineer can quickly understand, run, test, and maintain.

### Right-sized design

Avoid both extremes:

* oversized "god" files containing unrelated responsibilities;
* unnecessary architecture layers created only for theoretical separation.

Split code when responsibilities are meaningfully different, not simply to create more files.

### Tested behavior

Automated tests must demonstrate important behavior.

Tests are not a checkbox or coverage exercise.

Prioritize observable flows and business rules.

---

## 3. Think Before Coding

Before editing code, determine:

* what requirement is being implemented;
* which files actually need to change;
* what observable behavior defines success;
* what tests can prove that behavior;
* whether a simpler implementation exists.

For a multi-step change, form a short internal plan such as:

1. implement the smallest required behavior;
2. verify it with focused tests;
3. run broader project verification.

Do not begin by creating abstractions.

Do not add code for hypothetical future requirements.

---

## 4. Handling Ambiguity

The recruitment instructions explicitly allow reasonable assumptions.

For minor ambiguity:

1. choose the simplest reasonable interpretation consistent with `TASK.md`;
2. implement consistently;
3. record meaningful assumptions for the final `README.md`.

Do not repeatedly stop implementation to ask about minor unspecified details.

Ask for clarification only when the ambiguity is genuinely blocking, could cause destructive changes, or would substantially alter the required architecture.

Never silently invent additional product requirements.

---

## 5. Keep Changes Surgical

For every task:

* change only files necessary for that task;
* do not refactor unrelated working code;
* do not reformat unrelated files;
* do not rename things merely because another naming style is preferable;
* follow the existing style where one already exists;
* remove imports, variables, or functions made obsolete by your own changes;
* mention unrelated problems rather than fixing them without instruction.

Every meaningful changed line should be explainable by the current requirement.

Do not perform opportunistic cleanup.

---

## 6. Project Architecture

The intended architecture is deliberately small:

* TypeScript throughout;
* Node.js;
* Express REST API;
* React;
* Vite;
* Vitest;
* Supertest for API behavior;
* React Testing Library for UI behavior;
* one root `package.json`.

Current high-level source organization:

```text
src/
├── client/
├── server/
└── shared/
```

Preserve this general architecture unless a concrete requirement in `TASK.md` makes a change necessary.

Before changing the architecture, identify the requirement that cannot be handled cleanly by the current design.

---

## 7. Avoid Overengineering

Do not introduce the following unless `TASK.md` creates a concrete need:

* database
* ORM
* Docker
* microservices
* Redux or another global state framework
* Next.js
* NestJS
* CQRS
* repository pattern
* dependency injection framework
* authentication system
* generic mapper layers
* speculative configuration systems
* plugin architectures
* unnecessary design patterns
* abstractions used only once

Do not create interfaces merely to mirror concrete classes.

Do not introduce factories where normal construction is sufficient.

Do not generalize single-use behavior in anticipation of future requirements.

Prefer ordinary functions and small modules when they solve the problem clearly.

---

## 8. Backend Responsibilities

Keep backend responsibilities explicit and small.

Expected areas include:

* loading and validating supplied data;
* representing resort/cabana state;
* validating guests;
* handling in-memory reservations;
* exposing the required REST API;
* serving the production frontend.

Business rules should not be hidden inside Express route handlers when extracting a small testable function or service makes them clearer.

At the same time, do not create controller/service/repository/mapper layers simply for architectural symmetry.

The authoritative booking state and guest validation belong on the backend.

Do not expose the complete guest registry to the frontend without a requirement to do so.

---

## 9. Frontend Responsibilities

The frontend should:

* request authoritative map and availability information from the API;
* render the resort map using supplied assets;
* collect booking input;
* communicate booking attempts to the API;
* display success and failure states clearly;
* update visible availability after successful booking.

Do not duplicate backend business rules in the frontend.

UI-specific rendering logic may remain in the frontend when appropriate.

Keep component state local unless sharing it is genuinely necessary.

Do not introduce a global state-management library for this task.

---

## 10. Input Data

Do not hard-code facts that can be derived from:

* `map.ascii`
* `bookings.json`

The solution must remain compatible with alternate input files where required by `TASK.md`.

Do not hard-code:

* map dimensions;
* cabana count;
* specific guest names;
* specific room numbers;
* positions of cabanas.

Validate external input at sensible boundaries.

Do not add elaborate defensive handling for scenarios that cannot occur or are irrelevant to the task.

---

## 11. CLI and Runtime

The final application must preserve the runtime behavior required by `TASK.md`, including support for:

```bash
--map <path>
--bookings <path>
```

and the required defaults when those arguments are omitted.

Paths should behave predictably from the process working directory unless the task requires otherwise.

The final application should be straightforward for a reviewer to run.

Aim for a workflow based on conventional commands such as:

```bash
npm install
npm test
npm run build
npm start
```

Do not require multiple manually coordinated production processes if one application process can satisfy the task cleanly.

---

## 12. Testing Strategy

Tests should prove behavior, not implementation details.

### Backend / domain tests

Test meaningful rules such as:

* valid input loading;
* guest validation;
* successful booking;
* rejection of invalid guests;
* rejection of an already occupied cabana;
* availability changing after a booking.

### API tests

Use Supertest for important HTTP behavior such as:

* map retrieval;
* successful reservation;
* validation errors;
* booking conflicts;
* map availability after a reservation.

### UI tests

Use React Testing Library for user-visible flows such as:

* rendering loaded resort data;
* selecting an available cabana;
* interacting with the booking form;
* displaying validation failures;
* successful booking confirmation;
* visible availability updates;
* feedback when an unavailable cabana is selected.

Prefer queries and assertions based on what a user can perceive.

Avoid tests that only assert that a component exists or that an implementation-specific function was called unless that is genuinely meaningful.

Backend and API tests should use the Node test environment.

UI tests that require a browser-like DOM should explicitly use jsdom.

Once real tests exist, `npm test` must fail if no tests are found.

---

## 13. Verification

After a code change, run the smallest relevant verification first.

Before considering an implementation iteration complete, run the appropriate project checks.

Expected final checks include:

```bash
npm run typecheck
npm test
npm run build
```

Do not claim a command passed unless it was actually executed successfully.

If a test fails:

1. read the actual failure;
2. determine the root cause;
3. make the smallest justified correction;
4. rerun the relevant test;
5. rerun broader checks when appropriate.

Do not weaken or delete a valid test just to make the suite pass.

---

## 14. Dependencies

Every dependency must have a concrete purpose.

Before adding one, ask whether the requirement can be solved clearly with:

* the language;
* an existing dependency;
* a small amount of local code.

Do not add a package for trivial functionality.

When adding or removing dependencies, keep `package-lock.json` synchronized.

---

## 15. Error Handling

Handle realistic errors that matter to the required user flow.

Return clear API responses for expected failures.

Do not create elaborate error hierarchies unless they materially improve the implementation.

Do not silently swallow failures.

Do not add handling for impossible scenarios purely to appear defensive.

---

## 16. Documentation and Assumptions

Do not write documentation describing functionality that does not exist yet.

The final `README.md` should reflect the actual completed application and include:

* setup;
* run instructions;
* test instructions;
* relevant architecture notes;
* reasonable assumptions made because the task was ambiguous.

The final `AI.md` must describe the AI-assisted workflow that actually occurred.

Do not fabricate prompts, iterations, test results, or human review actions.

---

## 17. Git

Do not:

* create commits;
* amend commits;
* push changes;
* create branches;
* force-push;
* alter Git history;

unless explicitly requested.

The human operator controls commits and pushes.

You may inspect Git state and diffs when useful.

Before finishing an iteration, report what changed so the human can review it before committing.

---

## 18. Scope Discipline

When instructed to implement one stage, implement that stage only.

Do not continue into later roadmap items merely because they are obvious next steps.

Do not add fancy features beyond `TASK.md`.

Do not optimize prematurely.

Do not perform visual redesign work while implementing backend logic.

Do not turn a small recruitment exercise into a production platform.

---

## 19. Completion Standard

A task is complete only when:

* the requested behavior is implemented;
* relevant automated tests exist where appropriate;
* those tests pass;
* type checking passes when relevant;
* the production build passes when relevant;
* no unrelated changes were introduced;
* no known requirement from the current iteration is silently incomplete.

Before finishing, review the diff and ask:

* Is every change necessary?
* Is there a simpler implementation?
* Did I add an abstraction without a concrete need?
* Can another engineer understand this quickly?
* Are tests proving behavior rather than implementation details?
* Did I implement anything that was not requested?

If unnecessary complexity exists, simplify it before finishing.

---

## 20. End-of-Iteration Report

After each requested implementation iteration, stop and provide a concise report containing:

1. files created or changed;
2. behavior implemented;
3. important assumptions made;
4. tests added or changed;
5. commands actually run and their results;
6. any remaining issue relevant to the requested iteration.

Do not automatically proceed to the next implementation stage.
