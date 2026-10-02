import { jwtVerify, createRemoteJWKSet } from "jose";

// Update this if you ever change Firebase projects
const FIREBASE_PROJECT_ID = "deal-analyzer-fe1f3";

// Only allow requests from your own deployed app (and local dev)
const ALLOWED_ORIGINS = new Set([
  "https://deal-analyzer-fe1f3.web.app",
  "https://deal-analyzer-fe1f3.firebaseapp.com",
  "http://localhost:3000",
]);

// Firebase Auth ID tokens are verifiable against this public JWK set
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

const SYSTEM_PROMPT = `You are a UK property data extractor. Extract structured data from property listings.
Return ONLY a JSON object with these exact keys (no markdown, no explanation):
{
  "address": "full address string or empty string",
  "price": number (asking price or guide price in pounds, 0 if not found),
  "beds": number (1-10, default 3 if not found),
  "type": "terraced" | "semi-detached" | "detached" | "flat" | "bungalow" | "other",
  "tenure": "freehold" | "leasehold" | "unknown",
  "condition": "move-in ready" | "good condition" | "needs modernising" | "full renovation" | "uninhabitable" | "unknown",
  "keyFeatures": ["short feature 1", "short feature 2"],
  "portal": "rightmove" | "zoopla" | "onthemarket" | "auction" | "unknown",
  "isAuction": boolean,
  "auctionFees": number (buyer premium if mentioned, else 0)
}`;

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, headers);
    }

    // Require a valid, signed-in Firebase user
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return json({ error: "Missing auth token" }, 401, headers);
    }
    try {
      await jwtVerify(token, JWKS, {
        issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
        audience: FIREBASE_PROJECT_ID,
      });
    } catch (e) {
      return json({ error: "Invalid or expired auth token" }, 401, headers);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400, headers);
    }

    const text = (body.text || "").trim();
    if (!text) return json({ error: "No listing text provided" }, 400, headers);
    if (text.length > 20000) return json({ error: "Listing text is too long" }, 400, headers);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: `Extract property data from this listing:\n\n${text}` },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const upstreamBody = await anthropicRes.text();
      console.error("Anthropic API error", anthropicRes.status, upstreamBody);
      // Surface the upstream status and error type (never the key) so failures are diagnosable from the browser.
      let upstreamType = "";
      try { upstreamType = JSON.parse(upstreamBody)?.error?.type || ""; } catch {}
      const detail = `Anthropic ${anthropicRes.status}${upstreamType ? `: ${upstreamType}` : ""}`;
      return json({ error: `Failed to reach the extraction service (${detail})` }, 502, headers);
    }

    const data = await anthropicRes.json();
    const raw = data.content?.[0]?.text || "";
    const clean = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error("Could not parse model output:", raw);
      return json({ error: "Could not parse listing data" }, 502, headers);
    }

    return json(parsed, 200, headers);
  },
};
