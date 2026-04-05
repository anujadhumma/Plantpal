export default function MetricCard({ icon: Icon, label, value, unit }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-green-600" />
        <span className="text-gray-500">{label}</span>
      </div>

      <div className="text-2xl font-semibold">
        {value ?? "--"} {unit}
      </div>
    </div>
  );
}
