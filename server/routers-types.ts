/**
 * Type-only export of AppRouter
 * 
 * This file is used by admin to get the AppRouter type without importing
 * the implementation (which contains firebase-admin, drizzle-orm, etc.)
 * 
 * We export a minimal type definition that mirrors the actual server router
 * without creating a full tRPC instance (which causes issues with reserved keywords).
 */

import { z } from "zod";

// Minimal context type for type inference only
type MinimalContext = {
  user: {
    id: number;
    openId: string;
    email: string | null;
    name: string | null;
    role: "user" | "admin";
  } | null;
};

// Define the AppRouter type as a plain object structure
// This satisfies the tRPC React Query hook requirements
export type AppRouter = {
  system: {
    _def: { queries: {} };
  };
  auth: {
    _def: {
      queries: {
        me: {
          _def: {
            outputs: [z.ZodType<any>];
          };
        };
      };
      mutations: {
        register: {
          _def: {
            inputs: [z.ZodType<any>];
            outputs: [z.ZodType<any>];
          };
        };
        login: {
          _def: {
            inputs: [z.ZodType<any>];
            outputs: [z.ZodType<any>];
          };
        };
        logout: {
          _def: {
            outputs: [z.ZodType<{ success: true }>];
          };
        };
      };
    };
  };
  users: {
    _def: {
      queries: {
        list: {
          _def: {
            outputs: [z.ZodType<any[]>];
          };
        };
        get: {
          _def: {
            inputs: [z.ZodType<any>];
            outputs: [z.ZodType<any>];
          };
        };
      };
      mutations: {
        updateRole: {
          _def: {
            inputs: [z.ZodType<any>];
            outputs: [z.ZodType<any>];
          };
        };
      };
    };
  };
  devices: {
    _def: {
      queries: {
        list: {
          _def: {
            outputs: [z.ZodType<any[]>];
          };
        };
        get: {
          _def: {
            inputs: [z.ZodType<any>];
            outputs: [z.ZodType<any>];
          };
        };
        available: {
          _def: {
            outputs: [z.ZodType<any[]>];
          };
        };
        byUser: {
          _def: {
            inputs: [z.ZodType<any>];
            outputs: [z.ZodType<any[]>];
          };
        };
        csv: {
          _def: {
            outputs: [z.ZodType<string>];
          };
        };
      };
      mutations: {
        create: {
          _def: {
            inputs: [z.ZodType<any>];
            outputs: [z.ZodType<any>];
          };
        };
        updateStatus: {
          _def: {
            inputs: [z.ZodType<any>];
            outputs: [z.ZodType<any>];
          };
        };
        delete: {
          _def: {
            inputs: [z.ZodType<any>];
            outputs: [z.ZodType<any>];
          };
        };
      };
    };
  };
  rentalHistory: {
    _def: {
      queries: {
        list: {
          _def: {
            outputs: [z.ZodType<any[]>];
          };
        };
      };
      mutations: {
        record: {
          _def: {
            inputs: [z.ZodType<any>];
            outputs: [z.ZodType<any>];
          };
        };
        return: {
          _def: {
            inputs: [z.ZodType<any>];
            outputs: [z.ZodType<any>];
          };
        };
        delete: {
          _def: {
            inputs: [z.ZodType<any>];
            outputs: [z.ZodType<any>];
          };
        };
      };
    };
  };
};
