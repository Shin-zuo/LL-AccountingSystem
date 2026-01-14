import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";

const app = express();
const httpServer = createServer(app);

// Enable proxy trust to ensure cookies work if behind a local proxy
app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

(async () => {
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));

  // Setup session middleware
  const pgStore = connectPg(session);
  app.use(session({
    store: new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false, // Ensure the 'sessions' table exists in your DB manually or set this to true once
      tableName: "sessions",
      ttl: 7 * 24 * 60 * 60 * 1000, // 1 week
    }),
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // STRICTLY FALSE for local production builds (Windows/LAN)
      // Only set to true if you are on HTTPS (SSL)
      secure: process.env.NODE_ENV === "production" && process.env.HTTPS === "true",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Use lax for development network access
    },
  }));

  // Logging Middleware (Optimized)
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    // Only capture response body in Development to prevent slowness in Production
    if (process.env.NODE_ENV !== "production") {
      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };
    }

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        // Do not log the body in production
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    // 1. Try using the imported serveStatic first
    serveStatic(app);

    // 2. SAFETY NET: If serveStatic doesn't handle the SPA wildcard, add it here.
    // This fixes "refresh loop" or 404s on page reload.
    app.use(express.static(path.join(process.cwd(), "dist", "public")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "public", "index.html"));
    });
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  
  // Removed 'reusePort' which causes issues on Windows
  const server = httpServer.listen(
    {
      port,
      host: "0.0.0.0", 
    },
    () => {
      log(`serving on port ${port}`);
    }
  );

  server.keepAliveTimeout = 120 * 1000; // 120 seconds
  server.headersTimeout = 120 * 1000;   // 120 seconds
})();