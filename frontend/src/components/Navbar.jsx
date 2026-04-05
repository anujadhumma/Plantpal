import { Link } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";

export default function Navbar() {
  return (
    <nav className="bg-white border-b px-6 py-3 flex justify-between">
      <div className="flex gap-4">
        <Link to="/">Dashboard</Link>
        <Link to="/plants">Plants</Link>
      </div>

      <ProfileMenu />
    </nav>
  );
}
