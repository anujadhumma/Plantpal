import { Link } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import bannerImg from "../assets/Picture-bg-plants1.jpg";

export default function Navbar() {
  return (
    <div>
      {/* Main navigation bar */}
      <nav className="bg-white/70 dark:bg-[#0d1f12]/80 backdrop-blur-md border-b border-green-200 dark:border-white/10 px-8 py-4 flex justify-between items-center transition-colors shadow-sm">

        {/* Left side navigation links */}
        <div className="flex gap-8 items-center">
          <Link
            to="/"
            className="text-lg font-semibold text-green-800 dark:text-green-300 hover:text-green-600 transition-colors tracking-wide"
          >
            Home
          </Link>

          {/* Vertical divider between links */}
          <div className="h-5 w-px bg-green-400 dark:bg-green-700" />

          <Link
            to="/plant-profile"
            className="text-lg font-semibold text-green-800 dark:text-green-300 hover:text-green-600 transition-colors tracking-wide"
          >
            My Plants
          </Link>
        </div>

        {/* Centered app title */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="text-3xl font-extrabold text-green-800 dark:text-green-300 tracking-wide">
            PlantPal 🌿
          </span>
        </div>

        {/* Right side profile menu */}
        <ProfileMenu />
      </nav>

      {/* Banner image below the navbar */}
      <div className="w-full overflow-hidden" style={{ height: "150px" }}>
        <img
          src={bannerImg}
          alt="PlantPal banner"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}