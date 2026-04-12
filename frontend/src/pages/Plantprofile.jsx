import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const MetricCard = ({ icon, label, value, unit }) => (
  <div className="flex flex-col gap-1 bg-[#f0faf0] rounded-xl px-4 py-3 flex-1 min-w-[75px]">
    <span className="text-lg">{icon}</span>
    <span className="text-[10px] font-mono tracking-widest text-green-600 uppercase">{label}</span>
    <span className="text-base font-bold text-green-900">
      {value != null ? value : "—"}
      <span className="text-xs font-normal text-green-400 ml-0.5">{unit}</span>
    </span>
  </div>
);

const PlantCard = ({ plant, reading, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const typeColors = {
    General:   "bg-green-100  text-green-700",
    Succulent: "bg-lime-100   text-lime-700",
    Tropical:  "bg-teal-100   text-teal-700",
    Herb:      "bg-emerald-100 text-emerald-700",
    Fern:      "bg-green-100  text-green-800",
    Cactus:    "bg-yellow-100 text-yellow-700",
    Orchid:    "bg-pink-100   text-pink-600",
    Other:     "bg-gray-100   text-gray-600",
  };
  const badge = typeColors[plant.plantType] || typeColors.General;

  const handleDelete = async () => {
    if (!confirm(`Remove "${plant.plantName}"?`)) return;
    setDeleting(true);
    await onDelete(plant.id);
    setDeleting(false);
  };

  return (
    <div className="bg-white border border-green-100 rounded-3xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 rounded-2xl p-2.5">
            <span className="text-2xl">🌿</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-green-900 leading-tight">{plant.plantName}</h3>
            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${badge}`}>
              {plant.plantType || "General"}
            </span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-green-300 hover:text-red-400 hover:bg-red-50 rounded-xl p-1.5 transition-colors text-sm disabled:opacity-40"
        >
          {deleting ? "..." : "✕"}
        </button>
      </div>

      {/* Sensor readings */}
      {reading ? (
        <>
          <p className="text-[10px] font-mono text-green-400 mb-3">
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
        <div className="text-sm text-green-500 bg-[#f0faf0] rounded-2xl px-4 py-3">
          📡 No sensor data yet
          {plant.device_id && (
            <span className="block text-[11px] font-mono mt-1 text-green-400">{plant.device_id}</span>
          )}
        </div>
      )}
    </div>
  );
};

const AddPlantModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({ plantName: "", plantType: "General", device_id: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    if (!form.plantName.trim()) { setError("Plant name is required."); return; }
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      if (!currentUserId) { setError("You must be logged in."); return; }

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

  const inputCls = "w-full bg-[#f0faf0] border border-green-200 rounded-2xl px-4 py-2.5 text-sm text-green-900 placeholder-green-300 focus:outline-none focus:ring-2 focus:ring-green-400 transition";

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-green-100 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-green-900">Add New Plant 🌱</h2>
            <p className="text-sm text-green-400 mt-0.5">Track your plant's sensor data</p>
          </div>
          <button onClick={onClose} className="text-green-300 hover:text-green-600 text-xl transition-colors">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1.5 block">Plant Name *</label>
            <input className={inputCls} placeholder="e.g. My Monstera" value={form.plantName} onChange={set("plantName")} />
          </div>

          <div>
            <label className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1.5 block">Plant Type</label>
            <select className={inputCls} value={form.plantType} onChange={set("plantType")}>
              {["General","Succulent","Tropical","Herb","Fern","Cactus","Orchid","Other"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1.5 block">
              Device ID
            </label>
            <input className={inputCls} placeholder="e.g. esp32_2" value={form.device_id} onChange={set("device_id")} />
            <p className="text-[11px] text-green-400 mt-1.5 ml-1">
              Links this plant to its ESP32 sensor readings
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-2xl px-4 py-2.5">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold rounded-2xl py-3 text-sm transition-colors mt-1"
          >
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
        sensorData.forEach(r => {
          if (!readingMap[r.device_id]) readingMap[r.device_id] = r;
        });
      }

      setPlants(plantData);
      setReadings(readingMap);
    } catch (err) {
      setError("Could not load data: " + err.message);
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
      alert("Failed to delete: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8f5e2] px-6 py-10 transition-colors">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest text-green-500 uppercase mb-1">PlantPal</p>
            <h1 className="text-3xl font-bold text-green-900">My Plants 🌿</h1>
            <p className="text-sm text-green-500 mt-1">
              {plants.length} {plants.length === 1 ? "plant" : "plants"} tracked
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-2xl px-5 py-2.5 text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <span className="text-lg">＋</span> Add Plant
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && plants.length === 0 && !error && (
          <div className="text-center py-24">
            <div className="bg-white rounded-3xl p-12 shadow-sm border border-green-100 inline-block">
              <div className="text-6xl mb-4">🪴</div>
              <h3 className="text-xl font-bold text-green-900 mb-2">No plants yet</h3>
              <p className="text-green-400 mb-6 text-sm">Add your first plant to start tracking sensor data</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-6 py-2.5 text-sm font-semibold transition-colors"
              >
                + Add your first plant
              </button>
            </div>
          </div>
        )}

        {/* Plant grid */}
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

      {showModal && <AddPlantModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
};

export default PlantProfile;