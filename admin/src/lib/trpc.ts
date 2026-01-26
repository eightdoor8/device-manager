import { createTRPCReact } from "@trpc/react-query";
// Import AppRouter type from server/routers-types
// This file contains ONLY types, no implementation
// Using @repo/server path alias from admin/tsconfig.app.json
import type { AppRouter } from "@repo/server/routers-types";

// Use type casting to satisfy tRPC's Router constraint
// The actual type structure is defined in routers-types.ts
export const trpc = createTRPCReact<AppRouter & { _def: any; createCaller: any }>();

// Export type for use in other files
export type { AppRouter };
