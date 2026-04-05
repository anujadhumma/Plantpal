import { Link } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";

export default function Navbar() {
  return (
    <nav className="bg-white dark:bg-[#1a0f14] border-b dark:border-white/10 px-6 py-3 flex justify-between transition-colors">
      <div className="flex gap-4">
        <Link to="/">Dashboard</Link>
        <Link to="/plants">Plants</Link>
      </div>

      <ProfileMenu />
    </nav>
  );
}
