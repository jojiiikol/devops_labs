import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from "fs"

const ROOT = "."
const INDEX = "index.html"

function serve(pathname) {
  const path = pathname === "/" ? INDEX : pathname.replace(/^\//, "")
  const filePath = `${ROOT}/${path}`
  const contentType = filePath.endsWith(".html") ? "text/html" : "text/plain"
  if (existsSync(filePath)) {
    return new Response(readFileSync(filePath), {
      headers: { "Content-Type": contentType },
    })
  }
  return new Response(readFileSync(`${ROOT}/${INDEX}`), {
    headers: { "Content-Type": "text/html" },
  })
}

describe('serve function', () => {
  it('serves root as index.html', async () => {
    const response = await serve("/")
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toContain("text/html")
  })

  it('serves static files when they exist', async () => {
    const response = await serve("/index.html")
    expect(response.status).toBe(200)
  })

  it('falls back to index.html for unknown paths', async () => {
    const response = await serve("/unknown/path")
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("text/html")
  })

  it('handles paths without leading slash', async () => {
    const response = await serve("index.html")
    expect(response.status).toBe(200)
  })
})