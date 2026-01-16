import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Parse JSON body with debugging
  app.use((req, res, next) => {
    express.json({ limit: "50mb" })(req, res, (err) => {
      if (err) {
        console.error("[JSON Parse Error]", err);
        return res.status(400).json({ error: "Invalid JSON" });
      }
      console.log("[Parsed Body]", req.body);
      next();
    });
  });
  app.use(express.urlencoded({ limit: "50mb", extended: true }));



  registerOAuthRoutes(app);

  // Auth endpoints
  app.get("/api/auth/me", (req, res) => {
    // Get user from context (requires middleware to set req.user)
    // For now, check if user info is in the session cookie
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return res.status(401).json({ error: "No session cookie found" });
    }

    // Parse cookies
    const cookies = cookieHeader.split(";").reduce((acc: Record<string, string>, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});

    const sessionCookie = cookies["manus-session"];
    if (!sessionCookie) {
      return res.status(401).json({ error: "No session cookie found" });
    }

    try {
      const user = JSON.parse(sessionCookie);
      res.json({ user });
    } catch (error) {
      res.status(401).json({ error: "Invalid session cookie" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("manus-session");
    res.json({ success: true });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // Fallback route for debugging
  app.all("/api/debug", (req, res) => {
    console.log("[Debug Route] Method:", req.method);
    console.log("[Debug Route] Body:", req.body);
    res.json({ method: req.method, body: req.body });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
