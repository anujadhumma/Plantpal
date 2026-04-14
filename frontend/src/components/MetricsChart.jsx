import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const TZ = "America/New_York";

export default function MetricsChart({ data, title, lines = [] }) {

  const now = Date.now();
  const twentyFourHrsAgo = now - 24 * 60 * 60 * 1000;

  // Generate 5 tick marks at 6 hr intervals across the last 24 hrs
  const generateTicks = () => {
    const ticks = [];
    for (let i = 4; i >= 0; i--) {
      ticks.push(now - i * 6 * 60 * 60 * 1000);
    }
    return ticks;
  };

  const ticks = generateTicks();

  // Format tick labels in Eastern Time 
  const formatTick = (value) => {
    return new Date(value).toLocaleString("en-US", {
      timeZone:    TZ,
      month:       "2-digit",
      day:         "2-digit",
      year:        "2-digit",
      hour:        "numeric",
      minute:      "2-digit",
      hour12:      true,
    });
  };

  // Format tooltip label in Eastern Time
  const formatTooltip = (value) => {
    return new Date(value).toLocaleString("en-US", {
      timeZone:    TZ,
      month:       "2-digit",
      day:         "2-digit",
      year:        "2-digit",
      hour:        "numeric",
      minute:      "2-digit",
      hour12:      true,
    });
  };

  // Convert created_at to numeric timestamp for proper x-axis scaling
  const chartData = (data || []).map((d) => ({
    ...d,
    timeMs: new Date(d.created_at).getTime(),
  }));

  return (
    <div className="w-full bg-white dark:bg-[#0d1f12] rounded-2xl p-4 shadow" style={{ height: "280px" }}>
      {title && (
        <h3 className="text-sm font-semibold mb-3 text-green-800 dark:text-green-200">
          {title}
        </h3>
      )}

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData} margin={{ left: 0, right: 20, top: 5, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />

          {/* X axis spans the last 24 hrs */}
          <XAxis
            dataKey="timeMs"
            type="number"
            scale="time"
            domain={[twentyFourHrsAgo, now]}
            ticks={ticks}
            tickFormatter={formatTick}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            angle={-25}
            textAnchor="end"
            height={50}
          />

          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} width={45} />

          <Tooltip
            labelFormatter={formatTooltip}
            contentStyle={{
              backgroundColor: "#f0faf4",
              border: "1px solid #b7e4c7",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          />

          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />

          {lines.map((line, idx) => (
            <Line
              key={idx}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}