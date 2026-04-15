import { X, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SettingsModal({ onClose }) {
  const { dark, toggleDark } = useAuth();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="bg-white dark:bg-[#0d1f12] dark:text-white rounded-2xl shadow-xl w-[600px] p-8 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 dark:text-gray-300">
          <X />
        </button>

        <h2 className="text-2xl font-semibold mb-6 text-green-900 dark:text-white">Settings</h2>

        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Moon className="text-green-600" />
              <h3 className="font-semibold text-green-900 dark:text-white">Appearance</h3>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-green-900 dark:text-white">Dark Mode</p>
                <p className="text-sm text-green-700 dark:text-green-400">Switch between light and dark theme</p>
              </div>

              <button
                onClick={toggleDark}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition ${dark ? "bg-green-600" : "bg-gray-300"}`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition ${dark ? "translate-x-6" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}