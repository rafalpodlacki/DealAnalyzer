import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, error } = useAuth();
  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"#0f1117", fontFamily:"'Segoe UI',system-ui,sans-serif"
    }}>
      <div style={{
        background:"#1a1d26", border:"1px solid #2a2d3a", borderRadius:8,
        padding:"48px 40px", maxWidth:380, width:"100%", textAlign:"center"
      }}>
        <div style={{fontSize:"2rem", marginBottom:12}}>🏠</div>
        <h1 style={{color:"#fff", fontSize:"1.3rem", fontWeight:700, marginBottom:6}}>
          Deal Analyser
        </h1>
        <p style={{color:"#888", fontSize:".82rem", marginBottom:32}}>
          Bridge → Refurb → Refi → Hold
        </p>
        {error && (
          <div style={{
            background:"#3a1a1a", border:"1px solid #c83232", borderRadius:4,
            color:"#f88", padding:"10px 14px", fontSize:".78rem", marginBottom:16
          }}>{error}</div>
        )}
        <button onClick={login} style={{
          background:"#c8410a", color:"#fff", border:"none", borderRadius:4,
          padding:"12px 28px", fontWeight:700, fontSize:".9rem", cursor:"pointer",
          width:"100%", letterSpacing:".04em"
        }}>
          Sign in with Google
        </button>
        <p style={{color:"#555", fontSize:".7rem", marginTop:20}}>
          Deals saved to your account only
        </p>
      </div>
    </div>
  );
}
