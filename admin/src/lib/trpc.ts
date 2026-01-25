import { createTRPCReact } from "@trpc/react-query";
// Import AppRouter type from server/routers-types
// This file contains ONLY types, no implementation
// Using relative path from admin/src/lib to ../../server
import type { AppRouter } from "@repo/server/routers-types";

export const trpc = createTRPCReact<AppRouter>();
