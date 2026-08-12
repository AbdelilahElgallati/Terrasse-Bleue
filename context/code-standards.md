# Terrasse Bleue — Code Standards

## General Rules

- TypeScript strict mode where practical.
- Prefer clear, boring code over clever abstractions.
- Keep functions focused.
- Avoid duplicated business rules.
- Validate external input.
- Never trust values coming from the mobile client.
- Never hard-code secrets.
- Do not silently ignore errors.
- Do not introduce dependencies without a reason.

## Naming

Use:

```text
camelCase       variables/functions
PascalCase      classes/components/types
UPPER_SNAKE     constants when appropriate
kebab-case      file names when appropriate
```

Examples:

```text
createOrder()
OrderService
ProductCard
ORDER_STATUS
```

## Backend

Controllers should be thin.

Prefer:

```text
Controller
   ↓
Service
   ↓
Prisma
```

Business rules belong in services/domain logic, not controllers.

## Database

- Use UUIDs unless there is a specific reason not to.
- Use timestamps.
- Use foreign keys.
- Use indexes for frequently queried relationships/status fields where justified.
- Preserve order snapshots for product name/price at purchase time.

Never calculate the authoritative order total from the client-provided total.

## API

Use consistent responses and HTTP status codes.

Examples:

```text
201 Created
200 OK
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error
```

## Mobile

Separate:

```text
UI
server state
local state
API calls
```

Use:

- TanStack Query for server state
- Zustand for local/cart state

Avoid storing the complete backend cache in Zustand.

## React Components

Prefer small reusable components:

```text
ProductCard
CategoryCard
CartItem
OrderStatus
QuantitySelector
Button
Input
```

Avoid huge screen components containing all business logic.

## Error States

Every network-dependent screen should have appropriate:

- loading state
- empty state
- error state
- retry behavior where useful

## Security

Never log:

- passwords
- access tokens
- refresh tokens
- card information
- payment secrets

## Dependencies

Before adding a package:

1. Check whether existing dependencies already solve the problem.
2. Check compatibility with the current stack.
3. Prefer well-maintained packages.
4. Avoid adding a package for a trivial helper.

## Git Commits

Prefer:

```text
feat: add authentication
feat: add product API
feat: add cart
feat: add order creation
fix: prevent invalid order transitions
refactor: extract order pricing service
docs: update setup instructions
```

Do not mix unrelated features in one commit.

## Definition of Good Code

Good code for this project is:

- understandable
- testable
- secure enough for its stage
- easy to modify
- not over-engineered
