import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProfileModal from "./ProfileModal";
import SettingsModal from "./SettingsModal";
import { User, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!user) return null;

  const name = user.user_metadata?.name ?? "";
  const avatarUrl = user.user_metadata?.avatar_url ?? null;

  return (
    <div className="relative flex items-center">
      {/* Avatar button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-400 shadow-md hover:scale-105 transition-transform"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-300 to-green-500 flex items-center justify-center text-white font-bold text-lg">
            {name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
      </button>

      {/* Dropdown — opens LEFT so it never goes off screen */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed top-16 right-6 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-green-100 dark:border-green-900 rounded-2xl shadow-2xl p-4 z-50">

            <div className="pb-3 border-b border-green-100 dark:border-gray-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-400 flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-300 to-green-500 flex items-center justify-center text-white font-bold">
                    {name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-green-900 dark:text-white text-sm truncate">{name || "PlantPal User"}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{user.email}</p>
              </div>
            </div>

            <div className="py-2 space-y-1">
              <MenuItem
                icon={User}
                label="Profile"
                onClick={() => { setShowProfile(true); setOpen(false); }}
              />
              <MenuItem
                icon={Settings}
                label="Settings"
                onClick={() => { setShowSettings(true); setOpen(false); }}
              />
              
            </div>

            <div className="pt-3 border-t border-green-100 dark:border-gray-700">
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="flex items-center gap-2 text-red-500 w-full p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <LogOut size={18} />
                Log out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ✅ Modals rendered via portal so they always appear on top of everything */}
      {showProfile && ReactDOM.createPortal(
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />,
        document.body
      )}
      {showSettings && ReactDOM.createPortal(
        <SettingsModal onClose={() => setShowSettings(false)} />,
        document.body
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full text-left hover:bg-green-50 dark:hover:bg-green-900/20 text-green-900 dark:text-gray-200 p-2 rounded-xl transition"
    >
      <Icon size={18} className="text-green-600 dark:text-green-400" />
      {label}
    </button>
  );
}