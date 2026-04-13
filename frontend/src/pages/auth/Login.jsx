import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";
import bgImage from "../../assets/plant bg.jpeg";

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword]               = useState("");
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const navigate                              = useNavigate();
  const { setUser }                           = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let emailToUse = emailOrUsername;

    // If input is not an email, look up the email by username
    if (!emailOrUsername.includes("@")) {
      const { data, error: lookupError } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", emailOrUsername)
        .single();

      if (lookupError || !data) {
        setError("No account found with that username.");
        setLoading(false);
        return;
      }
      emailToUse = data.email;
    }

    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Store user in context and redirect to home
    setUser(data.user);
    navigate("/");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      <div className="relative z-10 w-[420px]">

        {/* Logo and app name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 border-2 border-green-300 shadow-lg mb-3">
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide drop-shadow">PlantPal</h1>
          <p className="text-green-200 text-sm mt-1">Your smart plant care companion</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl space-y-4 border border-green-100"
        >
          <h2 className="text-xl font-semibold text-center text-green-900">Welcome!</h2>

          {/* Error message shown on failed login */}
          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-xl">
              {error}
            </p>
          )}

          <div>
            <label className="text-sm text-gray-600 font-medium">Email or Username</label>
            <input
              className="w-full border border-green-200 rounded-xl p-3 mt-1 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Enter email or username"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Password</label>
            <input
              className="w-full border border-green-200 rounded-xl p-3 mt-1 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl font-semibold transition disabled:opacity-60 shadow-md"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-sm text-center text-gray-600">
            Don't have an account?{" "}
            <a href="/signup" className="text-green-600 font-semibold hover:underline">
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}