import { useState, useEffect } from "react";
import { Thermometer, Droplets, Sun } from "lucide-react";
import MetricCard from "../components/MetricCard";
import MetricsChart from "../components/MetricsChart";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [plants, setPlants]         = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [latest, setLatest]         = useState(null);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);

  // Fetch plants for this user
  useEffect(() => {
    supabase
      .from("Plant")
      .select("id, plantName, device_id")
      .eq("userId", user.id)
      .order("id")
      .then(({ data }) => {
        if (data?.length) {
          setPlants(data);
          setSelectedId(String(data[0].id));
        } else {
          // No plants — stop loading, show empty state
          setLoading(false);
        }
      });
  }, []);

  // Fetch readings when selected plant changes
  useEffect(() => {
    if (!selectedId) return;
    const plant = plants.find((p) => String(p.id) === selectedId);
    if (!plant?.device_id) {
      setLatest(null);
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("esp32_readings")
      .select("*")
      .eq("device_id", plant.device_id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data?.length) {
          setLatest(data[0]);
          const chartData = [...data].reverse().map((r) => ({
            time: new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            temperature: r.temperature_c,
            moisture: r.soil_moisture_percent,
            light: r.light_lux,
            humidity: r.humidity_percent,
          }));
          setHistory(chartData);
        } else {
          setLatest(null);
          setHistory([]);
        }
        setLoading(false);
      });
  }, [selectedId, plants]);

  const selectedPlant = plants.find((p) => String(p.id) === selectedId);
  const hasNoPlants   = !loading && plants.length === 0;
  const hasNoReadings = !loading && plants.length > 0 && !latest;

  return (
    <div className="space-y-6">

      {/* Header + dropdown */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dashboard 🌱
        </h1>

        {plants.length > 0 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-white dark:bg-[#1a0f14] border border-pink-200 dark:border-pink-900/50 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-400 transition shadow"
          >
            {plants.map((p) => (
              <option key={p.id} value={String(p.id)}>🌿 {p.plantName}</option>
            ))}
          </select>
        )}
      </div>

      {/* Metric cards — always show, 0 when no data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard icon={Thermometer} label="Temperature" value={latest?.temperature_c      ?? 0} unit="°C"  />
        <MetricCard icon={Droplets}    label="Humidity"    value={latest?.humidity_percent    ?? 0} unit="%"   />
        <MetricCard icon={Sun}         label="Light"       value={latest?.light_lux           ?? 0} unit="lux" />
      </div>

      {/* No plants yet — prompt to add one */}
      {hasNoPlants && (
        <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-900/30 rounded-2xl px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
          🪴 No plants added yet. Go to{" "}
          <a href="/plant-profile" className="text-pink-500 font-medium underline">
            My Plants
          </a>{" "}
          to add your first plant.
        </div>
      )}

      {/* Plant has no device linked */}
      {!loading && selectedPlant && !selectedPlant.device_id && (
        <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-900/30 rounded-2xl px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
          No device linked to <strong>{selectedPlant.plantName}</strong> yet.
        </div>
      )}

      {/* Has device but no readings yet */}
      {hasNoReadings && selectedPlant?.device_id && (
        <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-900/30 rounded-2xl px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
          📡 No readings yet for <span className="font-mono">{selectedPlant.device_id}</span>. Waiting for sensor data.
        </div>
      )}

      {/* Chart — only show when there is data */}
      <MetricsChart data={history} />
    </div>
  );
}