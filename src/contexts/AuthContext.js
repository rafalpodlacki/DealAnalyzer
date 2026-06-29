import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "../firebase";

const AuthContext = createContext(null);

// Email whitelist – add your email(s) here
const ALLOWED_EMAILS = [
  // e.g. "you@example.com"
  // Add allowed emails here, or remove the check below to allow any Google account
];

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [error, setError]     = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u && ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(u.email)) {
        signOut(auth);
        setUser(null);
        setError("Access denied. Your email is not on the whitelist.");
      } else {
        setUser(u || null);
        setError(null);
      }
    });
  }, []);

  const login  = () => signInWithPopup(auth, provider).catch(e => setError(e.message));
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
