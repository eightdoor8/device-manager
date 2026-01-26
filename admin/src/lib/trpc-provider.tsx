import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { SuperJSON } from "superjson";
import type { ReactNode } from "react";
import { useState } from "react";
import { trpc } from "./trpc";

// Get API URL from environment or use default
const API_URL = (import.meta.env as any).VITE_API_URL || "http://localhost:3000";

console.log('[TRPCProvider] API_URL:', API_URL);

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    (trpc as any).createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
          transformer: SuperJSON as any,
          fetch: async (input, init) => {
            return fetch(input, {
              ...init,
              credentials: 'include',
            });
          },
        }),
      ],
    })
  );

  const TRPCProvider = (trpc as any).Provider;

  return (
    <TRPCProvider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </TRPCProvider>
  );
}
