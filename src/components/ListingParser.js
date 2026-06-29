import { useState } from "react";

const CONDITION_MAP = {
  "move in":      { refurb: 5000,  contingency: 10, label: "Ready to let" },
  "move-in":      { refurb: 5000,  contingency: 10, label: "Ready to let" },
  "good condition":{ refurb: 8000, contingency: 10, label: "Good condition" },
  "well presented":{ refurb: 8000, contingency: 10, label: "Good condition" },
  "modernise":    { refurb: 25000, contingency: 15, label: "Needs modernising" },
  "updating":     { refurb: 25000, contingency: 15, label: "Needs modernising" },
  "renovation":   { refurb: 35000, contingency: 20, label: "Full renovation" },
  "refurbishment":{ refurb: 35000, contingency: 20, label: "Full renovation" },
  "full refurb":  { refurb: 35000, contingency: 20, label: "Full renovation" },
  "project":      { refurb: 40000, contingency: 20, label: "Development project" },
  "development":  { refurb: 40000, contingency: 20, label: "Development project" },
  "uninhabitable":{ refurb: 50000, contingency: 25, label: "Uninhabitable" },
  "derelict":     { refurb: 55000, contingency: 25, label: "Uninhabitable" },
  "auction":      { refurb: 35000, contingency: 20, label: "Auction — assume renovation" },
};

// GDV estimates by beds for Scunthorpe / DN postcodes
// User can override — these are conservative starting points
const GDV_BY_BEDS = { 1: 90000, 2: 115000, 3: 140000, 4: 175000, 5: 210000 };
// Rent estimates by beds (Scunthorpe market)
const RENT_BY_BEDS = { 1: 500, 2: 625, 3: 750, 4: 900, 5: 1100 };

export default function ListingParser({ onExtracted }) {
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [preview, setPreview] = useState(null);

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-allow-browser": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: `You are a UK property data extractor. Extract structured data from property listings.
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
}`,
          messages: [{ role: "user", content: `Extract property data from this listing:\n\n${text}` }]
        })
      });

      const data = await response.json();
      const raw = data.content?.[0]?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      // Derive suggested inputs from extracted data
      const beds = Math.min(Math.max(parsed.beds || 3, 1), 5);
      const gdv  = GDV_BY_BEDS[beds] || 140000;
      const rent = RENT_BY_BEDS[beds] || 750;

      // Detect condition for refurb estimate
      const conditionKey = Object.keys(CONDITION_MAP).find(k =>
        (parsed.condition || "").toLowerCase().includes(k) ||
        text.toLowerCase().includes(k)
      );
      const conditionData = CONDITION_MAP[conditionKey] || { refurb: 25000, contingency: 15, label: "Needs modernising" };

      // Auction fee logic
      const auctionFees = parsed.isAuction
        ? (parsed.auctionFees > 0 ? parsed.auctionFees : 3000)
        : 1500;

      setPreview({
        extracted: parsed,
        suggested: {
          address:     parsed.address,
          bid:         parsed.price || 0,
          gdv,
          auctionFees,
          refurb:      conditionData.refurb,
          contingency: conditionData.contingency,
          rent,
          conditionLabel: conditionData.label,
          beds,
        }
      });
    } catch (e) {
      setError("Could not parse listing. Try including more detail from the listing page.");
    }
    setLoading(false);
  }

  function handleApply() {
    if (!preview) return;
    onExtracted(preview.suggested);
    setText("");
    setPreview(null);
  }

  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #c8410a",
      borderRadius: 6,
      overflow: "hidden",
      marginBottom: 20,
    }}>
      {/* Header */}
      <div style={{
        background: "#c8410a", padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 8
      }}>
        <span style={{fontSize:"1rem"}}>🔍</span>
        <span style={{color:"#fff", fontWeight:700, fontSize:".82rem",
          letterSpacing:".04em"}}>ANALYSE A LISTING</span>
        <span style={{color:"#f4a98a", fontSize:".72rem", marginLeft:"auto"}}>
          Rightmove · Zoopla · OnTheMarket · Auction
        </span>
      </div>

      <div style={{padding:"14px 14px 12px"}}>
        {/* Instructions */}
        <div style={{
          fontSize:".72rem", color:"#6b6860", marginBottom:8,
          lineHeight:1.5
        }}>
          Open the listing → copy everything (Ctrl+A, Ctrl+C on the listing page) → paste below.
          Include the price, address, description, and key features.
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`Paste listing text here…\n\nExample:\n4 Peacock Street, Scunthorpe DN17 2DY\nGuide price: £24,000\n3 bedroom semi-detached house\nFor sale by auction 6 July 2026\nRequires full refurbishment throughout…`}
          rows={6}
          style={{
            width:"100%", border:"1px solid #e2e0d8", borderRadius:4,
            padding:"9px 10px", fontSize:".78rem", fontFamily:"inherit",
            resize:"vertical", background:"#f7f6f2", color:"#0f1117",
            lineHeight:1.5, boxSizing:"border-box"
          }}
        />

        {error && (
          <div style={{
            background:"#fdeaea", border:"1px solid #e88", borderRadius:3,
            padding:"8px 10px", fontSize:".73rem", color:"#b81c1c",
            marginTop:6
          }}>{error}</div>
        )}

        {/* Preview of extracted data */}
        {preview && (
          <div style={{
            background:"#eaf5ee", border:"1px solid #1a7a3c",
            borderRadius:4, padding:"10px 12px", marginTop:8
          }}>
            <div style={{fontSize:".7rem", fontWeight:700, color:"#1a7a3c",
              letterSpacing:".08em", textTransform:"uppercase", marginBottom:6}}>
              ✓ Extracted — review before applying
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 16px",
              fontSize:".76rem", color:"#0f1117"}}>
              <Row label="Address"   val={preview.extracted.address || "—"} />
              <Row label="Price"     val={preview.suggested.bid ? `£${preview.suggested.bid.toLocaleString("en-GB")}` : "Not found"} />
              <Row label="Beds"      val={`${preview.suggested.beds} bed`} />
              <Row label="Type"      val={preview.extracted.type} />
              <Row label="Tenure"    val={preview.extracted.tenure} />
              <Row label="Condition" val={preview.suggested.conditionLabel} />
              <Row label="Refurb est." val={`£${preview.suggested.refurb.toLocaleString("en-GB")}`} />
              <Row label="GDV est."  val={`£${preview.suggested.gdv.toLocaleString("en-GB")}`} />
              <Row label="Rent est." val={`£${preview.suggested.rent}/mo`} />
              <Row label="Auction?"  val={preview.extracted.isAuction ? "Yes" : "No"} />
            </div>
            {preview.extracted.keyFeatures?.length > 0 && (
              <div style={{fontSize:".7rem", color:"#555", marginTop:6}}>
                {preview.extracted.keyFeatures.slice(0,4).join(" · ")}
              </div>
            )}
            <div style={{fontSize:".68rem", color:"#555", marginTop:6, fontStyle:"italic"}}>
              GDV and rent are Scunthorpe/DN area estimates — adjust after applying.
            </div>
          </div>
        )}

        <div style={{display:"flex", gap:8, marginTop:8}}>
          <button
            onClick={handleParse}
            disabled={loading || !text.trim()}
            style={{
              flex:1, padding:"9px",
              background: loading || !text.trim() ? "#e2e0d8" : "#0f1117",
              color: loading || !text.trim() ? "#999" : "#fff",
              border:"none", borderRadius:4, fontWeight:700,
              fontSize:".8rem", cursor: loading || !text.trim() ? "default" : "pointer"
            }}>
            {loading ? "Analysing…" : "Extract Data"}
          </button>

          {preview && (
            <button
              onClick={handleApply}
              style={{
                flex:1, padding:"9px",
                background:"#1a7a3c", color:"#fff",
                border:"none", borderRadius:4, fontWeight:700,
                fontSize:".8rem", cursor:"pointer"
              }}>
              Apply to Calculator →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, val }) {
  return (
    <>
      <span style={{color:"#6b6860", fontWeight:600}}>{label}</span>
      <span style={{fontWeight:500}}>{val}</span>
    </>
  );
}
