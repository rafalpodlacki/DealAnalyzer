import { useState, useEffect, useCallback } from "react";
import { calcDeal } from "../utils/calc";
import { saveNewDeal, updateDeal } from "../services/deals";
import { useAuth } from "../contexts/AuthContext";
import ListingParser from "./ListingParser";

const fmt  = (n) => "£" + Math.round(n).toLocaleString("en-GB");
const pct  = (n) => n.toFixed(1) + "%";
const yc   = (y) => y >= 7 ? "#1a7a3c" : y >= 5 ? "#c47d00" : "#b81c1c";

function Field({ label, hint, children }) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block", fontSize:".74rem", fontWeight:600,
        color:"#0f1117", marginBottom:3}}>{label}</label>
      {hint && <div style={{fontSize:".67rem", color:"#6b6860", marginBottom:4}}>{hint}</div>}
      {children}
    </div>
  );
}

function NumInput({ prefix, suffix, value, onChange, ...rest }) {
  return (
    <div style={{position:"relative"}}>
      {prefix && <span style={{
        position:"absolute", left:9, top:"50%", transform:"translateY(-50%)",
        fontSize:".78rem", color:"#6b6860", pointerEvents:"none", fontFamily:"monospace"
      }}>{prefix}</span>}
      <input type="number" value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        {...rest}
        style={{
          width:"100%", padding: prefix ? "7px 8px 7px 20px" : suffix ? "7px 28px 7px 9px" : "7px 9px",
          border:"1px solid #e2e0d8", borderRadius:4, fontSize:".84rem",
          fontFamily:"monospace", background:"#f7f6f2", color:"#0f1117",
          boxSizing:"border-box"
        }} />
      {suffix && <span style={{
        position:"absolute", right:9, top:"50%", transform:"translateY(-50%)",
        fontSize:".78rem", color:"#6b6860", pointerEvents:"none", fontFamily:"monospace"
      }}>{suffix}</span>}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize:".63rem", fontWeight:700, letterSpacing:".12em",
      textTransform:"uppercase", color:"#6b6860",
      borderBottom:"1px solid #e2e0d8", paddingBottom:6,
      marginBottom:12, marginTop:20
    }}>{children}</div>
  );
}

function Metric({ label, value, sub, dark }) {
  return (
    <div style={{
      background: dark ? "#0f1117" : "#fff",
      border:`1px solid ${dark ? "#0f1117" : "#e2e0d8"}`,
      borderRadius:5, padding:"13px 13px 11px"
    }}>
      <div style={{fontSize:".63rem", fontWeight:700, letterSpacing:".1em",
        textTransform:"uppercase", color: dark ? "#888" : "#6b6860", marginBottom:5}}>
        {label}
      </div>
      <div style={{fontFamily:"monospace", fontSize:"1.05rem", fontWeight:700,
        color: dark ? "#fff" : "#0f1117"}}>{value}</div>
      {sub && <div style={{fontSize:".67rem", color: dark ? "#888" : "#6b6860",
        marginTop:2}}>{sub}</div>}
    </div>
  );
}

function WfRow({ label, amount, type, total }) {
  const color = type === "income" ? "#1a7a3c" : type === "cost" ? "#b81c1c" : "#0f1117";
  return (
    <div style={{
      display:"flex", alignItems:"center", padding:"8px 15px",
      borderBottom:"1px solid #e2e0d8",
      background: total ? "#f7f6f2" : "#fff",
      fontWeight: total ? 700 : 400,
    }}>
      <span style={{flex:1, fontSize:".78rem", color:"#0f1117"}}>{label}</span>
      <span style={{fontFamily:"monospace", fontSize: total ? ".9rem" : ".8rem",
        fontWeight:600, color}}>{amount}</span>
    </div>
  );
}

export default function DealAnalyser({ initialInputs, dealId, onSaved }) {
  const { user } = useAuth();
  const [inputs, setInputs]   = useState(initialInputs);
  const [results, setResults] = useState(() => calcDeal(initialInputs));
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(!!dealId);

  const handleExtracted = useCallback((suggested) => {
    setInputs(prev => ({
      ...prev,
      ...(suggested.address    && { address:     suggested.address }),
      ...(suggested.bid        && { bid:          suggested.bid }),
      ...(suggested.gdv        && { gdv:          suggested.gdv }),
      ...(suggested.refurb     && { refurb:       suggested.refurb }),
      ...(suggested.contingency && { contingency: suggested.contingency }),
      ...(suggested.auctionFees && { auctionFees: suggested.auctionFees }),
      ...(suggested.rent       && { rent:         suggested.rent }),
    }));
    setSaved(false);
  }, []);

  const set = (key) => (val) => {
    setInputs(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  useEffect(() => {
    setResults(calcDeal(inputs));
  }, [inputs]);

  useEffect(() => {
    setInputs(initialInputs);
    setSaved(!!dealId);
  }, [initialInputs, dealId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (dealId) {
        await updateDeal(user.uid, dealId, inputs, results);
        onSaved(dealId, inputs, results);
      } else {
        const ref = await saveNewDeal(user.uid, inputs, results);
        onSaved(ref.id, inputs, results);
      }
      setSaved(true);
    } catch(e) {
      alert("Save failed: " + e.message);
    }
    setSaving(false);
  }, [dealId, user.uid, inputs, results, onSaved]);

  const r = results;

  const verdictColor = r.verdict === "DEAL" ? "#1a7a3c"
    : r.verdict === "MARGINAL" ? "#c47d00" : "#b81c1c";
  const verdictBg = r.verdict === "DEAL" ? "#eaf5ee"
    : r.verdict === "MARGINAL" ? "#fff8e6" : "#fdeaea";
  const verdictBorder = r.verdict === "DEAL" ? "#1a7a3c"
    : r.verdict === "MARGINAL" ? "#c47d00" : "#b81c1c";
  const verdictIcon = r.verdict === "DEAL" ? "✅" : r.verdict === "MARGINAL" ? "⚠️" : "🚫";

  return (
    <div style={{display:"grid", gridTemplateColumns:"400px 1fr",
      minHeight:"calc(100vh - 56px)", fontFamily:"'Segoe UI',system-ui,sans-serif"}}>

      {/* ─── SIDEBAR ─── */}
      <div style={{
        background:"#fff", borderRight:"1px solid #e2e0d8",
        padding:"20px 18px", overflowY:"auto"
      }}>
        <ListingParser onExtracted={handleExtracted} />
        {/* Address + Save */}
        <div style={{marginBottom:14}}>
          <Field label="Address / Reference">
            <input type="text" value={inputs.address}
              onChange={e => set("address")(e.target.value)}
              style={{width:"100%", padding:"7px 9px", border:"1px solid #e2e0d8",
                borderRadius:4, fontSize:".84rem", background:"#f7f6f2",
                color:"#0f1117", boxSizing:"border-box"}} />
          </Field>
          <button onClick={handleSave} disabled={saving || saved}
            style={{
              width:"100%", padding:"9px",
              background: saved ? "#e2e0d8" : "#c8410a",
              color: saved ? "#888" : "#fff",
              border:"none", borderRadius:4,
              fontWeight:700, fontSize:".82rem",
              cursor: saving || saved ? "default" : "pointer",
              letterSpacing:".04em"
            }}>
            {saving ? "Saving…" : saved ? "✓ Saved" : dealId ? "Update Deal" : "Save Deal"}
          </button>
        </div>

        <SectionLabel>Property</SectionLabel>
        <Field label="Your Bid">
          <NumInput prefix="£" value={inputs.bid} onChange={set("bid")} step={1000} />
          <input type="range" min={10000} max={200000} step={1000}
            value={inputs.bid} onChange={e => set("bid")(+e.target.value)}
            style={{width:"100%", accentColor:"#c8410a", marginTop:5}} />
          <div style={{display:"flex", justifyContent:"space-between",
            fontSize:".68rem", color:"#6b6860", fontFamily:"monospace"}}>
            <span>£10k</span><span style={{fontWeight:700}}>{fmt(inputs.bid)}</span><span>£200k</span>
          </div>
        </Field>
        <Field label="GDV (After-Refurb Value)">
          <NumInput prefix="£" value={inputs.gdv} onChange={set("gdv")} step={1000} />
        </Field>
        <Field label="Auction / Buyer Fees">
          <NumInput prefix="£" value={inputs.auctionFees} onChange={set("auctionFees")} step={100} />
        </Field>

        <SectionLabel>Refurbishment</SectionLabel>
        <Field label="Refurb Cost">
          <NumInput prefix="£" value={inputs.refurb} onChange={set("refurb")} step={500} />
        </Field>
        <Field label="Contingency">
          <NumInput suffix="%" value={inputs.contingency} onChange={set("contingency")} min={0} max={50} step={1} />
        </Field>

        <SectionLabel>Bridging Loan</SectionLabel>
        <Field label="Bridge LTV">
          <NumInput suffix="%" value={inputs.bridgeLTV} onChange={set("bridgeLTV")} min={50} max={80} step={5} />
        </Field>
        <Field label="Monthly Rate">
          <NumInput suffix="%" value={inputs.bridgeRate} onChange={set("bridgeRate")} min={0.4} max={1.5} step={0.05} />
        </Field>
        <Field label="Arrangement Fee">
          <NumInput suffix="%" value={inputs.arrangeFee} onChange={set("arrangeFee")} min={0} max={3} step={0.25} />
        </Field>
        <Field label="Bridge Term">
          <NumInput suffix="mo" value={inputs.bridgeTerm} onChange={set("bridgeTerm")} min={3} max={24} step={1} />
        </Field>
        <Field label="Bridge Legal + Valuation">
          <NumInput prefix="£" value={inputs.bridgeLegal} onChange={set("bridgeLegal")} step={100} />
        </Field>

        <SectionLabel>Purchase Costs</SectionLabel>
        <Field label="SDLT Rate" hint="Ltd Co: 5% surcharge on all purchases">
          <NumInput suffix="%" value={inputs.sdlt} onChange={set("sdlt")} min={0} max={15} step={0.5} />
        </Field>
        <Field label="Purchase Legal Fees">
          <NumInput prefix="£" value={inputs.legalFees} onChange={set("legalFees")} step={100} />
        </Field>

        <SectionLabel>BTL Refinance</SectionLabel>
        <Field label="Refinance LTV">
          <NumInput suffix="%" value={inputs.refiLTV} onChange={set("refiLTV")} min={50} max={80} step={5} />
        </Field>
        <Field label="Ltd Co BTL Rate (annual)">
          <NumInput suffix="%" value={inputs.refiRate} onChange={set("refiRate")} min={3} max={10} step={0.1} />
        </Field>
        <Field label="Refi Fees (arrangement + legal)">
          <NumInput prefix="£" value={inputs.refiFees} onChange={set("refiFees")} step={250} />
        </Field>

        <SectionLabel>Rental</SectionLabel>
        <Field label="Monthly Rent">
          <NumInput prefix="£" value={inputs.rent} onChange={set("rent")} step={25} />
        </Field>
        <Field label="Annual Running Costs">
          <NumInput prefix="£" value={inputs.runCosts} onChange={set("runCosts")} step={100} />
        </Field>

        <SectionLabel>Target</SectionLabel>
        <Field label="Min Margin on GDV">
          <NumInput suffix="%" value={inputs.targetMargin} onChange={set("targetMargin")} min={5} max={40} step={1} />
        </Field>
      </div>

      {/* ─── RESULTS ─── */}
      <div style={{padding:22, background:"#f7f6f2", overflowY:"auto",
        display:"flex", flexDirection:"column", gap:16}}>

        {/* Verdict */}
        <div style={{
          background:verdictBg, border:`1.5px solid ${verdictBorder}`,
          borderRadius:6, padding:"16px 20px",
          display:"flex", alignItems:"center", justifyContent:"space-between"
        }}>
          <div>
            <div style={{fontSize:"1.05rem", fontWeight:800, color:verdictColor}}>
              {verdictIcon} {r.verdict}
            </div>
            <div style={{fontSize:".76rem", color:"#6b6860", marginTop:3}}>
              Margin {pct(r.marginPct)} · Target {inputs.targetMargin}%
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:".62rem", letterSpacing:".08em",
              textTransform:"uppercase", color:"#6b6860"}}>Max Bid ({inputs.targetMargin}% margin)</div>
            <div style={{fontFamily:"monospace", fontSize:"1.5rem",
              fontWeight:700, color:verdictColor}}>{fmt(r.maxBid)}</div>
          </div>
        </div>

        {/* Key metrics */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
          <Metric dark label="Total Cost" value={fmt(r.totalCost)} sub="all in" />
          <Metric label="Equity Created" value={fmt(r.equityCreated)} sub="GDV − cost" />
          <Metric label="Margin on GDV" value={pct(r.marginPct)} sub={`target: ${inputs.targetMargin}%`} />
          <Metric label="Cash In Day 1" value={fmt(r.cashDay1)} sub="deposit + costs" />
          <Metric label="Cash Left In" value={fmt(r.cashLeftIn)} sub="after refi" />
          <Metric label="Bridge Interest" value={fmt(r.bridgeInt)} sub="rolled-up total" />
        </div>

        {/* Cost waterfall */}
        <div style={{background:"#fff", border:"1px solid #e2e0d8", borderRadius:5, overflow:"hidden"}}>
          <div style={{padding:"10px 15px", background:"#0f1117",
            fontSize:".68rem", fontWeight:700, letterSpacing:".1em",
            textTransform:"uppercase", color:"#fff"}}>Cost Waterfall</div>
          <WfRow label="Purchase Price (bid)"     type="cost"   amount={fmt(inputs.bid)} />
          <WfRow label="Auction / Buyer Fees"     type="cost"   amount={fmt(inputs.auctionFees)} />
          <WfRow label="SDLT"                     type="cost"   amount={fmt(r.sdltAmt)} />
          <WfRow label="Purchase Legal"           type="cost"   amount={fmt(inputs.legalFees)} />
          <WfRow label={`Refurb (inc. ${inputs.contingency}% contingency)`} type="cost" amount={fmt(r.refurbTotal)} />
          <WfRow label="Bridge Arrangement Fee"   type="cost"   amount={fmt(r.arrange)} />
          <WfRow label={`Bridge Interest (${inputs.bridgeTerm} months @ ${inputs.bridgeRate}%/mo)`} type="cost" amount={fmt(r.bridgeInt)} />
          <WfRow label="Bridge Legal + Valuation" type="cost"   amount={fmt(inputs.bridgeLegal)} />
          <WfRow label="Refinance Fees"           type="cost"   amount={fmt(inputs.refiFees)} />
          <WfRow label="TOTAL COST"               total         amount={fmt(r.totalCost)} />
        </div>

        {/* Refi + P&L */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <div style={{background:"#fff", border:"1px solid #e2e0d8", borderRadius:5, overflow:"hidden"}}>
            <div style={{padding:"10px 15px", background:"#0f1117",
              fontSize:".68rem", fontWeight:700, letterSpacing:".1em",
              textTransform:"uppercase", color:"#fff"}}>Refinance Exit</div>
            <WfRow label="GDV"                            type="income" amount={fmt(inputs.gdv)} />
            <WfRow label={`BTL Mortgage (${inputs.refiLTV}% LTV)`} type="cost" amount={fmt(r.mortgage)} />
            <WfRow label="Monthly payment (int-only)"                amount={fmt(r.monthlyMort) + "/mo"} />
            <WfRow label="Equity retained" total                     amount={fmt(inputs.gdv - r.mortgage)} />
          </div>
          <div style={{background:"#fff", border:"1px solid #e2e0d8", borderRadius:5, overflow:"hidden"}}>
            <div style={{padding:"10px 15px", background:"#0f1117",
              fontSize:".68rem", fontWeight:700, letterSpacing:".1em",
              textTransform:"uppercase", color:"#fff"}}>Annual Rental P&amp;L</div>
            <WfRow label="Gross Rent"        type="income" amount={fmt(r.grossRent)} />
            <WfRow label="Mortgage Interest" type="cost"   amount={fmt(r.annualMortInt)} />
            <WfRow label="Running Costs"     type="cost"   amount={fmt(inputs.runCosts)} />
            <WfRow label="Net Cash"          total         amount={fmt(r.netAnnual)} />
          </div>
        </div>

        {/* Yields */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10}}>
          {[
            ["Gross Yield", pct(r.grossYield), r.grossYield],
            ["Net Yield",   pct(r.netYield),   r.netYield],
            ["Cash-on-Cash Return", pct(r.cocReturn), r.cocReturn],
          ].map(([label, val, raw]) => (
            <div key={label} style={{background:"#fff", border:"1px solid #e2e0d8",
              borderRadius:5, padding:"12px 16px",
              display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span style={{fontSize:".78rem", color:"#6b6860"}}>{label}</span>
              <span style={{fontFamily:"monospace", fontSize:"1rem",
                fontWeight:700, color:yc(raw)}}>{val}</span>
            </div>
          ))}
        </div>

        {/* Cash note */}
        <div style={{
          background:"#fdf0ea", border:"1px solid #e8b49a",
          borderRadius:5, padding:"11px 15px",
          fontSize:".76rem", color:"#6b2e0a", lineHeight:1.5
        }}>
          {r.cashLeftIn < 0
            ? `💰 Refi fully recycles your cash and returns ${fmt(Math.abs(r.cashLeftIn))} extra — zero cash locked in.`
            : r.cashLeftIn < 20000
            ? `💰 Only ${fmt(r.cashLeftIn)} of your cash stays locked in after refinance — excellent capital recycling.`
            : `💰 ${fmt(r.cashLeftIn)} of your cash stays locked in after refinance. Lower bid = more cash recycled.`
          }
        </div>
      </div>
    </div>
  );
}
