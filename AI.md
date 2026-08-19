# AI-Assisted Development Notes

This repository was implemented with AI assistance, as explicitly allowed by the exercise.

The goal of AI usage was not to delegate the entire task blindly, but to accelerate implementation while keeping the solution simple, correct, and reviewable. All AI-generated output was reviewed manually, tested locally, and adjusted when needed.

## Tools used

The main tools used during development were:

* **Codex** - used as a coding agent during the initial project setup and implementation workflow.
* **Antigravity CLI** - used later in the implementation workflow with Claude Sonnet 4.6 as the underlying model.

## General workflow

The project was implemented in **small, controlled iterations** rather than by asking an agent to generate the entire solution in a single step.

The general process was:

1. inspect the task carefully,
2. decide a small next step,
3. write a very specific prompt for the AI agent,
4. let the agent implement only that slice,
5. review the resulting code and test output manually,
6. correct issues either:

   * by writing another precise prompt, or
   * by making small manual changes directly when that was faster and more token-efficient,
7. run verification commands locally,
8. continue to the next iteration.

This approach was chosen deliberately to reduce risk, keep the architecture right-sized, and avoid wasting tokens on very small fixes that could be handled manually in seconds.

## Why the prompts were detailed

The prompts given to the coding agents were intentionally detailed.

This was done to:

* keep the scope of each iteration clear,
* reduce over-engineering,
* keep the solution aligned with the exercise requirements,
* reinforce the employer's priorities:

  * simplicity,
  * conciseness,
  * adherence to standards,
  * practicality,
  * right-sized design,
  * tested behavior.

Detailed prompts improved the first-pass quality of larger changes.

However, after receiving code from an agent, **small corrections were often handled manually** instead of spending more tokens on another AI round-trip.

## Token-efficient working style

A deliberate effort was made to use AI **economically**.

The working principle was:

* use AI for larger structured tasks,
* use human review and direct manual edits for small, local fixes.

Examples of manual or near-manual follow-up adjustments include:

* correcting the final **path end-cap rotations** after visually checking the rendered map,
* fixing the **continuous road rendering** by updating the path image class usage rather than sending another large frontend prompt,
* refining the **road orientation logic** after visual inspection showed that corners and T-junctions were rotated incorrectly,
* improving API robustness for request bodies such as `null` and arrays,
* adjusting the success message to avoid exposing the internal cabana coordinate ID in user-facing confirmation text,
* cleaning up the server TypeScript configuration,
* adding `prestart` so `npm start` became a true single-entrypoint command, as required by the task.

In other words, AI was used to accelerate implementation, but not for every small change.

## Iteration breakdown

### 1. Initial repository setup and architecture

The first stage focused on selecting a simple architecture and setting up the project structure.

This included:

* Express backend,
* React frontend,
* TypeScript,
* Vite,
* Vitest,
* Supertest,
* React Testing Library.

The aim was to establish a minimal but solid scaffold without over-designing the solution.

### 2. Domain logic and backend foundations

The next stage implemented the backend core:

* parsing `map.ascii`,
* parsing `bookings.json`,
* validating guest room/name pairs,
* representing cabanas from the map,
* storing booking state in memory,
* parsing `--map` and `--bookings` CLI arguments.

This stage also added the first automated domain tests.

### 3. REST API

After the domain layer was stable, the REST API was added:

* `GET /api/map`,
* `POST /api/cabanas/:cabanaId/bookings`.

This stage also included API-level tests and error handling for:

* malformed request bodies,
* malformed JSON,
* unknown cabanas,
* invalid guests,
* already-booked cabanas.

During review, an edge case around destructuring `req.body` was identified and tightened so `null` or non-object JSON bodies returned a proper `400` response instead of risking an unexpected failure.

### 4. Frontend resort map rendering

The placeholder UI was then replaced with a map rendered entirely from the API response.

This included:

* loading state,
* error state,
* resort map grid,
* visual rendering of cabanas, chalets, pools, paths, and empty cells,
* legend,
* path selection logic based on neighbouring `#` cells.

This stage required visual review because correctness depended not only on automated tests but also on the actual orientation of the supplied artwork.

### 5. Path rendering corrections

This was one of the clearest examples of why manual review remained important.

Although the path-rendering logic and tests initially passed, visual inspection of the running application showed that:

* corners were rotated incorrectly,
* T-junctions were rotated incorrectly,
* end caps later needed rotation corrections,
* neighbouring path images had visible seams.

The implementation was refined in several small steps:

* the base orientations of the supplied sprites were re-evaluated,
* the mapping was changed to a clearer explicit connector-set table,
* end-cap rotations were corrected manually,
* path images were made visually continuous by fixing class usage and applying a small CSS overlap.

These changes were guided by screenshots and direct inspection of the running application.

### 6. Booking UI flow

Once the map was visually correct, the complete booking flow was implemented.

This included:

* clickable cabanas,
* a modal booking form,
* room number and guest-name fields,
* client-side structural validation,
* POST booking requests,
* handling of success, invalid guest, already-booked cabana, and network failures,
* immediate local update of cabana availability without a full page reload.

Automated UI tests were added for the user-visible behavior.

A later small manual review also improved dialog behavior while a booking request was in progress.

### 7. Final read-only audit

Before documentation was prepared, a dedicated **read-only AI audit** was performed.

The purpose was to inspect the finished repository like a reviewer rather than make additional changes.

The audit checked:

* compliance with `TASK.md`,
* architecture,
* API behavior,
* CLI behavior,
* tests,
* repository hygiene,
* the employer's stated engineering priorities.

No code changes were allowed during this audit.

The final requirements were then checked manually once more. This caught an important detail around the required **single-entrypoint start command**, which led to adding a `prestart` step so that `npm start` can build and launch the application from a fresh repository state.

## What AI did well

AI assistance was particularly useful for:

* turning the requirements into a staged implementation plan,
* scaffolding the project quickly,
* generating first-pass implementations of larger changes,
* producing broad automated test coverage,
* helping keep each implementation iteration focused,
* performing a final structured code and requirements audit.

## What still required human judgment

Human review remained important for:

* choosing the appropriate architecture size,
* preventing unnecessary abstractions,
* checking that the implementation matched the spirit of the code test,
* validating rendered visuals rather than trusting tests alone,
* detecting incorrect road rotations from screenshots,
* deciding when a fix was small enough to make manually instead of spending more AI tokens,
* verifying that the startup command literally satisfied the wording of the task,
* deciding which late-stage improvements were worth making and which would be unnecessary polish.

## Manual verification performed

AI-generated code was not accepted without verification.

The implementation was repeatedly checked using:

```bash
npm run typecheck
npm test
npm run build
```

Production behavior was also checked using:

```bash
npm start
```

Manual browser testing covered:

* resort map rendering,
* path orientation and continuity,
* booking an available cabana,
* invalid guest handling,
* unavailable cabana behavior,
* booking confirmation,
* immediate availability updates.

The application was also tested after removing the build output to verify that `npm start` works as the required single entrypoint.

## Summary

AI was used as a practical engineering tool, not as an autopilot.

The workflow emphasized:

* narrow implementation iterations,
* detailed prompts for larger tasks,
* manual review after every major step,
* repeated local verification,
* direct human edits for small fixes when another agent interaction would have been unnecessary.

This kept AI usage efficient while still benefiting from fast implementation and broad automated testing.
