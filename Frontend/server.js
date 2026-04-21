/**
 * Minimal static file server for production build.
 * Serves built files and falls back to index.html for SPA routing.
 * Must listen on 0.0.0.0 so the app is reachable outside the container.
 */

// c
import { readFileSync, existsSync } from "fs";

const ROOT = ".";
const INDEX = "index.html";

function serve(pathname) {
  const path = pathname === "/" ? INDEX : pathname.replace(/^\//, "");
  const filePath = `${ROOT}/${path}`;
  const contentType = filePath.endsWith(".html") ? "text/html" : "text/plain";
  if (existsSync(filePath)) {
    return new Response(readFileSync(filePath), {
      headers: { "Content-Type": contentType },
    });
  }
  return new Response(readFileSync(`${ROOT}/${INDEX}`), {
    headers: { "Content-Type": "text/html" },
  });
}

Bun.serve({
  port: 3000,
  hostname: "0.0.0.0",
  async fetch(req) {
    const pathname = new URL(req.url).pathname;
    return serve(pathname);
  },
});
