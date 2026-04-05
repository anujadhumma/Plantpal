export default function MetricCard({ icon: Icon, label, value, unit }) {
  return (
    <div className="bg-white dark:bg-[#1a0f14] p-6 rounded-2xl shadow text-gray-900 dark:text-gray-100 transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-green-600" />
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
      </div>

      <div className="text-2xl font-semibold">
        {value ?? "--"} {unit}
      </div>
    </div>
  );
}
