/**
 * Minimal static file server for production build.
 * Serves built files and falls back to index.html for SPA routing.
 * Must listen on 0.0.0.0 so the app is reachable outside the container.
 */
const ROOT = ".";
const INDEX = "index.html";

async function serve(pathname) {
  const path = pathname === "/" ? INDEX : pathname.replace(/^\//, "");
  const file = Bun.file(`${ROOT}/${path}`);
  if (await file.exists()) {
    return new Response(file);
  }
  return new Response(Bun.file(`${ROOT}/${INDEX}`), {
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
