import { useState } from "react";
import bgImage from "../../assets/plant bg.jpeg";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSignup = (e) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>

      <form className="relative bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-96 space-y-4">
        <h2 className="text-2xl font-semibold text-center">
          Create Account 🌸
        </h2>

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

        <button className="w-full bg-pink-500 text-white p-2 rounded-lg">
          Create Account
        </button>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <a href="/login" className="text-pink-600">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
