# device-manager Monorepo Architecture

## Overview

This document describes the refactored monorepo architecture that fixes the **tRPC × Vite × Vercel** deployment issues by properly separating shared types from server implementation.

## Problem Statement

**Before refactoring**, the admin frontend was directly importing from `server/routers.ts`:

```typescript
// ❌ BAD: Vite tries to bundle server implementation
import { AppRouter } from "../../../server/routers";
```

This caused Vercel builds to fail because:
1. Vite attempted to bundle Node.js dependencies (firebase-admin, drizzle-orm)
2. Browser-incompatible modules were pulled into the bundle
3. Type resolution conflicts and lockfile corruption

## Solution: Type-Only Shared Package

### Architecture

```
device-manager/
├── packages/
│   └── api/                    ← Type-only package
│       ├── src/
│       │   ├── schemas.ts      ← Zod schemas (no implementation)
│       │   └── index.ts        ← Type exports only
│       ├── dist/               ← Built types (.d.ts files)
│       ├── package.json        ← @repo/api workspace package
│       └── tsconfig.json       ← Standalone TypeScript config
│
├── admin/                      ← React + Vite frontend
│   ├── src/
│   │   └── lib/
│   │       └── trpc.ts         ← Imports AppRouter type from server/routers-types
│   ├── vercel.json             ← Simplified: pnpm --filter admin build
│   └── package.json
│
├── server/                     ← Node + tRPC backend
│   ├── routers.ts              ← Imports schemas from @repo/api
│   ├── routers-types.ts        ← Type-only AppRouter definition
│   ├── _core/
│   │   ├── firebase.ts
│   │   ├── trpc.ts
│   │   └── ...
│   └── db.ts
│
├── pnpm-workspace.yaml         ← Workspace configuration
├── package.json                ← Root dependencies
└── tsconfig.json               ← Root TypeScript config
```

### Key Principles

**1. Type/Implementation Separation**

- `packages/api/` contains **ONLY** types and schemas
  - ✅ zod schemas
  - ✅ tRPC type definitions
  - ✅ Shared DTOs
  - ❌ NO firebase-admin, drizzle-orm, or Node dependencies

- `server/routers.ts` contains implementation
  - ✅ Firebase/Firestore logic
  - ✅ Database queries
  - ✅ Business logic
  - ✅ Imports from @repo/api for schemas

**2. Import Flow**

```
admin/src/lib/trpc.ts
  ↓
  imports AppRouter type from server/routers-types.ts
  ↓
  server/routers-types.ts imports schemas from @repo/api
  ↓
  @repo/api (zod schemas only)
```

**3. Vercel Build Flow**

```
Vercel receives: pnpm --filter admin build

1. pnpm install --frozen-lockfile (workspace-aware)
   - Installs all dependencies including @repo/api
   - Builds @repo/api (TypeScript → .d.ts)

2. pnpm --filter admin build
   - Vite bundles admin code
   - Imports AppRouter type from server/routers-types
   - Resolves types from @repo/api (no implementation)
   - ✅ No firebase-admin, drizzle-orm in bundle
```

## File Descriptions

### packages/api/package.json

```json
{
  "name": "@repo/api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  }
}
```

- Workspace package with `@repo/` namespace
- Exports types only
- No external dependencies (only zod, @trpc/server)

### packages/api/src/schemas.ts

Contains all zod schemas:
- Auth: `registerInputSchema`, `loginInputSchema`, `authRegisterOutputSchema`, etc.
- Users: `getUserInputSchema`, `updateUserRoleInputSchema`, etc.
- Devices: `createDeviceInputSchema`, `updateDeviceStatusInputSchema`, etc.
- Rental History: `recordRentalInputSchema`, `returnRentalInputSchema`, etc.

### server/routers-types.ts

**Purpose**: Provide AppRouter type to admin without importing implementation.

```typescript
import * as schemas from "@repo/api";

export const appRouterType = t.router({
  auth: t.router({
    register: t.procedure
      .input(schemas.registerInputSchema)
      .output(schemas.authRegisterOutputSchema)
      .mutation(async () => ({})),
    // ... other procedures
  }),
  // ... other routers
});

export type AppRouter = typeof appRouterType;
```

**Key**: Uses tRPC's type inference without actual implementation.

### server/routers.ts

**Purpose**: Actual implementation with Firebase/Firestore logic.

```typescript
import * as schemas from "@repo/api";

export const appRouter = router({
  auth: router({
    register: publicProcedure
      .input(schemas.registerInputSchema)
      .output(schemas.authRegisterOutputSchema)
      .mutation(async ({ input, ctx }) => {
        // Real implementation
        const user = await db.createUserWithPassword(...);
        return { user };
      }),
    // ... other procedures
  }),
  // ... other routers
});

export type AppRouter = typeof appRouter;
```

### admin/src/lib/trpc.ts

```typescript
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers-types";

export const trpc = createTRPCReact<AppRouter>();
```

**Key**: Imports type from `routers-types`, not `routers`.

### admin/vercel.json

```json
{
  "buildCommand": "pnpm --filter admin build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install --frozen-lockfile"
}
```

- Simple, monorepo-aware configuration
- Vercel runs admin build only
- pnpm handles workspace dependencies automatically

### pnpm-workspace.yaml

```yaml
packages:
  - "packages/*"
```

- Registers `packages/api` as a workspace package
- Enables `workspace:*` references in package.json

## TypeScript Configuration

### packages/api/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

- Standalone configuration (not extending root)
- Generates `.d.ts` files for type distribution
- NodeNext module resolution for proper ESM support

## Build Process

### Local Development

```bash
# Install all dependencies
pnpm install

# Build @repo/api types
cd packages/api && pnpm build

# Run dev servers
pnpm dev:server      # Node.js tRPC server
pnpm dev:admin       # React + Vite frontend
pnpm dev:metro       # React Native Expo
```

### Vercel Deployment

```bash
# Vercel executes:
pnpm install --frozen-lockfile
pnpm --filter admin build

# Result:
# - @repo/api built automatically
# - admin bundled with type-only imports
# - No server implementation in bundle
```

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Vite Bundle** | Includes firebase-admin, drizzle-orm | Only @repo/api types |
| **Vercel Build** | Fails due to Node dependencies | Succeeds with clean build |
| **Type Safety** | ✅ | ✅ (improved) |
| **Code Sharing** | ❌ Coupled | ✅ Decoupled |
| **Maintenance** | Complex | Simple |

## Migration Guide

### For New Procedures

1. **Define schema in packages/api/src/schemas.ts**

```typescript
export const myInputSchema = z.object({ /* ... */ });
export const myOutputSchema = z.object({ /* ... */ });
```

2. **Add to server/routers-types.ts for type inference**

```typescript
myProcedure: t.procedure
  .input(schemas.myInputSchema)
  .output(schemas.myOutputSchema)
  .mutation(async () => ({})),
```

3. **Implement in server/routers.ts**

```typescript
myProcedure: protectedProcedure
  .input(schemas.myInputSchema)
  .output(schemas.myOutputSchema)
  .mutation(async ({ input, ctx }) => {
    // Real implementation
  }),
```

4. **Use in admin**

```typescript
// Already works! Type is inferred from AppRouter
const result = await trpc.myProcedure.useMutation();
```

## Troubleshooting

### "@repo/api not found"

```bash
# Solution: Rebuild packages/api
cd packages/api && pnpm build
pnpm install
```

### TypeScript errors in admin

```bash
# Solution: Ensure routers-types.ts is up to date
# and packages/api/dist/ exists
npm run check
```

### Vercel build fails

```bash
# Check vercel.json uses pnpm --filter admin build
# Ensure pnpm-workspace.yaml exists
# Verify packages/api/package.json has proper exports
```

## Future Improvements

1. **Shared UI Components**: Move React components to `packages/ui/`
2. **E2E Testing**: Use `packages/e2e/` for integration tests
3. **Documentation**: Auto-generate API docs from schemas
4. **Type Generation**: Consider tRPC code generation for client

## References

- [tRPC Monorepo Guide](https://trpc.io/docs/server/adapters/standalone)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Vercel Monorepo Support](https://vercel.com/docs/concepts/monorepos)
- [Vite Module Resolution](https://vitejs.dev/guide/ssr.html#module-resolution)
