import { useState, useEffect } from "react";
import { Thermometer, Droplets, Sun, Sprout } from "lucide-react";
import MetricCard from "../components/MetricCard";
import MetricsChart from "../components/MetricsChart";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const username = user?.user_metadata?.username || user?.user_metadata?.name || "there";

  const [plants, setPlants]         = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [latest, setLatest]         = useState(null);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);

  // Fetch all plants belonging to the logged in user
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
          setLoading(false);
        }
      });
  }, []);

  // Fetch sensor readings when the selected plant changes
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
      .limit(500)
      .then(({ data }) => {
        if (data?.length) {
          // Most recent reading for the metric cards
          setLatest(data[0]);

          const now = Date.now();
          const twentyFourHrsAgo = now - 24 * 60 * 60 * 1000;

          // Filter to last 24 hrs only
          const filtered = data.filter((r) =>
            new Date(r.created_at).getTime() >= twentyFourHrsAgo
          );

          // Sort oldest to newest for the chart
          const sorted = [...filtered].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          );

          // Group into 1 hr buckets and average all readings in each bucket
const buckets = new Map();
sorted.forEach((r) => {
  const ts = new Date(r.created_at).getTime();
  const bucketKey = Math.floor(ts / (60 * 60 * 1000));
  if (!buckets.has(bucketKey)) {
    buckets.set(bucketKey, { readings: [], bucketStart: bucketKey * 60 * 60 * 1000 });
  }
  buckets.get(bucketKey).readings.push(r);
});

const avg = (arr, key) => {
  const vals = arr.map((r) => r[key]).filter((v) => v != null);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
};

const chartData = Array.from(buckets.values()).map(({ readings, bucketStart }) => ({
  time:        new Date(bucketStart).toISOString(),
  created_at:  new Date(bucketStart).toISOString(),
  temperature: avg(readings, "temperature_c"),
  humidity:    avg(readings, "humidity_percent"),
  light:       avg(readings, "light_lux"),
  moisture:    avg(readings, "soil_moisture_percent"),
}));

          setHistory(chartData);
        } else {
          setLatest(null);
          setHistory([]);
        }
        setLoading(false);
      });
  }, [selectedId, plants]);

  // Check plant health against fixed optimal thresholds
  const getPlantStatus = (reading) => {
    if (!reading) return null;
    const alerts = [];

    // Soil moisture healthy range 20 to 40 percent
    if (reading.soil_moisture_percent < 20) {
      alerts.push("💧 Soil is too dry — water your plant!");
    } else if (reading.soil_moisture_percent > 40) {
      alerts.push("🚫 Soil is too wet — do NOT water your plant.");
    }

    // Light healthy range 5000 to 20000 lux
    if (reading.light_lux < 5000) {
      alerts.push("🌥️ Not enough light.");
    } else if (reading.light_lux > 20000) {
      alerts.push("🔥 Too much light exposure.");
    }

    // Humidity healthy range 40 to 60 percent
    if (reading.humidity_percent < 40) {
      alerts.push("💨 Humidity too low.");
    } else if (reading.humidity_percent > 60) {
      alerts.push("💦 Humidity too high.");
    }

    // Temperature healthy range 18 to 24 degrees C
    if (reading.temperature_c < 18) {
      alerts.push("🥶 Temperature too low.");
    } else if (reading.temperature_c > 24) {
      alerts.push("🥵 Temperature too high.");
    }

    return alerts;
  };

  // Check if device has stopped sending data in the last 10 minutes
  const getDeviceStatus = (reading) => {
    if (!reading?.created_at) return false;
    const diffMinutes = (Date.now() - new Date(reading.created_at).getTime()) / (1000 * 60);
    return diffMinutes > 10;
  };

  const selectedPlant      = plants.find((p) => String(p.id) === selectedId);
  const hasNoPlants        = !loading && plants.length === 0;
  const hasNoReadings      = !loading && plants.length > 0 && !latest;
  const alerts             = getPlantStatus(latest);
  const isHealthy          = alerts && alerts.length === 0;
  const deviceDisconnected = getDeviceStatus(latest);

  return (
    <div className="space-y-6">

      {/* Welcome message */}
      <div>
        <h1 className="text-3xl font-semibold text-green-900 dark:text-white">
          Hi {username}! 👋
        </h1>
        <p className="text-green-700 dark:text-gray-400 mt-1">
          Welcome to PlantPal 🌱 Here is how your plants are doing today.
        </p>
      </div>

      {/* Plant selector dropdown */}
      {plants.length > 0 && (
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="bg-white dark:bg-[#0d1f12] border border-green-200 dark:border-green-900 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400 transition shadow"
        >
          {plants.map((p) => (
            <option key={p.id} value={String(p.id)}>🌿 {p.plantName}</option>
          ))}
        </select>
      )}

      {/* Live sensor metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard icon={Thermometer} label="Temperature"   value={latest?.temperature_c        ?? 0} unit="°C"  />
        <MetricCard icon={Droplets}    label="Humidity"      value={latest?.humidity_percent      ?? 0} unit="%"   />
        <MetricCard icon={Sun}         label="Light"         value={latest?.light_lux             ?? 0} unit="lux" />
        <MetricCard icon={Sprout}      label="Soil Moisture" value={latest?.soil_moisture_percent ?? 0} unit="%"   />
      </div>

      {/* No plants added yet */}
      {hasNoPlants && (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
          🪴 No plants added yet. Go to{" "}
          <a href="/plant-profile" className="text-green-600 font-medium underline">My Plants</a>{" "}
          to add your first plant.
        </div>
      )}

      {/* Plant has no linked device */}
      {!loading && selectedPlant && !selectedPlant.device_id && (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
          No device linked to <strong>{selectedPlant.plantName}</strong> yet.
        </div>
      )}

      {/* Device linked but no readings yet */}
      {hasNoReadings && selectedPlant?.device_id && (
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
          📡 No readings yet for <span className="font-mono">{selectedPlant.device_id}</span>. Waiting for sensor data.
        </div>
      )}

      {/* Device disconnected warning */}
      {!loading && deviceDisconnected && (
        <div className="bg-red-600 text-white border-2 border-red-800 rounded-2xl px-5 py-4 text-sm shadow-lg animate-pulse">
          ⚠️ DEVICE DISCONNECTED — No data received in the last 10 minutes.
          <br />
          Please check your ESP32 power, WiFi connection, or sensor setup.
        </div>
      )}

      {/* Plant health status */}
      {!loading && latest && !deviceDisconnected && (
        <div className={`rounded-2xl px-5 py-4 text-sm border ${
          isHealthy
            ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/10 dark:border-green-900/30 dark:text-green-300"
            : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-300"
        }`}>
          {isHealthy ? (
            <p>✅ Your plant is healthy! All conditions are optimal 🌿</p>
          ) : (
            <div>
              <p className="font-medium mb-2">⚠️ Plant needs attention:</p>
              <ul className="list-disc list-inside space-y-1">
                {alerts.map((alert, index) => (
                  <li key={index}>{alert}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Chart frozen notice when device is disconnected */}
      {deviceDisconnected && (
        <p className="text-xs text-red-500 mt-1">
          ⚠️ Data stream paused — chart frozen
        </p>
      )}

      {/* Light intensity chart */}
      <MetricsChart
        title="Light Intensity (lux) — Last 24 Hours"
        data={history}
        lines={[{ key: "light", color: "#facc15" }]}
      />

      {/* Temperature and humidity chart */}
      <MetricsChart
        title="Temperature and Humidity — Last 24 Hours"
        data={history}
        lines={[
          { key: "temperature", color: "#ef4444" },
          { key: "humidity",    color: "#3b82f6" },
        ]}
      />

      {/* Soil moisture chart */}
      <MetricsChart
        title="Soil Moisture — Last 24 Hours"
        data={history}
        lines={[{ key: "moisture", color: "#22c55e" }]}
      />
    </div>
  );
}