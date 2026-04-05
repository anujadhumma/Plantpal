import { useState } from "react";
import { X, Moon, Bell } from "lucide-react";

export default function SettingsModal({ onClose }) {
  const [dark, setDark] = useState(false);

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1a0f14] dark:text-white rounded-2xl shadow-xl w-[600px] p-8 relative">
        {/* close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 dark:text-gray-300"
        >
          <X />
        </button>

        <h2 className="text-2xl font-semibold mb-6">Settings</h2>

        <div className="space-y-6">
          {/* Dark mode */}
          <div className="bg-gray-100 dark:bg-white/5 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Moon className="text-pink-500" />
              <h3 className="font-semibold">Appearance</h3>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p>Dark Mode</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Switch between light and dark theme
                </p>
              </div>

              <button
                onClick={toggleDark}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition ${
                  dark ? "bg-pink-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition ${
                    dark ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-gray-100 dark:bg-white/5 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Bell className="text-pink-500" />
              <h3 className="font-semibold">Notifications</h3>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Notification settings coming soon
            </p>
          </div>

          <button className="w-full bg-pink-500 text-white py-3 rounded-xl">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
