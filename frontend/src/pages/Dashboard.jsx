import { useState, useEffect } from "react";
import { Thermometer, Droplets, Sun } from "lucide-react";
import MetricCard from "../components/MetricCard";
import MetricsChart from "../components/MetricsChart";

export default function Dashboard() {
  const [data, setData] = useState({
    temperature: 72,
    moisture: 55,
    light: 80,
  });

  const [history, setHistory] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newData = {
        temperature: Math.floor(Math.random() * 10) + 70,
        moisture: Math.floor(Math.random() * 20) + 40,
        light: Math.floor(Math.random() * 20) + 60,
      };

      setData(newData);

      setHistory((prev) => [
        ...prev.slice(-20),
        {
          ...newData,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Dashboard 🌱
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={Thermometer}
          label="Temperature"
          value={data.temperature}
          unit="°F"
        />

        <MetricCard
          icon={Droplets}
          label="Moisture"
          value={data.moisture}
          unit="%"
        />

        <MetricCard icon={Sun} label="Light" value={data.light} unit="%" />
      </div>

      <MetricsChart data={history} />
    </div>
  );
}
