import express, { type Express } from "express"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "client")
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the client build directory: ${distPath}. Run npm run build first.`,
    )
  }

  app.use(express.static(distPath))

  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"))
  })
}
