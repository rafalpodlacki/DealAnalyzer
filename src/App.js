import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import DealList from "./components/DealList";
import DealAnalyser from "./components/DealAnalyser";
import { fetchDeals } from "./services/deals";
import { DEFAULT_INPUTS } from "./utils/calc";

export default function App() {
  const { user, logout } = useAuth();
  const [deals, setDeals]             = useState([]);
  const [activeDeal, setActiveDeal]   = useState(null);
  const [loading, setLoading]         = useState(false);
  const [showDeals, setShowDeals]     = useState(false); // mobile drawer

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchDeals(user.uid)
      .then(d => { setDeals(d); if (d.length > 0) setActiveDeal(d[0]); })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSaved = useCallback((id, inputs, results) => {
    setDeals(prev => {
      const exists = prev.find(d => d.id === id);
      const updated = { id, inputs, results };
      if (exists) return prev.map(d => d.id === id ? updated : d);
      return [updated, ...prev];
    });
    setActiveDeal({ id, inputs, results });
    setShowDeals(false);
  }, []);

  function handleDeleted(id) {
    setDeals(prev => prev.filter(d => d.id !== id));
    setActiveDeal(prev => prev?.id === id ? null : prev);
  }

  if (user === undefined) return (
    <div style={{minHeight:"100vh",background:"#0f1117",display:"flex",
      alignItems:"center",justifyContent:"center",color:"#888",
      fontFamily:"system-ui"}}>Loading…</div>
  );

  if (!user) return <Login />;

  const currentInputs = activeDeal?.inputs || DEFAULT_INPUTS;
  const currentId     = activeDeal?.id || null;

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",minHeight:"100vh"}}>
      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-drawer-open { display: flex !important; }
          .main-grid { grid-template-columns: 1fr !important; }
          .header-sub { display: none !important; }
          .header-email { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-deals-btn { display: none !important; }
          .mobile-drawer { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{background:"#0f1117",color:"#fff",padding:"0 16px",
        height:52,display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:100}}>
        <span style={{fontWeight:700,fontSize:"1rem"}}>🏠 Deal Analyser</span>
        <span className="header-sub" style={{fontSize:".72rem",color:"#555",fontFamily:"monospace",flex:1}}>
          Bridge → Refurb → Refi → Hold
        </span>
        <span style={{flex:1}} className="mobile-only" />
        <span style={{fontSize:".65rem",color:"#444",fontFamily:"monospace",
          background:"#1a1d26",padding:"2px 6px",borderRadius:3}}>v1.2.0</span>
        <span className="header-email" style={{fontSize:".72rem",color:"#888"}}>{user.email}</span>

        {/* Mobile deals button */}
        <button className="mobile-deals-btn" onClick={()=>setShowDeals(true)}
          style={{background:"#c8410a",color:"#fff",border:"none",borderRadius:4,
            padding:"6px 12px",fontSize:".75rem",fontWeight:700,cursor:"pointer"}}>
          📋 Deals ({deals.length})
        </button>

        <button onClick={logout} style={{background:"none",border:"1px solid #333",
          color:"#888",borderRadius:3,padding:"4px 8px",fontSize:".7rem",cursor:"pointer",
          whiteSpace:"nowrap"}}>
          Sign out
        </button>
      </div>

      {/* Mobile deals drawer */}
      {showDeals && (
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex"}}>
          <div style={{background:"#fff",width:"85%",maxWidth:340,
            display:"flex",flexDirection:"column",boxShadow:"4px 0 20px rgba(0,0,0,.3)"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #e2e0d8",
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontWeight:700,fontSize:".9rem"}}>Saved Deals</span>
              <button onClick={()=>setShowDeals(false)}
                style={{background:"none",border:"none",fontSize:"1.2rem",cursor:"pointer",color:"#888"}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:"auto"}}>
              {loading
                ? <div style={{padding:20,color:"#aaa",fontSize:".78rem"}}>Loading…</div>
                : <DealList deals={deals} activeDealId={currentId}
                    onSelect={d=>{setActiveDeal(d);setShowDeals(false);}}
                    onNew={()=>{setActiveDeal(null);setShowDeals(false);}}
                    onDeleted={handleDeleted} />
              }
            </div>
          </div>
          <div style={{flex:1,background:"rgba(0,0,0,.5)"}} onClick={()=>setShowDeals(false)} />
        </div>
      )}

      {/* Body */}
      <div className="main-grid" style={{display:"grid",gridTemplateColumns:"220px 1fr",
        height:"calc(100vh - 52px)"}}>

        {/* Desktop sidebar */}
        <div className="desktop-sidebar" style={{borderRight:"1px solid #e2e0d8",
          overflowY:"auto",background:"#fff"}}>
          {loading
            ? <div style={{padding:20,color:"#aaa",fontSize:".78rem"}}>Loading deals…</div>
            : <DealList deals={deals} activeDealId={currentId}
                onSelect={setActiveDeal} onNew={()=>setActiveDeal(null)}
                onDeleted={handleDeleted} />
          }
        </div>

        {/* Main content */}
        <div style={{overflowY:"auto"}}>
          <DealAnalyser key={currentId||"new"} initialInputs={currentInputs}
            dealId={currentId} onSaved={handleSaved} />
        </div>
      </div>
    </div>
  );
}
