// One-time setup for Nexa's images: sign in to Puter in your browser,
// then this saves PUTER_AUTH_TOKEN into backend/.env.
// Run from the backend folder:  npm run puter:login
import { createRequire } from "module"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const require = createRequire(import.meta.url)
const { getAuthToken } = require("@heyputer/puter.js/src/init.cjs")
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env")

console.log("Opening Puter in your browser. Sign in (or create a free account) and come back here…")
const token = await getAuthToken()
if (!token) {
  console.log("No token received.")
  process.exit(1)
}

let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : ""
env = /^PUTER_AUTH_TOKEN=.*$/m.test(env)
  ? env.replace(/^PUTER_AUTH_TOKEN=.*$/m, `PUTER_AUTH_TOKEN=${token}`)
  : `${env.replace(/\n*$/, "\n")}\n# Nexa images (Puter)\nPUTER_AUTH_TOKEN=${token}\n`
fs.writeFileSync(envPath, env)
console.log("Saved PUTER_AUTH_TOKEN to backend/.env. Restart the backend to use it.")
process.exit(0)
