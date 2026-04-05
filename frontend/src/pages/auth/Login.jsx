import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import bgImage from "../../assets/plant bg.jpeg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleLogin = (e) => {
    e.preventDefault();

    setUser({
      name: "Plant User",
      email: email,
    });

    navigate("/");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
      <form
        onSubmit={handleLogin}
        className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl w-96 space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center">Login</h2>

        <input
          className="w-full border rounded-lg p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border rounded-lg p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-pink-500 text-white p-2 rounded-lg">
          Login
        </button>
        <p className="text-sm text-center">
          Don't have an account?{" "}
          <a href="/signup" className="text-pink-600">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}
