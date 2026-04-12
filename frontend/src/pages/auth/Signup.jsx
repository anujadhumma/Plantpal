import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import bgImage from "../../assets/plant bg.jpeg";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", username: "" });
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
        data: { name: form.name, username: form.username },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate("/");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      <div className="relative z-10 w-[420px]">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 border-2 border-green-300 shadow-lg mb-3">
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide drop-shadow">PlantPal</h1>
          <p className="text-green-200 text-sm mt-1">Your smart plant care companion</p>
        </div>

        <form
          onSubmit={handleSignup}
          className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl space-y-4 border border-green-100"
        >
          <h2 className="text-xl font-semibold text-center text-green-900">Create Account 🌸</h2>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-xl">
              {error}
            </p>
          )}

          <div>
            <label className="text-sm text-gray-600 font-medium">Full Name</label>
            <input
              className="w-full border border-green-200 rounded-xl p-3 mt-1 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Your full name"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Username</label>
            <input
              className="w-full border border-green-200 rounded-xl p-3 mt-1 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Choose a username"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Email</label>
            <input
              className="w-full border border-green-200 rounded-xl p-3 mt-1 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Your email"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-medium">Password</label>
            <input
              type="password"
              className="w-full border border-green-200 rounded-xl p-3 mt-1 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Min 6 characters"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl font-semibold transition disabled:opacity-60 shadow-md"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-sm text-center text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-green-600 font-semibold hover:underline">
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}