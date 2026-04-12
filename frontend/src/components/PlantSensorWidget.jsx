import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const MetricCard = ({ icon, label, value, unit }) => (
  <div className="flex flex-col gap-1 bg-pink-100 dark:bg-[#1e0f18] rounded-xl px-4 py-3 flex-1">
    <span className="text-lg">{icon}</span>
    <span className="text-[10px] font-mono tracking-widest text-pink-400 dark:text-pink-300 uppercase">{label}</span>
    <span className="text-base font-bold text-gray-800 dark:text-gray-100">
      {value != null ? value : "—"}
      <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
    </span>
  </div>
);

const PlantSensorWidget = () => {
  const [plants, setPlants]         = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [reading, setReading]       = useState(null);
  const [loading, setLoading]       = useState(false);

  // Fetch all plants for dropdown
  useEffect(() => {
    supabase
      .from("Plant")
      .select("id, plantName, device_id")
      .order("id")
      .then(({ data }) => {
        if (data?.length) {
          setPlants(data);
          setSelectedId(String(data[0].id));
        }
      });
  }, []);

  // Fetch latest reading when selected plant changes
  useEffect(() => {
    if (!selectedId) return;
    const plant = plants.find((p) => String(p.id) === selectedId);
    if (!plant?.device_id) { setReading(null); return; }

    setLoading(true);
    supabase
      .from("esp32_readings")
      .select("*")
      .eq("device_id", plant.device_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        setReading(data?.[0] || null);
        setLoading(false);
      });
  }, [selectedId, plants]);

  const selectedPlant = plants.find((p) => String(p.id) === selectedId);

  return (
    <div className="bg-white dark:bg-[#1a0d15] border border-pink-100 dark:border-pink-900/30 rounded-2xl p-5 shadow-sm">
      {/* Header + Dropdown */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <p className="text-xs font-mono tracking-widest text-pink-400 dark:text-pink-300 uppercase mb-0.5">Live Sensor</p>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Plant Monitor</h3>
        </div>

        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="bg-pink-50 dark:bg-[#12070c] border border-pink-200 dark:border-pink-900/50 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
        >
          {plants.map((p) => (
            <option key={p.id} value={String(p.id)}>🌿 {p.plantName}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        </div>
      )}

      {/* No device linked */}
      {!loading && selectedPlant && !selectedPlant.device_id && (
        <p className="text-sm text-gray-400 dark:text-gray-500 bg-pink-50 dark:bg-pink-900/10 rounded-xl px-4 py-3">
          No device linked to this plant yet.
        </p>
      )}

      {/* No readings yet */}
      {!loading && selectedPlant?.device_id && !reading && (
        <p className="text-sm text-gray-400 dark:text-gray-500 bg-pink-50 dark:bg-pink-900/10 rounded-xl px-4 py-3">
          📡 Waiting for sensor data from <span className="font-mono">{selectedPlant.device_id}</span>
        </p>
      )}

      {/* Live reading */}
      {!loading && reading && (
        <>
          <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-3">
            Last updated · {new Date(reading.created_at).toLocaleString()}
          </p>
          <div className="flex gap-2 flex-wrap">
            <MetricCard icon="🌡️" label="Temp"     value={reading.temperature_c}          unit="°C"  />
            <MetricCard icon="💧" label="Humidity" value={reading.humidity_percent}      unit="%"   />
            <MetricCard icon="🌱" label="Soil"     value={reading.soil_moisture_percent} unit="%"   />
            <MetricCard icon="☀️" label="Light"    value={reading.light_lux}             unit="lux" />
          </div>
        </>
      )}
    </div>
  );
};

export default PlantSensorWidget;