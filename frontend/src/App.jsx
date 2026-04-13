import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import AIChatbox from "./components/AIChatbox";
import PlantProfile from "./pages/Plantprofile";

// Placeholder pages for future development
function Plants() {
  return <h1>Plants 🌿</h1>;
}

function Sensor() {
  return <h1>Sensor 📡</h1>;
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#d4edda] dark:bg-[#0d1f12] text-gray-900 dark:text-gray-100 transition-colors">
      <BrowserRouter>
        <Routes>
          {/* Public routes accessible without login */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes require the user to be logged in */}
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

        {/* AI chatbox available on all protected pages */}
        <AIChatbox />
      </BrowserRouter>
    </div>
  );
}