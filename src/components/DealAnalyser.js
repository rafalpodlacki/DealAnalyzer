/* eslint-disable react-hooks/exhaustive-deps */
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
      <label style={{display:"block",fontSize:".74rem",fontWeight:600,color:"#0f1117",marginBottom:3}}>{label}</label>
      {hint && <div style={{fontSize:".67rem",color:"#6b6860",marginBottom:4}}>{hint}</div>}
      {children}
    </div>
    </div>
  );
}

function NumInput({ prefix, suffix, value, onChange, ...rest }) {
  return (
    <div style={{position:"relative"}}>
      {prefix && <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:".78rem",color:"#6b6860",pointerEvents:"none",fontFamily:"monospace"}}>{prefix}</span>}
      <input type="number" value={value} onChange={e=>onChange(parseFloat(e.target.value)||0)} {...rest}
        style={{width:"100%",padding:prefix?"7px 8px 7px 20px":suffix?"7px 28px 7px 9px":"7px 9px",border:"1px solid #e2e0d8",borderRadius:4,fontSize:".84rem",fontFamily:"monospace",background:"#f7f6f2",color:"#0f1117",boxSizing:"border-box"}} />
      {suffix && <span style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",fontSize:".78rem",color:"#6b6860",pointerEvents:"none",fontFamily:"monospace"}}>{suffix}</span>}
    </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{fontSize:".63rem",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"#6b6860",borderBottom:"1px solid #e2e0d8",paddingBottom:6,marginBottom:12,marginTop:20}}>{children}</div>;
}

function Metric({ label, value, sub, dark }) {
  return (
    <div style={{background:dark?"#0f1117":"#fff",border:`1px solid ${dark?"#0f1117":"#e2e0d8"}`,borderRadius:5,padding:"13px 13px 11px"}}>
      <div style={{fontSize:".63rem",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:dark?"#888":"#6b6860",marginBottom:5}}>{label}</div>
      <div style={{fontFamily:"monospace",fontSize:"1.05rem",fontWeight:700,color:dark?"#fff":"#0f1117"}}>{value}</div>
      {sub && <div style={{fontSize:".67rem",color:dark?"#888":"#6b6860",marginTop:2}}>{sub}</div>}
    </div>
    </div>
  );
}

function WfRow({ label, amount, type, total }) {
  const color = type==="income"?"#1a7a3c":type==="cost"?"#b81c1c":"#0f1117";
  return (
    <div style={{display:"flex",alignItems:"center",padding:"8px 15px",borderBottom:"1px solid #e2e0d8",background:total?"#f7f6f2":"#fff",fontWeight:total?700:400}}>
      <span style={{flex:1,fontSize:".78rem",color:"#0f1117"}}>{label}</span>
      <span style={{fontFamily:"monospace",fontSize:total?".9rem":".8rem",fontWeight:600,color}}>{amount}</span>
    </div>
    </div>
  );
}

const STRATEGIES = [
  { id:"bridge",   label:"🏗 Bridge",   sub:"Bridging loan → refurb → refinance" },
  { id:"cash",     label:"💵 Cash",     sub:"Buy cash → refurb → refinance" },
  { id:"mortgage", label:"🏦 Mortgage", sub:"Direct BTL mortgage from day 1" },
];

export default function DealAnalyser({ initialInputs, dealId, onSaved }) {
  const { user } = useAuth();
  const [inputs, setInputs]   = useState(initialInputs);
  const [results, setResults] = useState(() => calcDeal(initialInputs));
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(!!dealId);

  const set = (key) => (val) => { setInputs(prev=>({...prev,[key]:val})); setSaved(false); };

  const handleExtracted = useCallback((suggested) => {
    setInputs(prev=>({...prev,
      ...(suggested.address    && {address:suggested.address}),
      ...(suggested.bid        && {bid:suggested.bid}),
      ...(suggested.gdv        && {gdv:suggested.gdv}),
      ...(suggested.refurb     && {refurb:suggested.refurb}),
      ...(suggested.contingency && {contingency:suggested.contingency}),
      ...(suggested.auctionFees && {auctionFees:suggested.auctionFees}),
      ...(suggested.rent       && {rent:suggested.rent}),
    }));
    setSaved(false);
  }, []);

  useEffect(()=>{ setResults(calcDeal(inputs)); },[inputs]);
  useEffect(()=>{ setInputs(initialInputs); setSaved(!!dealId); },[initialInputs,dealId]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (dealId) { await updateDeal(user.uid,dealId,inputs,results); onSaved(dealId,inputs,results); }
      else { const ref=await saveNewDeal(user.uid,inputs,results); onSaved(ref.id,inputs,results); }
      setSaved(true);
    } catch(e) { alert("Save failed: "+e.message); }
    setSaving(false);
  },[dealId,user.uid,inputs,results,onSaved]);

  const r = results;
  const s = inputs.strategy || "bridge";

  const verdictColor = r.verdict==="DEAL"?"#1a7a3c":r.verdict==="MARGINAL"?"#c47d00":"#b81c1c";
  const verdictBg    = r.verdict==="DEAL"?"#eaf5ee":r.verdict==="MARGINAL"?"#fff8e6":"#fdeaea";
  const verdictIcon  = r.verdict==="DEAL"?"✅":r.verdict==="MARGINAL"?"⚠️":"🚫";

  return (
    <div style={{display:"grid",gridTemplateColumns:"400px 1fr",minHeight:"calc(100vh - 52px)",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>

      {/* ── SIDEBAR ── */}
      <div style={{background:"#fff",borderRight:"1px solid #e2e0d8",padding:"20px 18px",overflowY:"auto"}}>
        <ListingParser onExtracted={handleExtracted} />

        {/* Strategy selector */}
        <SectionLabel>Purchase Strategy</SectionLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:16}}>
          {STRATEGIES.map(st=>(
            <button key={st.id} onClick={()=>set("strategy")(st.id)}
              style={{padding:"10px 6px",border:`2px solid ${s===st.id?"#c8410a":"#e2e0d8"}`,borderRadius:5,background:s===st.id?"#fdf0ea":"#fff",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:".82rem",fontWeight:700,color:s===st.id?"#c8410a":"#0f1117"}}>{st.label}</div>
              <div style={{fontSize:".62rem",color:"#6b6860",marginTop:2,lineHeight:1.3}}>{st.sub}</div>
            </button>
          ))}
        </div>

        {/* Address + Save */}
        <Field label="Address / Reference">
          <input type="text" value={inputs.address} onChange={e=>set("address")(e.target.value)}
            style={{width:"100%",padding:"7px 9px",border:"1px solid #e2e0d8",borderRadius:4,fontSize:".84rem",background:"#f7f6f2",color:"#0f1117",boxSizing:"border-box"}} />
        </Field>
        <button onClick={handleSave} disabled={saving||saved}
          style={{width:"100%",padding:"9px",background:saved?"#e2e0d8":"#c8410a",color:saved?"#888":"#fff",border:"none",borderRadius:4,fontWeight:700,fontSize:".82rem",cursor:saving||saved?"default":"pointer",marginBottom:4}}>
          {saving?"Saving…":saved?"✓ Saved":dealId?"Update Deal":"Save Deal"}
        </button>

        <SectionLabel>Property</SectionLabel>
        <Field label="Your Bid">
          <NumInput prefix="£" value={inputs.bid} onChange={set("bid")} step={1000} />
          <input type="range" min={10000} max={200000} step={1000} value={inputs.bid} onChange={e=>set("bid")(+e.target.value)}
            style={{width:"100%",accentColor:"#c8410a",marginTop:5}} />
          <div style={{display:"flex",justifyContent:"space-between",fontSize:".68rem",color:"#6b6860",fontFamily:"monospace"}}>
            <span>£10k</span><span style={{fontWeight:700}}>{fmt(inputs.bid)}</span><span>£200k</span>
          </div>
        </Field>
        <Field label="GDV (After-Refurb Value)"><NumInput prefix="£" value={inputs.gdv} onChange={set("gdv")} step={1000} /></Field>
        <Field label="Auction / Buyer Fees"><NumInput prefix="£" value={inputs.auctionFees} onChange={set("auctionFees")} step={100} /></Field>

        <SectionLabel>Refurbishment</SectionLabel>
        <Field label="Refurb Cost"><NumInput prefix="£" value={inputs.refurb} onChange={set("refurb")} step={500} /></Field>
        <Field label="Contingency" hint="Light cosmetic: 10% · Full modernisation: 15% · Heavy renovation: 20% · Structural/unknown: 25%+">
          <NumInput suffix="%" value={inputs.contingency} onChange={set("contingency")} min={0} max={50} step={1} />
        </Field>

        {/* ── BRIDGE INPUTS ── */}
        {s==="bridge" && <>
          <SectionLabel>Bridging Loan</SectionLabel>
          <Field label="Bridge LTV"><NumInput suffix="%" value={inputs.bridgeLTV} onChange={set("bridgeLTV")} min={50} max={80} step={5} /></Field>
          <Field label="Monthly Rate"><NumInput suffix="%" value={inputs.bridgeRate} onChange={set("bridgeRate")} min={0.4} max={1.5} step={0.05} /></Field>
          <Field label="Arrangement Fee"><NumInput suffix="%" value={inputs.arrangeFee} onChange={set("arrangeFee")} min={0} max={3} step={0.25} /></Field>
          <Field label="Bridge Term"><NumInput suffix="mo" value={inputs.bridgeTerm} onChange={set("bridgeTerm")} min={3} max={24} step={1} /></Field>
          <Field label="Bridge Legal + Valuation"><NumInput prefix="£" value={inputs.bridgeLegal} onChange={set("bridgeLegal")} step={100} /></Field>
          <SectionLabel>BTL Refinance (Exit)</SectionLabel>
          <Field label="Refinance LTV"><NumInput suffix="%" value={inputs.refiLTV} onChange={set("refiLTV")} min={50} max={80} step={5} /></Field>
          <Field label="Ltd Co BTL Rate (annual)"><NumInput suffix="%" value={inputs.refiRate} onChange={set("refiRate")} min={3} max={10} step={0.1} /></Field>
                    <div style={{background:"#f7f6f2",border:"1px solid #e2e0d8",borderRadius:4,padding:"10px 10px 4px",marginBottom:14}}>
            <div style={{fontSize:".68rem",fontWeight:700,color:"#6b6860",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>
              Refi Fees — Total: {fmt((inputs.refiArrangeFee||0)+(inputs.refiValuation||0)+(inputs.refiLegal||0)+(inputs.refiBroker||0))}
            </div>
            <Field label="Arrangement Fee"><NumInput prefix="£" value={inputs.refiArrangeFee} onChange={set("refiArrangeFee")} step={100} /></Field>
            <Field label="Valuation Fee"><NumInput prefix="£" value={inputs.refiValuation} onChange={set("refiValuation")} step={50} /></Field>
            <Field label="Refi Solicitor Fees" hint="Conveyancing cost for the refinance mortgage"><NumInput prefix="£" value={inputs.refiLegal} onChange={set("refiLegal")} step={100} /></Field>
            <Field label="Broker Fee"><NumInput prefix="£" value={inputs.refiBroker} onChange={set("refiBroker")} step={100} /></Field>
          </div>
        </>
        }

        {/* ── CASH INPUTS ── */}
        {s==="cash" && <>
          <SectionLabel>Refinance (Exit)</SectionLabel>
          <div style={{background:"#eaf5ee",border:"1px solid #1a7a3c",borderRadius:4,padding:"8px 10px",fontSize:".72rem",color:"#1a4a2a",marginBottom:12}}>
            💡 No finance costs during purchase. Refinance after refurb to recycle cash.
          </div>
          <Field label="Refinance LTV"><NumInput suffix="%" value={inputs.refiLTV} onChange={set("refiLTV")} min={50} max={80} step={5} /></Field>
          <Field label="BTL Rate (annual)"><NumInput suffix="%" value={inputs.refiRate} onChange={set("refiRate")} min={3} max={10} step={0.1} /></Field>
                    <div style={{background:"#f7f6f2",border:"1px solid #e2e0d8",borderRadius:4,padding:"10px 10px 4px",marginBottom:14}}>
            <div style={{fontSize:".68rem",fontWeight:700,color:"#6b6860",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8}}>
              Refi Fees — Total: {fmt((inputs.refiArrangeFee||0)+(inputs.refiValuation||0)+(inputs.refiLegal||0)+(inputs.refiBroker||0))}
            </div>
            <Field label="Arrangement Fee"><NumInput prefix="£" value={inputs.refiArrangeFee} onChange={set("refiArrangeFee")} step={100} /></Field>
            <Field label="Valuation Fee"><NumInput prefix="£" value={inputs.refiValuation} onChange={set("refiValuation")} step={50} /></Field>
            <Field label="Refi Solicitor Fees" hint="Conveyancing cost for the refinance mortgage"><NumInput prefix="£" value={inputs.refiLegal} onChange={set("refiLegal")} step={100} /></Field>
            <Field label="Broker Fee"><NumInput prefix="£" value={inputs.refiBroker} onChange={set("refiBroker")} step={100} /></Field>
          </div>
        </>
        }

        {/* ── MORTGAGE INPUTS ── */}
        {s==="mortgage" && <>
          <SectionLabel>BTL Mortgage</SectionLabel>
          <div style={{background:"#fff8e6",border:"1px solid #c47d00",borderRadius:4,padding:"8px 10px",fontSize:".72rem",color:"#6b4400",marginBottom:12}}>
            ⚠️ Direct mortgage requires property to be habitable. Not suitable for heavy refurb or auction.
          </div>
          <Field label="Mortgage LTV"><NumInput suffix="%" value={inputs.mortLTV} onChange={set("mortLTV")} min={50} max={80} step={5} /></Field>
          <Field label="BTL Rate (annual)"><NumInput suffix="%" value={inputs.mortRate} onChange={set("mortRate")} min={3} max={10} step={0.1} /></Field>
          <Field label="Arrangement + Legal Fees"><NumInput prefix="£" value={inputs.mortFees} onChange={set("mortFees")} step={100} /></Field>
        </>}

        <SectionLabel>Purchase Costs</SectionLabel>
        <div style={{background:"#f7f6f2",border:"1px solid #e2e0d8",borderRadius:4,padding:"10px 12px 10px",marginBottom:14}}>
          <div style={{fontSize:".68rem",fontWeight:700,color:"#6b6860",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>SDLT (Stamp Duty) — Auto-calculated</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{fontSize:".72rem",color:"#6b6860",lineHeight:1.5}}>
              Banded Ltd Co rates:<br/>
              5% up to £125k · 7% on £125k–£250k · 10% on £250k–£925k
            </div>
            <div style={{fontFamily:"monospace",fontSize:"1.2rem",fontWeight:700,color:"#0f1117"}}>{fmt(r.sdltAmt)}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:".68rem",color:"#aaa"}}>Override (leave at 5 for auto):</span>
            <div style={{position:"relative",width:70}}>
              <input type="number" value={inputs.sdlt} onChange={e=>set("sdlt")(parseFloat(e.target.value)||0)} min={0} max={15} step={0.5}
                style={{width:"100%",padding:"4px 20px 4px 7px",border:"1px solid #e2e0d8",borderRadius:3,fontSize:".78rem",fontFamily:"monospace",background:"#fff",boxSizing:"border-box",color:"#aaa"}}/>
              <span style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",fontSize:".72rem",color:"#aaa"}}>%</span>
            </div>
          </div>
        </div>
        <Field label="Purchase Solicitor Fees" hint="Conveyancing cost to buy the property"><NumInput prefix="£" value={inputs.legalFees} onChange={set("legalFees")} step={100} /></Field>

        <SectionLabel>Rental</SectionLabel>
        <Field label="Monthly Rent"><NumInput prefix="£" value={inputs.rent} onChange={set("rent")} step={25} /></Field>
        <Field label="Annual Running Costs"><NumInput prefix="£" value={inputs.runCosts} onChange={set("runCosts")} step={100} /></Field>

        <SectionLabel>Target</SectionLabel>
        <Field label="Min Margin on GDV"><NumInput suffix="%" value={inputs.targetMargin} onChange={set("targetMargin")} min={5} max={40} step={1} /></Field>
      </div>

      {/* ── RESULTS ── */}
      <div className="da-results" style={{padding:22,background:"#f7f6f2",overflowY:"auto",display:"flex",flexDirection:"column",gap:16}}>

        {/* Verdict */}
        <div style={{background:verdictBg,border:`1.5px solid ${verdictColor}`,borderRadius:6,padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:"1.05rem",fontWeight:800,color:verdictColor}}>{verdictIcon} {r.verdict}</div>
            <div style={{fontSize:".76rem",color:"#6b6860",marginTop:3}}>
              Margin {pct(r.marginPct)} · Target {inputs.targetMargin}% ·&nbsp;
              <span style={{fontWeight:600}}>
                {s==="bridge"?"Bridge → Refi":s==="cash"?"Cash → Refi":"Direct Mortgage"}
              </span>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:".62rem",letterSpacing:".08em",textTransform:"uppercase",color:"#6b6860"}}>Max Bid ({inputs.targetMargin}% margin)</div>
            <div style={{fontFamily:"monospace",fontSize:"1.5rem",fontWeight:700,color:verdictColor}}>{fmt(r.maxBid)}</div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="da-metric-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          <Metric dark label="Total Cost" value={fmt(r.totalCost)} sub="all in" />
          <Metric label="Equity Created" value={fmt(r.equityCreated)} sub="GDV − cost" />
          <Metric label="Margin on GDV" value={pct(r.marginPct)} sub={`target: ${inputs.targetMargin}%`} />
          <Metric label="Cash In Day 1" value={fmt(r.cashDay1)} sub="deposit + costs" />
          <Metric label="Cash Left In" value={fmt(r.cashLeftIn)} sub="after refi" />
          <Metric label={s==="bridge"?"Bridge Interest":s==="cash"?"Finance Cost":"Mortgage Fees"} value={fmt(r.finCost)} sub="total finance cost" />
        </div>

        {/* Cost waterfall */}
        <div style={{background:"#fff",border:"1px solid #e2e0d8",borderRadius:5,overflow:"hidden"}}>
          <div style={{padding:"10px 15px",background:"#0f1117",fontSize:".68rem",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#fff"}}>Cost Waterfall</div>
          <WfRow label="Purchase Price (bid)" type="cost" amount={fmt(inputs.bid)} />
          <WfRow label="Auction / Buyer Fees" type="cost" amount={fmt(inputs.auctionFees)} />
          <WfRow label="SDLT" type="cost" amount={fmt(r.sdltAmt)} />
          <WfRow label="Purchase Solicitor" type="cost" amount={fmt(inputs.legalFees)} />
          <WfRow label={`Refurb (inc. ${inputs.contingency}% contingency)`} type="cost" amount={fmt(r.refurbTotal)} />
          {s==="bridge" && <>
            <WfRow label="Bridge Arrangement Fee" type="cost" amount={fmt(r.arrange)} />
            <WfRow label={`Bridge Interest (${inputs.bridgeTerm}mo @ ${inputs.bridgeRate}%/mo)`} type="cost" amount={fmt(r.bridgeInt)} />
            <WfRow label="Bridge Legal + Valuation" type="cost" amount={fmt(inputs.bridgeLegal)} />
            <WfRow label="Refi — Arrangement" type="cost" amount={fmt(inputs.refiArrangeFee||0)} />
            <WfRow label="Refi — Valuation" type="cost" amount={fmt(inputs.refiValuation||0)} />
            <WfRow label="Refi — Solicitor" type="cost" amount={fmt(inputs.refiLegal||0)} />
            <WfRow label="Refi — Broker" type="cost" amount={fmt(inputs.refiBroker||0)} />
          </>}
          {s==="cash" && <><WfRow label="Refi — Arrangement" type="cost" amount={fmt(inputs.refiArrangeFee||0)} />
            <WfRow label="Refi — Valuation" type="cost" amount={fmt(inputs.refiValuation||0)} />
            <WfRow label="Refi — Solicitor" type="cost" amount={fmt(inputs.refiLegal||0)} />
            <WfRow label="Refi — Broker" type="cost" amount={fmt(inputs.refiBroker||0)} /></> }
          {s==="mortgage" && <WfRow label="Mortgage Arrangement + Legal" type="cost" amount={fmt(inputs.mortFees)} />}
          <WfRow label="TOTAL COST" total amount={fmt(r.totalCost)} />
        </div>

        {/* Refi + P&L */}
        <div className="da-refi-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{background:"#fff",border:"1px solid #e2e0d8",borderRadius:5,overflow:"hidden"}}>
            <div style={{padding:"10px 15px",background:"#0f1117",fontSize:".68rem",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#fff"}}>
              {s==="mortgage"?"Mortgage":"Refinance Exit"}
            </div>
            <WfRow label="GDV" type="income" amount={fmt(inputs.gdv)} />
            <WfRow label={s==="mortgage"?`Mortgage (${inputs.mortLTV}% LTV)`:`BTL Mortgage (${s==="bridge"?inputs.refiLTV:inputs.refiLTV}% LTV)`} type="cost" amount={fmt(r.mortgage)} />
            <WfRow label="Monthly payment (int-only)" amount={fmt(r.monthlyMort)+"/mo"} />
            <WfRow label="Equity retained" total amount={fmt(inputs.gdv - r.mortgage)} />
          </div>
          <div style={{background:"#fff",border:"1px solid #e2e0d8",borderRadius:5,overflow:"hidden"}}>
            <div style={{padding:"10px 15px",background:"#0f1117",fontSize:".68rem",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#fff"}}>Annual Rental P&amp;L</div>
            <WfRow label="Gross Rent" type="income" amount={fmt(r.grossRent)} />
            <WfRow label="Mortgage Interest" type="cost" amount={fmt(r.annualMortInt)} />
            <WfRow label="Running Costs" type="cost" amount={fmt(inputs.runCosts)} />
            <WfRow label="Net Cash" total amount={fmt(r.netAnnual)} />
          </div>
        </div>

        {/* Yields */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {[["Gross Yield",pct(r.grossYield),r.grossYield],["Net Yield",pct(r.netYield),r.netYield],["Cash-on-Cash",pct(r.cocReturn),r.cocReturn]].map(([label,val,raw])=>(
            <div key={label} style={{background:"#fff",border:"1px solid #e2e0d8",borderRadius:5,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:".78rem",color:"#6b6860"}}>{label}</span>
              <span style={{fontFamily:"monospace",fontSize:"1rem",fontWeight:700,color:yc(raw)}}>{val}</span>
            </div>
          ))}
        </div>

        {/* Cash note */}
        <div style={{background:"#fdf0ea",border:"1px solid #e8b49a",borderRadius:5,padding:"11px 15px",fontSize:".76rem",color:"#6b2e0a",lineHeight:1.5}}>
          {r.cashLeftIn < 0
            ? `💰 ${s==="cash"?"Refi fully recycles your cash purchase and returns":"Refi fully recycles your cash and returns"} ${fmt(Math.abs(r.cashLeftIn))} extra — zero cash locked in.`
            : r.cashLeftIn < 20000
            ? `💰 Only ${fmt(r.cashLeftIn)} of your cash stays locked in after ${s==="mortgage"?"purchase":"refinance"} — excellent capital efficiency.`
            : `💰 ${fmt(r.cashLeftIn)} of your cash stays locked in. ${s==="mortgage"?"Consider refinancing after refurb to recycle capital.":"Lower bid = more cash recycled."}`
          }
        </div>
      </div>
    </div>
    </div>
  );
}
