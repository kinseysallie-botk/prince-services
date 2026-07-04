import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ALLOWED_DOMAINS = [
  "gutenberg.org",
  "gutendox.com",
  "gutendex.com",
  "openlibrary.org",
  "archive.org",
  "covers.openlibrary.org",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      // Legacy support: build URL from book ID and format
      const bookId = url.searchParams.get("id");
      const format = url.searchParams.get("format") || "html";

      if (!bookId) {
        return new Response(JSON.stringify({ error: "Missing 'url' or 'id' parameter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (format === "text") {
        return fetchAndRespond(`https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.txt`, "text/plain");
      } else {
        return fetchAndRespond(`https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}.html`, "text/html");
      }
    }

    // Validate the target URL
    const decoded = decodeURIComponent(targetUrl);
    const targetUrlObj = new URL(decoded);

    const isAllowed = ALLOWED_DOMAINS.some(domain => targetUrlObj.hostname.endsWith(domain));
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "Domain not allowed. Only book services are permitted." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return fetchAndRespond(decoded, null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function fetchAndRespond(url: string, forceContentType: string | null): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BookProxy/1.0)",
        "Accept": "*/*",
      },
    });

    if (!response.ok) {
      // Try alternate URL pattern for Gutenberg text
      if (url.includes("gutenberg.org") && url.endsWith(".txt")) {
        const match = url.match(/\/(\d+)\/pg\d+\.txt$/);
        if (match) {
          const bookId = match[1];
          const altUrl = `https://www.gutenberg.org/files/${bookId}/${bookId}-0.txt`;
          const altResponse = await fetch(altUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; BookProxy/1.0)" },
          });
          if (altResponse.ok) {
            const text = await altResponse.text();
            return new Response(text, {
              status: 200,
              headers: {
                ...corsHeaders,
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "public, max-age=86400",
              },
            });
          }
        }
      }

      return new Response(JSON.stringify({ error: `Failed to fetch: ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = response.headers.get("content-type") || forceContentType || "application/octet-stream";
    const content = await response.text();

    return new Response(content, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (fetchErr) {
    const message = fetchErr instanceof Error ? fetchErr.message : "Fetch failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
