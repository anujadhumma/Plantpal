import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  console.log("ProtectedRoute user:", user); // Debugging line to check user state

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}