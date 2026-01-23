/**
 * @repo/api - Type-only package for device-manager
 * 
 * This package contains:
 * - Zod schemas for input/output validation
 * - Shared DTOs and types
 * 
 * ❌ NEVER add implementation here
 * ❌ NEVER import firebase-admin, drizzle-orm, or any Node dependencies
 * ✅ Only types, schemas, and type exports
 */

export * from "./schemas";

// Re-export tRPC types for convenience
export type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
