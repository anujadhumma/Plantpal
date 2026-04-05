import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  const location = useLocation();

  const hideNavbar =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="min-h-screen bg-transparent">
      {!hideNavbar && <Navbar />}

      <main className="max-w-6xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
