# TypeScript Agent Rules

Use this file as the default instruction set for AI agents writing or editing TypeScript code in this project.

## Core Principles

Write TypeScript as if `strict` mode is enabled. Prefer correctness, clarity, maintainability, and explicit domain modeling over clever or overly compact code.

Code should be easy for another developer to read, test, refactor, and debug.

## TypeScript Strictness

Always assume the project uses strict TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

Do not weaken type safety to make code compile.

Avoid:

```ts
any
// @ts-ignore
// @ts-nocheck
as unknown as SomeType
```

Use `unknown` instead of `any` when the value shape is not known yet, then narrow it safely.

```ts
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
```

## Type Design

Prefer precise types that reflect the actual domain.

Use `type` for object shapes, unions, and function signatures unless the project already prefers interfaces.

```ts
type PaymentStatus = 'idle' | 'submitting' | 'success' | 'error'

type PaymentMethod = {
  id: string
  brand: string
  lastFour: string
  isDefault: boolean
}
```

Use discriminated unions for state that can take multiple forms.

```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
```

Avoid nullable fields when a union would model the state more accurately.

## Functions

Prefer small, focused functions with clear names.

Use explicit return types for exported functions, public utilities, reducers, hooks, and functions with non-trivial logic.

```ts
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}
```

Avoid boolean parameters when they make call sites unclear. Prefer named options.

```ts
// Prefer
setChatPosition({ blocked: true, offsetPx: 90 })

// Avoid
setChatPosition(true, 90)
```

## Null and Undefined

Handle `null` and `undefined` intentionally.

Use optional chaining only when missing data is valid and expected.

Use early returns to reduce nesting.

```ts
if (!user) {
  return null
}

return <AccountDetails user={user} />
```

Do not use non-null assertions unless the invariant is guaranteed and documented.

```ts
// Avoid
const element = document.querySelector('#root')!

// Prefer
const element = document.querySelector('#root')

if (!element) {
  throw new Error('Root element was not found')
}
```

## Type Assertions

Avoid type assertions unless there is no better option.

When parsing external data, validate before asserting.

```ts
function getStringField(value: Record<string, unknown>, key: string): string | null {
  const field = value[key]
  return typeof field === 'string' ? field : null
}
```

## React and Next.js Practices

Prefer clear component props types.

```ts
type ProductCardProps = {
  title: string
  price: string
  imageUrl: string
  onSelect: () => void
}

export function ProductCard({ title, price, imageUrl, onSelect }: ProductCardProps) {
  // ...
}
```

Avoid `React.FC` unless the project already uses it consistently.

Keep derived values inline unless memoization is needed for correctness or measurable performance.

Do not use `useMemo` or `useCallback` by default. Use them when:

- Passing stable references to memoized children
- Preventing expensive recalculation
- Avoiding effect dependency churn
- Required by a third-party API

Effects should synchronize with external systems. Do not use effects for simple derived state.

Prefer controlled, predictable data flow over hidden shared mutable state.

## Error Handling

Handle expected failures explicitly.

```ts
try {
  await submitPayment(data)
} catch (error) {
  const message = error instanceof Error ? error.message : 'Something went wrong'
  setErrorMessage(message)
}
```

Never silently swallow errors unless there is a documented reason.

## Async Code

Always `await` promises or intentionally mark them as fire-and-forget with `void`.

```ts
void analytics.track('Payment Started')
```

Use `Promise.all` for independent async work.

Use sequential `await` only when each step depends on the previous result.

## Arrays and Objects

Avoid mutating function inputs.

Prefer immutable updates.

```ts
const updatedItems = items.map((item) =>
  item.id === selectedId ? { ...item, selected: true } : item,
)
```

Use `Record<string, T>` only when keys are truly dynamic.

For known keys, use explicit object types.

## Naming

Use descriptive names that reveal intent.

Avoid vague names like:

```ts
data
obj
item
thing
result
```

These are acceptable only in very small scopes where the meaning is obvious.

Prefer names like:

```ts
paymentMethod
customerProfile
selectedProduct
submitResult
```

Boolean values should read like true/false statements.

```ts
isSubmitting
hasError
canCheckout
shouldShowBanner
```

## Imports and Exports

Prefer named exports for reusable functions, hooks, components, and utilities.

Keep imports organized:

1. Framework/library imports
2. Internal absolute imports
3. Relative imports
4. Type-only imports
5. Styles/assets

Use `import type` for types when appropriate.

```ts
import type { PaymentMethod } from './types'
```

## Comments

Write comments to explain why, not what.

Good comments explain business rules, non-obvious edge cases, browser quirks, or integration constraints.

```ts
// The vendor chat script reads this attribute once when it initializes.
// Keep it in sync before injecting the script.
element.setAttribute('data-chat-blocked', String(isBlocked))
```

Avoid comments that repeat the code.

## Testing Expectations

For non-trivial logic, add or update tests.

Test:

- Branching logic
- Error handling
- Edge cases
- Data transformation
- User-visible behavior

Prefer testing behavior over implementation details.

## Linting and Formatting

Follow the existing project ESLint, Prettier, and TypeScript configuration.

Do not reformat unrelated files.

Do not introduce broad lint disables.

If a lint disable is necessary, scope it to the smallest possible line and explain why.

```ts
// eslint-disable-next-line no-console -- Required for local debugging output in this CLI command.
console.log(result)
```

## Security and Safety

Never hard-code secrets, tokens, API keys, private URLs, or credentials.

Never log sensitive user data.

Validate external input before using it.

Escape or sanitize user-generated content when rendering HTML.

Avoid `dangerouslySetInnerHTML`. If required, document why and sanitize the content first.

## Accessibility

For UI code, use semantic HTML first.

Buttons should be buttons, links should be links.

Interactive elements need accessible names.

Keyboard interaction should work for custom controls.

Do not remove visible focus indicators unless replacing them with an accessible alternative.

## Performance

Prefer simple code first.

Optimize only when there is a clear reason.

Avoid unnecessary renders caused by duplicated state, unstable props, or oversized component responsibilities.

For large lists, consider pagination, virtualization, or memoized row components.

## Agent Behavior Rules

When editing code:

1. Preserve existing project conventions.
2. Make the smallest safe change that solves the problem.
3. Avoid unrelated refactors.
4. Do not introduce new dependencies unless clearly justified.
5. Do not change public APIs unless explicitly requested.
6. Keep type safety strict.
7. Explain important tradeoffs briefly.
8. Flag risky assumptions.
9. Prefer readable code over clever abstractions.
10. Leave the codebase better than you found it.

## Anti-Patterns to Avoid

Avoid:

```ts
let value: any
```

```ts
const user = response as User
```

```ts
// @ts-ignore
```

```ts
useEffect(() => {
  setFullName(`${firstName} ${lastName}`)
}, [firstName, lastName])
```

```ts
function handleThing(data: any) {
  // unclear logic
}
```

Prefer:

```ts
const fullName = `${firstName} ${lastName}`
```

```ts
function handlePaymentMethodAdded(payload: unknown): void {
  if (!isRecord(payload)) {
    return
  }

  const token = getStringField(payload, 'one_time_token')

  if (!token) {
    return
  }

  // Continue with narrowed, safe data.
}
```

## Final Checklist

Before returning code, verify:

- TypeScript strict mode should pass
- No unnecessary `any`
- No unsafe assertions
- Nullish values are handled intentionally
- Functions and variables are clearly named
- Errors are handled or intentionally allowed to bubble
- React hooks follow dependency rules
- Tests are added or updated when logic changes
- No unrelated files were changed
- No secrets or sensitive data were exposed
