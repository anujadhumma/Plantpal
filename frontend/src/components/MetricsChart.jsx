import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const TZ = "America/New_York";

export default function MetricsChart({ data, title, lines = [], height = 170 }) {
  const now = Date.now();
  const twentyFourHrsAgo = now - 86400000;
  const ticks = Array.from({length:5},(_,i)=>now-(4-i)*6*60*60*1000);

  const fmt = (ts) => new Date(ts).toLocaleString("en-US",{
    timeZone:TZ, month:"2-digit", day:"2-digit",
    hour:"numeric", minute:"2-digit", hour12:true,
  });

  const chartData = (data||[]).map(d=>({...d, timeMs:new Date(d.created_at).getTime()}));

  return (
    <div
      className="w-full bg-white/90 dark:bg-[#0d1f12]/80 border border-green-100 dark:border-white/10 backdrop-blur-md rounded-xl p-3"
      style={{height:`${height}px`}}
    >
      {title&&(
        <h3 className="text-[10px] font-bold mb-1.5 text-green-800 dark:text-green-300 tracking-wide">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData} margin={{left:0,right:6,top:2,bottom:20}}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" strokeOpacity={0.5}/>
          <XAxis dataKey="timeMs" type="number" scale="time"
            domain={[twentyFourHrsAgo,now]} ticks={ticks} tickFormatter={fmt}
            tick={{fontSize:8,fill:"#9ca3af"}} angle={-20} textAnchor="end" height={34}/>
          <YAxis tick={{fontSize:9,fill:"#9ca3af"}} width={45}/>
          <Tooltip labelFormatter={fmt}
            contentStyle={{backgroundColor:"rgba(240,253,244,0.97)",border:"1px solid #bbf7d0",borderRadius:"10px",fontSize:"11px"}}/>
          <Legend wrapperStyle={{fontSize:"10px",paddingTop:"2px"}}/>
          {lines.map((l,i)=>(
            <Line key={i} type="monotone" dataKey={l.key} stroke={l.color}
              strokeWidth={2} dot={false} connectNulls={false}/>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}