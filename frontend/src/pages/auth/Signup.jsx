import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import bgImage from "../../assets/plant bg.jpeg";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name }, // saved to profiles table via the trigger
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Account created — send them to login
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>

      <form
        onSubmit={handleSignup}
        className="relative bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-96 space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center">Create Account 🌸</h2>

        {error && (
          <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
            {error}
          </p>
        )}

        <input
          className="w-full border rounded-lg p-2"
          placeholder="Full Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="w-full border rounded-lg p-2"
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          className="w-full border rounded-lg p-2"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button
          disabled={loading}
          className="w-full bg-pink-500 text-white p-2 rounded-lg disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <a href="/login" className="text-pink-600">Login</a>
        </p>
      </form>
    </div>
  );
}