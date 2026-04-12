import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const MetricCard = ({ icon, label, value, unit }) => (
  <div className="flex flex-col gap-1 bg-pink-100 dark:bg-[#1e0f18] rounded-xl px-4 py-3 flex-1 min-w-[75px]">
    <span className="text-lg">{icon}</span>
    <span className="text-[10px] font-mono tracking-widest text-pink-400 dark:text-pink-300 uppercase">{label}</span>
    <span className="text-base font-bold text-gray-800 dark:text-gray-100">
      {value != null ? value : "—"}
      <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
    </span>
  </div>
);

const PlantCard = ({ plant, reading, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const typeColors = {
    General:   "bg-green-100  dark:bg-green-900/20  text-green-700  dark:text-green-400",
    Succulent: "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
    Tropical:  "bg-sky-100    dark:bg-sky-900/20    text-sky-700    dark:text-sky-400",
    Herb:      "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
    Fern:      "bg-teal-100   dark:bg-teal-900/20   text-teal-700   dark:text-teal-400",
    Cactus:    "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
  };
  const badge = typeColors[plant.plantType] || typeColors.General;

  const handleDelete = async () => {
    if (!confirm(`Remove "${plant.plantName}"?`)) return;
    setDeleting(true);
    await onDelete(plant.id);
  };

  return (
    <div className="bg-white dark:bg-[#1a0d15] border border-pink-100 dark:border-pink-900/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌿</span>
          <div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">{plant.plantName}</h3>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${badge}`}>
              {plant.plantType || "General"}
            </span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-pink-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg p-1.5 transition-colors text-sm disabled:opacity-40"
        >
          {deleting ? "..." : "✕"}
        </button>
      </div>

      {reading ? (
        <>
          <p className="text-[10px] font-mono text-gray-400 mb-3">
            📡 Last reading · {new Date(reading.created_at).toLocaleString()}
          </p>
          <div className="flex gap-2 flex-wrap">
            <MetricCard icon="🌡️" label="Temp"     value={reading.temperature_c}         unit="°C"  />
            <MetricCard icon="💧" label="Humidity" value={reading.humidity_percent}       unit="%"   />
            <MetricCard icon="🌱" label="Soil"     value={reading.soil_moisture_percent}  unit="%"   />
            <MetricCard icon="☀️" label="Light"    value={reading.light_lux}              unit="lux" />
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-400 dark:text-gray-500 bg-pink-50 dark:bg-pink-900/10 rounded-xl px-4 py-3">
          📡 No sensor data yet
          {plant.device_id && <span className="block text-[11px] font-mono mt-1">{plant.device_id}</span>}
        </div>
      )}
    </div>
  );
};

const AddPlantModal = ({ onClose, onAdd, userId }) => {
  const [form, setForm] = useState({ plantName: "", plantType: "General", device_id: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    if (!form.plantName.trim()) { setError("Plant name is required."); return; }
    setLoading(true);
    setError("");
    try {
      // Get the current session to ensure we have a fresh userId
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      if (!currentUserId) {
        setError("You must be logged in to add a plant.");
        return;
      }

      const { data, error: sbError } = await supabase
        .from("Plant")
        .insert([{
          plantName: form.plantName.trim(),
          plantType: form.plantType,
          device_id: form.device_id.trim() || null,
          userId: currentUserId,
        }])
        .select();

      if (sbError) throw sbError;
      onAdd(data[0]);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add plant.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-pink-50 dark:bg-[#12070c] border border-pink-200 dark:border-pink-900/50 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 transition";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-[#1a0d15] border border-pink-100 dark:border-pink-900/40 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">🌱 Add New Plant</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-mono tracking-widest text-pink-400 uppercase mb-1.5 block">Plant Name *</label>
            <input className={inputCls} placeholder="e.g. My Monstera" value={form.plantName} onChange={set("plantName")} />
          </div>
          <div>
            <label className="text-xs font-mono tracking-widest text-pink-400 uppercase mb-1.5 block">Plant Type</label>
            <select className={inputCls} value={form.plantType} onChange={set("plantType")}>
              {["General","Succulent","Tropical","Herb","Fern","Cactus","Orchid","Other"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-mono tracking-widest text-pink-400 uppercase mb-1.5 block">
              Device ID <span className="normal-case font-sans tracking-normal text-gray-400">(from your ESP32)</span>
            </label>
            <input className={inputCls} placeholder="e.g. esp32_2" value={form.device_id} onChange={set("device_id")} />
            <p className="text-[11px] text-gray-400 mt-1 ml-1">Links this plant to its sensor readings</p>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2.5">{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-bold rounded-xl py-3 text-sm transition-colors mt-1">
            {loading ? "Adding..." : "Add Plant →"}
          </button>
        </div>
      </div>
    </div>
  );
};

const PlantProfile = () => {
  const { user } = useAuth();
  const [plants, setPlants]       = useState([]);
  const [readings, setReadings]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      // Only fetch plants belonging to the logged in user
      const { data: plantData, error: plantErr } = await supabase
        .from("Plant")
        .select("*")
        .eq("userId", user.id)
        .order("id", { ascending: true });
      if (plantErr) throw plantErr;

      const deviceIds = plantData.map(p => p.device_id).filter(Boolean);
      let readingMap = {};

      if (deviceIds.length > 0) {
        const { data: sensorData, error: sensorErr } = await supabase
          .from("esp32_readings")
          .select("*")
          .in("device_id", deviceIds)
          .order("created_at", { ascending: false });
        if (sensorErr) throw sensorErr;

        // Keep only latest reading per device
        sensorData.forEach(r => {
          if (!readingMap[r.device_id]) readingMap[r.device_id] = r;
        });
      }

      setPlants(plantData);
      setReadings(readingMap);
    } catch (err) {
      setError("Could not load data: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (plant) => setPlants(prev => [...prev, plant]);

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from("Plant").delete().eq("id", id);
      if (error) throw error;
      setPlants(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Delete failed:", err.message);
      alert("Failed to delete plant: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 dark:bg-[#12070c] px-6 py-10 transition-colors">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-xs font-mono tracking-widest text-pink-400 uppercase mb-1">Plant Pal</p>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Plants</h1>
            <p className="text-sm text-gray-400 mt-1">
              {plants.length} {plants.length === 1 ? "plant" : "plants"} tracked
            </p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl px-5 py-2.5 text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
            <span className="text-lg">＋</span> Add Plant
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-5 py-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && plants.length === 0 && !error && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🪴</div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No plants yet</h3>
            <p className="text-gray-400 mb-6 text-sm">Add your first plant to start tracking</p>
            <button onClick={() => setShowModal(true)}
              className="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-800 rounded-xl px-5 py-2.5 text-sm hover:bg-pink-200 transition-colors">
              + Add your first plant
            </button>
          </div>
        )}

        {!loading && plants.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                reading={readings[plant.device_id] || null}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddPlantModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default PlantProfile;