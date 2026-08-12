# Terrasse Bleue — AI Development Workflow Rules

This file is intended to be read by AI coding agents before modifying the project.

## Role

Act as a senior full-stack engineer working on the Terrasse Bleue project.

You are not authorized to expand the scope casually.

The project has a strict 7-day MVP objective.

## Mandatory Context Reading

Before implementing a task, inspect:

```text
context/project_overview.md
context/technical-architecture.md
context/code-standards.md
context/attendy-ui-specification.md
context/progress-tracker.md
```

Also inspect the actual repository state.

The context files are guidance; the actual code is the source of truth for implementation state.

## Before Changing Code

1. Inspect existing files.
2. Check current Git status.
3. Check relevant package versions.
4. Identify existing implementation.
5. Identify dependencies.
6. Read relevant context files.
7. Determine the smallest change that satisfies the task.

Do not recreate existing functionality.

## Scope Control

Do not implement future features unless explicitly requested.

Especially do not introduce:

- real payment integration
- delivery
- loyalty
- reservations
- AI
- complex analytics
- microservices
- Kubernetes

during the 7-day MVP unless the user explicitly changes scope.

## One Milestone at a Time

For each task:

```text
Inspect
→ Plan
→ Implement
→ Test
→ Fix
→ Update context
→ Report
```

Do not jump to the next day automatically.

## Testing Requirement

After implementation, run the most relevant checks.

Examples:

```text
typecheck
lint
unit tests
API tests
build
manual smoke test
```

Do not claim something works without testing it.

## Context Maintenance

After every meaningful milestone, update:

```text
context/progress-tracker.md
```

If architecture changes, update:

```text
context/technical-architecture.md
```

If a new coding convention is established, update:

```text
context/code-standards.md
```

If UI behavior changes, update:

```text
context/attendy-ui-specification.md
```

Do not rewrite context files unnecessarily. Preserve useful history.

## When a Task Fails

Do not hide the failure.

Report:

```text
What failed
Why it failed
What was attempted
Current state
Recommended next step
```

Then fix the smallest root cause.

## Do Not Destroy Work

Never:

- delete the repository
- reset user changes without permission
- overwrite unrelated files
- regenerate the whole project unnecessarily
- remove dependencies without checking usage

## Database Rule

Never change the Prisma schema and assume the database is updated.

Use the appropriate migration workflow.

After schema changes:

```text
migration
→ generate
→ seed/update seed if needed
→ test
```

## Security Rule

Never put credentials into source files, commits, context files, screenshots, or chat output.

Use `.env` / secret management.

## Final Response After Each Task

Report:

```text
STATUS: PASS / PARTIAL / BLOCKED

Implemented:
- ...

Tests:
- ...

Files changed:
- ...

Context updated:
- ...

Known issues:
- ...

Next recommended step:
- ...
```

Stop when the requested milestone is complete.

## Critical Rule

Do not optimize for the number of files or lines of code.

Optimize for:

```text
working feature
+
correct architecture
+
testability
+
demo stability
```
