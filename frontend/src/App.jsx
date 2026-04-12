import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import AIChatbox from "./components/AIChatbox";
import PlantProfile from "./pages/PlantProfile";

function Plants() {
  return <h1>Plants 🌿</h1>;
}

function Sensor() {
  return <h1>Sensor 📡</h1>;
}

export default function App() {
  return (
    <div className="min-h-screen bg-pink-50 dark:bg-[#12070c] text-gray-900 dark:text-gray-100 transition-colors">
      <BrowserRouter>
        <Routes>
           <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
           
            <Route path="/" element={<Dashboard />} />
            <Route path="/sensor-data" element={<Sensor />} />
            <Route path="/plant-profile" element={<PlantProfile />} />
          </Route>
        </Routes>

        {/* GLOBAL AI CHATBOX */}
        <AIChatbox />
      </BrowserRouter>
    </div>
  );
}