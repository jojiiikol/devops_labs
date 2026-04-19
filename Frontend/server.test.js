import { describe, expect, it } from 'vitest'

const ROOT = "."
const INDEX = "index.html"

async function serve(pathname) {
  const path = pathname === "/" ? INDEX : pathname.replace(/^\//, "")
  const file = Bun.file(`${ROOT}/${path}`)
  if (await file.exists()) {
    return new Response(file)
  }
  return new Response(Bun.file(`${ROOT}/${INDEX}`), {
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