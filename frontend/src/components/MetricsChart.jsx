import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function MetricsChart({ data }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm h-80">
      <h3 className="font-semibold mb-4">Metrics Overview</h3>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />

          <Line type="monotone" dataKey="temperature" />
          <Line type="monotone" dataKey="moisture" />
          <Line type="monotone" dataKey="light" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
