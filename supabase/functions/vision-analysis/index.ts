// Minimal test function
Deno.serve((_req: Request) => {
  return new Response(JSON.stringify({ status: "ok", message: "Function is working!" }), {
    headers: { "Content-Type": "application/json" }
  });
});
