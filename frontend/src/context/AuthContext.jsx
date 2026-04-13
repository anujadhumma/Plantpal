import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [dark, setDark]       = useState(false);

  useEffect(() => {
    // Check for an existing session on app load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for login and logout events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Sign out and reset dark mode
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDark(false);
    document.documentElement.classList.remove("dark");
  };

  // Toggle dark mode class on the root html element
  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  // Show a loading screen while checking the session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#d4edda]">
        <p className="text-green-600 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, dark, toggleDark }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);