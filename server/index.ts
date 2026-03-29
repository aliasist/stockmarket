import express, { type Request, type Response, type NextFunction } from "express"
import { registerRoutes } from "./routes.js"
import { serveStatic } from "./static.js"
import { createServer } from "http"
import path from "path"
import { fileURLToPath } from "url"

/**
 * ESM __dirname / __filename polyfill
 */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const httpServer = createServer(app)

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf
    },
  })
)

app.use(express.urlencoded({ extended: false }))

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  console.log(`${formattedTime} [${source}] ${message}`)
}

app.use((req, res, next) => {
  const start = Date.now()
  const requestPath = req.path

  res.on("finish", () => {
    const duration = Date.now() - start
    if (requestPath.startsWith("/api")) {
      let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`
      if (process.env.NODE_ENV !== "production") {
        const contentLength = res.getHeader("content-length")
        if (contentLength) {
          logLine += ` :: ${contentLength}b`
        }
      }
      log(logLine)
    }
  })

  next()
})

;(async () => {
  // 1. Register API Routes
  await registerRoutes(app)

  // 2. Global Error Handler
  app.use(
    (
      err: unknown,
      _req: Request,
      res: Response,
      next: NextFunction
    ): Response | void => {
      const status =
        (err as any)?.status || (err as any)?.statusCode || 500
      const message =
        (err as any)?.message || "Internal Server Error"

      console.error("Internal Server Error:", err)

      if (res.headersSent) {
        return next(err)
      }

      return res.status(status).json({ message })
    }
  )

  // 3. Frontend setup
  if (process.env.NODE_ENV === "production") {
    serveStatic(app)
  } else {
    const { setupVite } = await import("./vite.js")
    await setupVite(httpServer, app)
  }

  // 4. Server Initialization
  const port = parseInt(process.env.PORT || "5000", 10)
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`)
    }
  )
})()
