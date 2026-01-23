import { createTRPCReact } from "@trpc/react-query";
// Import AppRouter type from server/routers-types
// This file contains ONLY types, no implementation
import type { AppRouter } from "../../../server/routers-types";

export const trpc = createTRPCReact<AppRouter>();
