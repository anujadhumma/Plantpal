import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export default function MetricsChart({ data }) {
  return (
    <div className="bg-white dark:bg-[#1a0f14] p-6 rounded-2xl shadow">
      <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
        Sensor History
      </h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="time" stroke="#888" tick={{ fontSize: 11 }} />
            <YAxis stroke="#888" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a0f14", border: "none", color: "#fff" }}
            />
            <Legend />
            <Line type="monotone" dataKey="temperature" name="Temp (°C)"     stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="moisture"    name="Soil (%)"      stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="humidity"    name="Humidity (%)"  stroke="#a78bfa" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="light"       name="Light (lux)"   stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}