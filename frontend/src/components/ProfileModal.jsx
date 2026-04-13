import { useState, useRef } from "react";
import { X, Camera } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function ProfileModal({ user, onClose }) {
  if (!user) return null;

  const [name, setName]                   = useState(user.user_metadata?.name ?? "");
  const [email, setEmail]                 = useState(user.email ?? "");
  const [username, setUsername]           = useState(user.user_metadata?.username ?? "");
  const [location, setLocation]           = useState(user.user_metadata?.location ?? "");
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg]                     = useState("");
  const [msgType, setMsgType]             = useState("");
  const [loading, setLoading]             = useState(false);
  const [avatarUrl, setAvatarUrl]         = useState(user.user_metadata?.avatar_url ?? null);
  const fileInputRef                      = useRef(null);

  // Show a timed status message after save or error
  const showMsg = (text, type) => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(""), 4000);
  };

  // Handle profile picture upload to Supabase storage
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMsg("Please select an image file.", "error");
      return;
    }

    setLoading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}.${fileExt}`;

    // Upload image to the avatars storage bucket
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      showMsg(uploadError.message, "error");
      setLoading(false);
      return;
    }

    // Get the public URL of the uploaded image
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    // Save the avatar URL to auth metadata and profiles table
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

    setAvatarUrl(publicUrl);
    showMsg("Profile picture updated!", "success");
    setLoading(false);
  };

  // Save name, email, username and location to Supabase
  const handleSaveProfile = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      email,
      data: { name, username, location },
    });

    if (error) {
      showMsg(error.message, "error");
    } else {
      // Also update the profiles table with the new values
      await supabase
        .from("profiles")
        .update({ name, email, username, location })
        .eq("id", user.id);
      showMsg("Profile updated successfully!", "success");
    }
    setLoading(false);
  };

  // Update the user password after validation
  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      showMsg("Password must be at least 6 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMsg("Passwords do not match.", "error");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      showMsg(error.message, "error");
    } else {
      showMsg("Password changed successfully!", "success");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000]">
      <div className="bg-[#f4faf6] dark:bg-[#0d1f12] rounded-2xl shadow-xl w-[500px] max-h-[90vh] overflow-y-auto p-8 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 dark:text-gray-400">
          <X />
        </button>

        {/* Avatar section with upload button */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-green-300" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-xl">
                {name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}

            {/* Camera button triggers the hidden file input */}
            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow transition"
              disabled={loading}
            >
              <Camera size={16} />
            </button>

            {/* Hidden file input for image selection */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <h2 className="text-xl font-semibold dark:text-white text-green-900">{name || "No name set"}</h2>
          <p className="text-green-700 dark:text-gray-400">{email}</p>
        </div>

        {/* Status message shown after save or error */}
        {msg && (
          <div className={`mt-4 text-sm text-center p-2 rounded-lg ${
            msgType === "success"
              ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {msg}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-sm font-semibold text-green-800 dark:text-green-300 border-b border-green-200 dark:border-green-800 pb-1">
            Profile Info
          </p>

          <div>
            <label className="text-sm text-green-700 dark:text-green-400">Full Name</label>
            <input
              className="w-full border border-green-200 dark:border-green-800 rounded-lg p-2 mt-1 bg-white dark:bg-green-900/20 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-300"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-green-700 dark:text-green-400">Email</label>
            <input
              className="w-full border border-green-200 dark:border-green-800 rounded-lg p-2 mt-1 bg-white dark:bg-green-900/20 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-green-500 mt-1">A confirmation may be sent to your new email</p>
          </div>

          <div>
            <label className="text-sm text-green-700 dark:text-green-400">Username</label>
            <input
              className="w-full border border-green-200 dark:border-green-800 rounded-lg p-2 mt-1 bg-white dark:bg-green-900/20 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Enter a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-green-700 dark:text-green-400">Location</label>
            <input
              className="w-full border border-green-200 dark:border-green-800 rounded-lg p-2 mt-1 bg-white dark:bg-green-900/20 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="City, Country (e.g. Toledo, US)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Save profile button */}
          <button
            onClick={handleSaveProfile}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl disabled:opacity-60 transition font-semibold"
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>

          <p className="text-sm font-semibold text-green-800 dark:text-green-300 border-b border-green-200 dark:border-green-800 pb-1 pt-2">
            Change Password
          </p>

          <div>
            <label className="text-sm text-green-700 dark:text-green-400">New Password</label>
            <input
              type="password"
              className="w-full border border-green-200 dark:border-green-800 rounded-lg p-2 mt-1 bg-white dark:bg-green-900/20 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-green-700 dark:text-green-400">Confirm Password</label>
            <input
              type="password"
              className="w-full border border-green-200 dark:border-green-800 rounded-lg p-2 mt-1 bg-white dark:bg-green-900/20 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-300"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {/* Change password button */}
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="w-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 py-3 rounded-xl hover:bg-green-200 dark:hover:bg-green-800/40 disabled:opacity-60 transition font-semibold"
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}