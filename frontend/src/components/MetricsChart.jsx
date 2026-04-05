import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function MetricsChart({ data }) {
  return (
    <div className="bg-white dark:bg-[#1a0f14] p-6 rounded-2xl shadow">
      <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
        Metrics Overview
      </h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />

            <XAxis dataKey="time" stroke="#888" />
            <YAxis stroke="#888" />

            <Tooltip
              contentStyle={{
                backgroundColor: "#1a0f14",
                border: "none",
                color: "#fff",
              }}
            />

            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="moisture"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="light"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
