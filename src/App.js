import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import DealList from "./components/DealList";
import DealAnalyser from "./components/DealAnalyser";
import { fetchDeals } from "./services/deals";
import { DEFAULT_INPUTS } from "./utils/calc";

export default function App() {
  const { user, logout } = useAuth();
  const [deals, setDeals]         = useState([]);
  const [activeDeal, setActiveDeal] = useState(null); // { id, inputs }
  const [loading, setLoading]     = useState(false);

  // undefined = still checking auth
  if (user === undefined) return (
    <div style={{minHeight:"100vh", background:"#0f1117", display:"flex",
      alignItems:"center", justifyContent:"center", color:"#888",
      fontFamily:"system-ui"}}>Loading…</div>
  );
  if (!user) return <Login />;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setLoading(true);
    fetchDeals(user.uid)
      .then(d => { setDeals(d); if (d.length > 0) setActiveDeal(d[0]); })
      .finally(() => setLoading(false));
  }, [user.uid]);

  function handleNew() {
    setActiveDeal(null);
  }

  function handleSelect(deal) {
    setActiveDeal(deal);
  }

  // Called by DealAnalyser after save/update
  const handleSaved = useCallback((id, inputs, results) => {
    setDeals(prev => {
      const exists = prev.find(d => d.id === id);
      const updated = { id, inputs, results };
      if (exists) return prev.map(d => d.id === id ? updated : d);
      return [updated, ...prev];
    });
    setActiveDeal({ id, inputs, results });
  }, []);

  function handleDeleted(id) {
    setDeals(prev => prev.filter(d => d.id !== id));
    setActiveDeal(prev => prev?.id === id ? null : prev);
  }

  const currentInputs = activeDeal?.inputs || DEFAULT_INPUTS;
  const currentId     = activeDeal?.id || null;

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif", minHeight:"100vh"}}>
      {/* Header */}
      <div style={{
        background:"#0f1117", color:"#fff", padding:"0 20px",
        height:52, display:"flex", alignItems:"center", gap:16
      }}>
        <span style={{fontWeight:700, fontSize:"1rem", letterSpacing:".02em"}}>
          🏠 Deal Analyser
        </span>
        <span style={{fontSize:".75rem", color:"#555", fontFamily:"monospace", flex:1}}>
          Bridge → Refurb → Refi → Hold
        </span>
        <span style={{fontSize:".68rem", color:"#444", fontFamily:"monospace", background:"#1a1d26", padding:"2px 7px", borderRadius:3}}>v1.2.0</span>
        <span style={{fontSize:".75rem", color:"#888"}}>{user.email}</span>
        <button onClick={logout} style={{
          background:"none", border:"1px solid #333", color:"#888",
          borderRadius:3, padding:"4px 10px", fontSize:".72rem",
          cursor:"pointer"
        }}>Sign out</button>
      </div>

      {/* Body: list + analyser */}
      <div style={{display:"grid", gridTemplateColumns:"220px 1fr",
        height:"calc(100vh - 52px)"}}>

        {/* Deals list */}
        <div style={{borderRight:"1px solid #e2e0d8", overflowY:"auto",
          background:"#fff"}}>
          {loading
            ? <div style={{padding:20, color:"#aaa", fontSize:".78rem"}}>Loading deals…</div>
            : <DealList
                deals={deals}
                activeDealId={currentId}
                onSelect={handleSelect}
                onNew={handleNew}
                onDeleted={handleDeleted}
              />
          }
        </div>

        {/* Analyser */}
        <div style={{overflowY:"auto"}}>
          <DealAnalyser
            key={currentId || "new"}
            initialInputs={currentInputs}
            dealId={currentId}
            onSaved={handleSaved}
          />
        </div>
      </div>
    </div>
  );
}
