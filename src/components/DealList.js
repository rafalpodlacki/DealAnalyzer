import { useState } from "react";
import { deleteDeal } from "../services/deals";
import { useAuth } from "../contexts/AuthContext";

const fmt = (n) => "£" + Math.round(n).toLocaleString("en-GB");

export default function DealList({ deals, activeDealId, onSelect, onNew, onDeleted }) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(null);

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm("Delete this deal?")) return;
    setDeleting(id);
    await deleteDeal(user.uid, id);
    setDeleting(null);
    onDeleted(id);
  }

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%"}}>
      <div style={{
        padding:"14px 16px", borderBottom:"1px solid #e2e0d8",
        display:"flex", alignItems:"center", justifyContent:"space-between"
      }}>
        <span style={{fontSize:".7rem", fontWeight:700, letterSpacing:".1em",
          textTransform:"uppercase", color:"#6b6860"}}>Saved Deals</span>
        <button onClick={onNew} style={{
          background:"#c8410a", color:"#fff", border:"none", borderRadius:3,
          padding:"5px 12px", fontSize:".72rem", fontWeight:700, cursor:"pointer"
        }}>+ New</button>
      </div>

      <div style={{flex:1, overflowY:"auto"}}>
        {deals.length === 0 && (
          <div style={{padding:"24px 16px", color:"#aaa", fontSize:".78rem", textAlign:"center"}}>
            No deals saved yet.<br/>Click <b>+ New</b> to start.
          </div>
        )}
        {deals.map(d => {
          const isActive = d.id === activeDealId;
          const verdict = d.results?.verdict;
          const dot = verdict === "DEAL" ? "#1a7a3c"
                    : verdict === "MARGINAL" ? "#c47d00" : "#b81c1c";
          return (
            <div key={d.id} onClick={() => onSelect(d)}
              style={{
                padding:"12px 16px", borderBottom:"1px solid #e2e0d8",
                background: isActive ? "#fdf0ea" : "#fff",
                borderLeft: isActive ? "3px solid #c8410a" : "3px solid transparent",
                cursor:"pointer", display:"flex", alignItems:"center", gap:10
              }}>
              <span style={{
                width:8, height:8, borderRadius:"50%",
                background: dot, flexShrink:0, marginTop:1
              }} />
              <div style={{flex:1, minWidth:0}}>
                <div style={{
                  fontSize:".8rem", fontWeight:600, color:"#0f1117",
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"
                }}>
                  {d.inputs?.address || "Untitled Deal"}
                </div>
                <div style={{fontSize:".68rem", color:"#6b6860", marginTop:2}}>
                  Bid {fmt(d.inputs?.bid || 0)} · Max {fmt(d.results?.maxBid || 0)}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, d.id)}
                disabled={deleting === d.id}
                style={{
                  background:"none", border:"none", color:"#ccc",
                  cursor:"pointer", fontSize:".9rem", padding:"2px 4px",
                  flexShrink:0
                }}
                title="Delete deal"
              >×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
