import { Link } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import bannerImg from "../assets/Picture-bg-plants1.jpg";

export default function Navbar() {
  return (
    <div>
      <nav className="bg-white/70 dark:bg-[#0d1f12]/80 backdrop-blur-md border-b border-green-200 dark:border-white/10 px-8 py-4 flex justify-between items-center transition-colors shadow-sm">
        <div className="flex gap-8">
          <Link
            to="/"
            className="text-lg font-semibold text-green-800 dark:text-green-300 hover:text-green-600 transition-colors tracking-wide"
          >
            Home
          </Link>
          <Link
            to="/plants"
            className="text-lg font-semibold text-green-800 dark:text-green-300 hover:text-green-600 transition-colors tracking-wide"
          >
            My Plants
          </Link>
        </div>
        <ProfileMenu />
      </nav>

      {/* Banner image — exactly below nav, twice the nav height */}
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