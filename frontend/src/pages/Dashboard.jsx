import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Thermometer, Droplets, Sun, Sprout, Wifi, WifiOff, CheckCircle2, AlertTriangle } from "lucide-react";
import MetricsChart from "../components/MetricsChart";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const DEFAULTS = {
  optimalMoisture:30, optimalLight:12500,
  optimalTemperature:21, optimalHumidity:50, optimalPressure:1000,
};
const TOLERANCE = { moisture:10, light:7500, temperature:3, humidity:10, pressure:50 };
const resolve   = (val, def) => (val != null && !isNaN(val)) ? val : def;

const CARD = "bg-white/90 dark:bg-[#0d1f12]/80 border border-green-100 dark:border-white/10 backdrop-blur-md";

const STYLES = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes livePulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:0.35; transform:scale(0.75); }
  }
  .fade-up  { animation: fadeUp 0.4s cubic-bezier(.16,1,.3,1) both; }
  .live-dot { width:6px;height:6px;border-radius:50%;background:#22c55e;flex-shrink:0;
    animation: livePulse 2s ease-in-out infinite; }
  .card-hover { transition: transform 0.25s cubic-bezier(.16,1,.3,1), box-shadow 0.25s ease; }
  .card-hover:hover { transform:translateY(-2px); }
`;

const METRIC = {
  Temperature:    { icon:Thermometer, color:"#f87171", opt:"optimalTemperature", tol:"temperature", unit:"°C"  },
  Humidity:       { icon:Droplets,    color:"#60a5fa", opt:"optimalHumidity",    tol:"humidity",    unit:"%"   },
  Light:          { icon:Sun,         color:"#fbbf24", opt:"optimalLight",       tol:"light",       unit:"lux" },
  "Soil Moisture":{ icon:Sprout,      color:"#34d399", opt:"optimalMoisture",    tol:"moisture",    unit:"%"   },
};

const MetricCard = ({ label, value, delay, plant }) => {
  const m=METRIC[label], Icon=m.icon;
  const opt=resolve(plant?.[m.opt],DEFAULTS[m.opt]);
  const tol=TOLERANCE[m.tol];
  const lo=opt-tol*2.5, hi=opt+tol*2.5;
  const pct=Math.min(100,Math.max(0,((value-lo)/(hi-lo))*100));
  const gs=Math.max(0,((opt-tol-lo)/(hi-lo))*100);
  const ge=Math.min(100,((opt+tol-lo)/(hi-lo))*100);
  const ok=value>=opt-tol&&value<=opt+tol;

  return (
    <div className={`card-hover fade-up relative overflow-hidden rounded-xl ${CARD} px-5 py-3 flex flex-col justify-between`}
      style={{animationDelay:`${delay}ms`,boxShadow:`0 2px 14px ${m.color}14`}}>
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{background:`linear-gradient(90deg,${m.color},${m.color}44)`}}/>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon size={13} style={{color:m.color}} strokeWidth={2.5}/>
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            ok?"bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
              :"bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
          }`}>{ok?"✓":"⚠"}</span>
          <div className="live-dot"/>
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-2.5">
        <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-none">{value??"-"}</span>
        <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">{m.unit}</span>
      </div>

      {/* Range bar */}
      <div>
        <div className="relative h-2 bg-gray-200 dark:bg-green-950/60 rounded-full">
          <div className="absolute top-0 h-full rounded-full opacity-30"
            style={{left:`${gs}%`,width:`${ge-gs}%`,background:m.color}}/>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#0a1a10] shadow"
            style={{left:`${pct}%`,background:m.color}}/>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1 text-center">
          Optimal: {opt}{m.unit}
        </p>
      </div>
    </div>
  );
};

const HealthRing = ({ score }) => {
  const r=65,sw=10,norm=r-sw/2,circ=2*Math.PI*norm,offset=circ-(score/100)*circ;
  const color=score>=75?"#22c55e":score>=50?"#facc15":score>=25?"#f97316":"#ef4444";
  const label=score===100?"Perfect":score>=75?"Good":score>=50?"Fair":score>=25?"Poor":"Critical";
  const tc=score>=75?"text-green-700 dark:text-green-400":score>=50?"text-yellow-600 dark:text-yellow-400":score>=25?"text-orange-600 dark:text-orange-400":"text-red-600 dark:text-red-400";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{width:r*2+sw,height:r*2+sw}}>
        <div className="absolute inset-0 rounded-full" style={{boxShadow:`0 0 22px ${color}44`}}/>
        <svg width={r*2+sw} height={r*2+sw} style={{transform:"rotate(-90deg)"}}>
          <circle cx={r+sw/2} cy={r+sw/2} r={norm} fill="none" strokeWidth={sw} stroke="#d1d5db" className="dark:stroke-green-950"/>
          <circle cx={r+sw/2} cy={r+sw/2} r={norm} fill="none" stroke={color} strokeWidth={sw}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{transition:"stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1),stroke 0.6s ease",
              filter:`drop-shadow(0 0 4px ${color}88)`}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-xl">🌿</span>
          <span className={`text-lg font-black font-mono ${tc}`}>{score}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className={`text-sm font-bold ${tc}`}>{label}</p>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">Health</p>
      </div>
    </div>
  );
};

const MoodPanel = ({ score, alerts, plantName }) => {
  const mood=
    score===100?{emoji:"🥳",title:"Thriving!",  desc:"Everything is perfect."}:
    score>=75  ?{emoji:"😊",title:"Doing well", desc:"Minor tweaks needed."}:
    score>=50  ?{emoji:"😐",title:"Needs love", desc:"A couple things to fix."}:
    score>=25  ?{emoji:"😟",title:"Struggling", desc:"Act soon."}:
               {emoji:"🆘",title:"Critical!",   desc:"Help immediately!"};

  return (
    <div className={`flex-1 rounded-xl ${CARD} px-4 py-3 flex flex-col justify-between overflow-hidden min-w-0`}>
      <div>
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-green-600 dark:text-green-400 mb-2">Mood</p>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-2xl flex-shrink-0">{mood.emoji}</span>
          <div className="min-w-0">
            <p className="text-base font-black text-gray-900 dark:text-white leading-tight">{mood.title}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{plantName}</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug">{mood.desc}</p>
      </div>

      {alerts?.length>0&&(
        <div className="flex flex-wrap gap-1 mt-2">
          {alerts.map((a,i)=>(
            <span key={i} className="text-[10px] bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 text-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5">
              {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const {user} = useAuth();
  const username=user?.user_metadata?.username||user?.user_metadata?.name||"there";
  const [plants,setPlants]=useState([]);
  const [selectedId,setSelectedId]=useState("");
  const [latest,setLatest]=useState(null);
  const [history,setHistory]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    supabase.from("Plant")
      .select("id,plantName,device_id,optimalMoisture,optimalLight,optimalTemperature,optimalHumidity,optimalPressure")
      .eq("userId",user.id).order("id")
      .then(({data})=>{
        if(data?.length){setPlants(data);setSelectedId(String(data[0].id));}
        else setLoading(false);
      });
  },[]);

  useEffect(()=>{
    if(!selectedId)return;
    const plant=plants.find(p=>String(p.id)===selectedId);
    if(!plant?.device_id){setLatest(null);setHistory([]);setLoading(false);return;}
    setLoading(true);
    supabase.from("esp32_readings").select("*")
      .eq("device_id",plant.device_id)
      .gte("created_at", new Date(Date.now() - 86400000).toISOString())
.order("created_at",{ascending:false})
      .then(({data})=>{
        if(data?.length){
          setLatest(data[0]);
          const cutoff=Date.now()-86400000;
          const sorted=data.filter(r=>new Date(r.created_at).getTime()>=cutoff)
            .sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
          const buckets=new Map();
          sorted.forEach(r=>{
            const k=Math.floor(new Date(r.created_at).getTime()/3600000);
            if(!buckets.has(k))buckets.set(k,{readings:[],start:k*3600000});
            buckets.get(k).readings.push(r);
          });
          const avg=(arr,k)=>{const v=arr.map(r=>r[k]).filter(x=>x!=null);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length*10)/10:null;};
          setHistory(Array.from(buckets.values()).map(({readings,start})=>({
            time:new Date(start).toISOString(),created_at:new Date(start).toISOString(),
            temperature:avg(readings,"temperature_c"),humidity:avg(readings,"humidity_percent"),
            light:avg(readings,"light_lux"),moisture:avg(readings,"soil_moisture_percent"),
          })));
        }else{setLatest(null);setHistory([]);}
        setLoading(false);
      });
  },[selectedId,plants]);

  const getAlerts=(reading,plant)=>{
    if(!reading||!plant)return null;
    const a=[],
      optM=resolve(plant.optimalMoisture,DEFAULTS.optimalMoisture),
      optL=resolve(plant.optimalLight,DEFAULTS.optimalLight),
      optT=resolve(plant.optimalTemperature,DEFAULTS.optimalTemperature),
      optH=resolve(plant.optimalHumidity,DEFAULTS.optimalHumidity);
    const md=reading.soil_moisture_percent-optM;
    if(md<-TOLERANCE.moisture)a.push("💧 Too dry");else if(md>TOLERANCE.moisture)a.push("🚫 Too wet");
    const ld=reading.light_lux-optL;
    if(ld<-TOLERANCE.light)a.push("🌥️ Low light");else if(ld>TOLERANCE.light)a.push("🔥 Too bright");
    const hd=reading.humidity_percent-optH;
    if(hd<-TOLERANCE.humidity)a.push("💨 Dry air");else if(hd>TOLERANCE.humidity)a.push("💦 Humid");
    const td=reading.temperature_c-optT;
    if(Math.abs(td)>TOLERANCE.temperature)a.push(td>0?"🥵 Too warm":"🥶 Too cold");
    return a;
  };

  const sel=plants.find(p=>String(p.id)===selectedId);
  const alerts=getAlerts(latest,sel);
  const score=alerts?Math.max(0,100-alerts.length*25):null;
  const ok=alerts?.length===0;
  const disc=latest?.created_at?(Date.now()-new Date(latest.created_at).getTime())/60000>10:false;
  const updAt=latest?.created_at
    ?new Date(latest.created_at).toLocaleTimeString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit",hour12:true})
    :null;
  const noPlants=!loading&&plants.length===0;
  const noReadings=!loading&&plants.length>0&&!latest;

  return (
    <>
      <style>{STYLES}</style>
      <div className="flex flex-col h-[calc(100vh-4rem)] w-full px-5 py-4 gap-3 overflow-hidden">

        {/* Header */}
        <div className="fade-up flex items-start justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-White text-white dark:text-white">
              Hi {username}, welcome!
            </h1>
            <p className="text-sm font-bold text-white dark:text-white mt-0.5">
              {noPlants
                ? "Please add your first plant to get started 🌱"
                : "Here's how your plants are doing today 🌿"}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-shrink-0">
            {updAt&&(
              <div className="flex items-center gap-1.5 bg-white/90 dark:bg-green-950/60 border border-green-200 dark:border-green-900 rounded-full px-3 py-1 text-[11px] text-green-700 dark:text-green-400">
                <div className="live-dot"/> {updAt} EST
              </div>
            )}
            {(latest||disc)&&(
              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border ${
                disc?"bg-red-50 border-red-200 text-red-600 animate-pulse dark:bg-red-950/30 dark:border-red-900 dark:text-red-400"
                   :"bg-white/90 border-green-200 text-green-700 dark:bg-green-950/60 dark:border-green-900 dark:text-green-400"
              }`}>
                {disc?<><WifiOff size={11}/>Offline</>:<><Wifi size={11}/>Live</>}
              </div>
            )}
          </div>
        </div>

        {/* Plant tabs */}
        {plants.length>0&&(
  <div className="fade-up flex-shrink-0" style={{animationDelay:"40ms"}}>
    <select
      value={selectedId}
      onChange={e=>setSelectedId(e.target.value)}
      className={`${CARD} text-gray-700 dark:text-gray-300 text-xs font-bold rounded-full px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 transition cursor-pointer`}
    >
      {plants.map(p=>(
        <option key={p.id} value={String(p.id)}>🌿 {p.plantName}</option>
      ))}
    </select>
  </div>
)}

        {/* Main */}
        {noPlants ? (
          <div className="flex-1 flex items-center justify-center">
            <div className={`text-center ${CARD} rounded-3xl p-12 shadow-xl`}>
              <div className="text-6xl mb-3">🪴</div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">No plants added yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Head to My Plants to add your first one</p>
              <Link to="/plant-profile"
                className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl px-5 py-2 transition-colors">
                + Add a Plant
              </Link>
            </div>
          </div>
        ) : (
          <div className="fade-up flex gap-3 flex-1 min-h-0" style={{animationDelay:"80ms"}}>

            <div className="flex-[1] grid grid-cols-2 gap-2.5 min-h-0">
              <MetricCard label="Temperature"   value={latest?.temperature_c??0}        delay={80}  plant={sel}/>
              <MetricCard label="Humidity"      value={latest?.humidity_percent??0}      delay={110} plant={sel}/>
              <MetricCard label="Light"         value={latest?.light_lux??0}             delay={140} plant={sel}/>
              <MetricCard label="Soil Moisture" value={latest?.soil_moisture_percent??0} delay={170} plant={sel}/>
            </div>

            <div className="w-[360px] flex flex-col gap-2.5 flex-shrink-0 min-h-0">

              <div className="flex gap-2.5 flex-shrink-0">
                {/* Health ring */}
                <div className={`card-hover ${CARD} rounded-xl p-4 flex items-center justify-center flex-shrink-0`}
                  style={{boxShadow:"0 4px 20px rgba(34,197,94,0.08)"}}>
                  {score!==null&&!disc
                    ?<HealthRing score={score}/>
                    :<div className="flex flex-col items-center gap-1 py-2">
                      <span className="text-4xl">🪴</span>
                      <p className="text-xs text-gray-500 text-center">{disc?"Offline":"No data"}</p>
                    </div>
                  }
                </div>

                {/* Mood */}
                {score!==null&&!disc&&sel
                  ?<MoodPanel score={score} alerts={alerts} plantName={sel.plantName}/>
                  :<div className={`flex-1 ${CARD} rounded-xl p-3 flex items-center justify-center`}>
                    <p className="text-xs text-gray-400 text-center">Waiting for data…</p>
                  </div>
                }
              </div>

              {/* Status pill */}
              {latest&&!disc&&(
                <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold border flex-shrink-0 ${
                  ok?"bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300"
                    :"bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
                }`}>
                  {ok
                    ?<><CheckCircle2 size={13} className="flex-shrink-0 text-green-500"/>All conditions optimal 🌿</>
                    :<><AlertTriangle size={13} className="flex-shrink-0 text-amber-500"/>{alerts.length} issue{alerts.length>1?"s":""} detected</>
                  }
                </div>
              )}

              {noReadings&&sel?.device_id&&(
                <div className={`flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 ${CARD} rounded-xl px-3 py-2 flex-shrink-0`}>
                  <Wifi size={11} className="text-green-400 animate-pulse flex-shrink-0"/>
                  <span className="truncate">Waiting for {sel.device_id}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Charts */}
        {!noPlants&&(
          <div className="fade-up grid grid-cols-3 gap-2.5 flex-shrink-0" style={{animationDelay:"160ms"}}>
            <MetricsChart title="☀️ Light (lux)"        data={history} height={170} lines={[{key:"light",color:"#fbbf24"}]}/>
            <MetricsChart title="🌡️ Temp · 💧 Humidity" data={history} height={170} lines={[{key:"temperature",color:"#f87171"},{key:"humidity",color:"#60a5fa"}]}/>
            <MetricsChart title="🌱 Soil Moisture"      data={history} height={170} lines={[{key:"moisture",color:"#34d399"}]}/>
          </div>
        )}
      </div>
    </>
  );
}