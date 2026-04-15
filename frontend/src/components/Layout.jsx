import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import leafBg from "../assets/leaf.avif";
// ↑ If leaf.avif is in /public instead of /src/assets,
//   remove the import above and change the backgroundImage below to:
//   backgroundImage: "url('/leaf.avif')"

export default function Layout() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${leafBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay — light mode: soft white wash, dark mode: deep green tint */}
      <div className="min-h-screen bg-white/50 dark:bg-[#0a1a0f]/75 backdrop-blur-[1px]">
        {!hideNavbar && <Navbar />}
        {/* Removed max-w and padding — each page controls its own layout */}
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}