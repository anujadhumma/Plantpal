import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProfileModal from "./ProfileModal";
import SettingsModal from "./SettingsModal";
import { User, Settings, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 font-semibold"
      >
        {user.name[0]}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a0f14] border border-gray-200 dark:border-white/10 rounded-2xl shadow-lg p-4 text-gray-900 dark:text-gray-100 transition-colors">
          <div className="pb-3 border-b">
            <p className="font-semibold">{user.name}</p>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>

          <div className="py-2 space-y-2">
            <MenuItem
              icon={User}
              label="Profile"
              onClick={() => {
                setShowProfile(true);
                setOpen(false);
              }}
            />

            <MenuItem
              icon={Settings}
              label="Settings"
              onClick={() => {
                setShowSettings(true);
                setOpen(false);
              }}
            />

            <MenuItem icon={HelpCircle} label="Help" />
          </div>

          <div className="pt-3 border-t">
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex items-center gap-2 text-red-500 w-full p-2 rounded-lg hover:bg-red-50"
            >
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showProfile && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full text-left hover:bg-gray-100 p-2 rounded-lg"
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
