import { X, Camera } from "lucide-react";

export default function ProfileModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[500px] p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500"
        >
          <X />
        </button>

        {/* Avatar */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-bold text-xl">
              {user.name?.[0]}
            </div>

            <button className="absolute bottom-0 right-0 bg-pink-500 text-white p-2 rounded-full shadow">
              <Camera size={16} />
            </button>
          </div>

          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>

        {/* Form */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-gray-600">Full Name</label>
            <input
              className="w-full border rounded-lg p-2 mt-1 bg-gray-100"
              value={user.name}
              disabled
            />
            <p className="text-xs text-gray-400">Name cannot be changed here</p>
          </div>

          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              className="w-full border rounded-lg p-2 mt-1 bg-gray-100"
              value={user.email}
              disabled
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Username</label>
            <input
              className="w-full border rounded-lg p-2 mt-1"
              placeholder="Enter a username"
            />
          </div>

          <button className="w-full bg-pink-500 text-white py-3 rounded-xl">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
