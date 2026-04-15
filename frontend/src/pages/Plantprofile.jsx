import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Thermometer, Droplets, Sun, Sprout, Wifi } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const CARD = "bg-white/90 dark:bg-[#0d1f12]/80 border border-green-100 dark:border-white/10 backdrop-blur-md";

const STYLES = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .fade-up { animation: fadeUp 0.4s cubic-bezier(.16,1,.3,1) both; }
  .card-hover { transition: transform 0.25s cubic-bezier(.16,1,.3,1), box-shadow 0.25s ease; }
  .card-hover:hover { transform:translateY(-3px); box-shadow: 0 16px 40px rgba(34,197,94,0.1); }
`;

const MetricPill = ({ icon: Icon, label, value, unit, color }) => (
  <div className="flex flex-col gap-0.5 bg-gray-50 dark:bg-green-950/40 rounded-xl px-3 py-2 flex-1 min-w-[60px] border border-gray-100 dark:border-green-900/30">
    <div className="flex items-center gap-1">
      <Icon size={11} style={{color}} strokeWidth={2.5}/>
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</span>
    </div>
    <span className="text-base font-black text-gray-800 dark:text-white leading-none">
      {value??<span className="text-gray-300">—</span>}
      <span className="text-[10px] font-normal text-gray-400 ml-0.5">{unit}</span>
    </span>
  </div>
);

const TYPE_COLOR = {
  General:  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Succulent:"bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  Tropical: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  Herb:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Fern:     "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  Cactus:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Orchid:   "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300",
  Other:    "bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-300",
};

const PlantCard = ({ plant, reading, onDelete, index }) => {
  const [deleting,setDeleting] = useState(false);
  const badge = TYPE_COLOR[plant.plantType] || TYPE_COLOR.General;
  const updAt = reading?.created_at
    ?new Date(reading.created_at).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",hour12:true})
    :null;

  const handleDelete = async () => {
    if(!confirm(`Remove "${plant.plantName}"?`))return;
    setDeleting(true);
    await onDelete(plant.id);
    setDeleting(false);
  };

  return (
    <div className={`card-hover fade-up ${CARD} rounded-3xl p-6 shadow-sm`}
      style={{animationDelay:`${index*60}ms`}}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 dark:bg-green-900/50 rounded-2xl p-2.5 text-2xl">🌿</div>
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">{plant.plantName}</h3>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badge}`}>
              {plant.plantType || "General"}
            </span>
          </div>
        </div>
        <button onClick={handleDelete} disabled={deleting}
          className="text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl p-1.5 transition-all text-sm disabled:opacity-40">
          {deleting?"...":"✕"}
        </button>
      </div>

      {reading ? (
        <>
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
            <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">Last reading · {updAt} EST</p>
          </div>
          <div className="flex gap-2">
            <MetricPill icon={Thermometer} label="Temp"  value={reading.temperature_c}        unit="°C"  color="#f87171"/>
            <MetricPill icon={Droplets}    label="Hum"   value={reading.humidity_percent}      unit="%"   color="#60a5fa"/>
            <MetricPill icon={Sprout}      label="Soil"  value={reading.soil_moisture_percent} unit="%"   color="#34d399"/>
            <MetricPill icon={Sun}         label="Light" value={reading.light_lux}             unit="lux" color="#fbbf24"/>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-green-950/30 rounded-2xl px-4 py-3 border border-gray-100 dark:border-green-900/30">
          <Wifi size={14} className="text-green-400 animate-pulse flex-shrink-0"/>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No sensor data yet</p>
            {plant.device_id&&<p className="text-[11px] font-mono text-gray-400 mt-0.5">{plant.device_id}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const AddPlantModal = ({ onClose, onAdd }) => {
  const [form,setForm]                   = useState({plantName:"",plantType:"General",device_id:""});
  const [loading,setLoading]             = useState(false);
  const [optimalStatus,setOptimalStatus] = useState("");
  const [error,setError]                 = useState("");
  const set = (f) => (e) => setForm({...form,[f]:e.target.value});

  const handleSubmit = async () => {
    if(!form.plantName.trim()){setError("Plant name is required.");return;}
    setLoading(true);setError("");setOptimalStatus("");
    try {
      const {data:{session}} = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if(!uid){setError("You must be logged in.");return;}
      const {data,error:sbError} = await supabase.from("Plant")
        .insert([{plantName:form.plantName.trim(),plantType:form.plantType,device_id:form.device_id.trim()||null,userId:uid}])
        .select();
      if(sbError)throw sbError;
      const newPlant=data[0];
      const isGeneric=["general","other"].includes(form.plantType.toLowerCase());
      setOptimalStatus(isGeneric?"Setting standard care thresholds...":`Looking up optimal conditions for ${form.plantType}...`);
      try {
        const res=await fetch(`${BACKEND_URL}/api/optimal-conditions`,{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({plantId:newPlant.id,plantType:form.plantType}),
        });
        if(res.ok){const {optimal}=await res.json();Object.assign(newPlant,optimal);}
      }catch(e){console.warn("Optimal lookup failed:",e.message);}
      setOptimalStatus("");onAdd(newPlant);onClose();
    }catch(err){setError(err.message||"Failed to add plant.");}
    finally{setLoading(false);}
  };

  const inp = "w-full bg-gray-50 dark:bg-green-950/30 border border-gray-200 dark:border-green-900 rounded-2xl px-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={`${CARD} rounded-3xl p-8 w-full max-w-md shadow-2xl`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Add New Plant 🌱</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your plant's sensor data</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl transition-colors">✕</button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1.5 block">Plant Name *</label>
            <input className={inp} placeholder="e.g. My Monstera" value={form.plantName} onChange={set("plantName")}/>
          </div>
          <div>
            <label className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1.5 block">Plant Type</label>
            <select className={inp}
              value={["General","Succulent","Tropical","Herb","Fern","Cactus","Orchid","Other"].includes(form.plantType)?form.plantType:"Custom"}
              onChange={e=>{if(e.target.value==="Custom")setForm({...form,plantType:""});else setForm({...form,plantType:e.target.value});}}>
              {["General","Succulent","Tropical","Herb","Fern","Cactus","Orchid","Other","Custom"].map(t=>(
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {!["General","Succulent","Tropical","Herb","Fern","Cactus","Orchid","Other"].includes(form.plantType)&&(
              <input className={inp+" mt-2"} placeholder="e.g. Bonsai, Rose, Aloe..."
                value={form.plantType} onChange={e=>setForm({...form,plantType:e.target.value})}/>
            )}
            {form.plantType&&!["General","Other",""].includes(form.plantType)&&(
              <p className="text-[11px] text-green-500 mt-1.5 ml-1">✨ Optimal thresholds will be looked up for this plant type</p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1.5 block">Device ID</label>
            <input className={inp} placeholder="e.g. esp32_2" value={form.device_id} onChange={set("device_id")}/>
            <p className="text-[11px] text-gray-400 mt-1.5 ml-1">Links this plant to its ESP32 sensor</p>
          </div>
          {optimalStatus&&(
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-2xl px-4 py-2.5 border border-green-200 dark:border-green-900">
              <div className="w-3 h-3 border-2 border-green-300 border-t-green-600 rounded-full animate-spin flex-shrink-0"/>
              {optimalStatus}
            </div>
          )}
          {error&&<p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-2xl px-4 py-2.5 border border-red-200">{error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold rounded-2xl py-3 text-sm transition-colors mt-1 shadow-md">
            {loading?"Adding...":"Add Plant →"}
          </button>
        </div>
      </div>
    </div>
  );
};

const PlantProfile = () => {
  const {user} = useAuth();
  const [plants,setPlants]      = useState([]);
  const [readings,setReadings]  = useState({});
  const [loading,setLoading]    = useState(true);
  const [showModal,setShowModal] = useState(false);
  const [error,setError]        = useState("");

  useEffect(()=>{fetchAll();},[]);

  const fetchAll = async () => {
    setLoading(true);setError("");
    try {
      const {data:plantData,error:plantErr}=await supabase.from("Plant").select("*")
        .eq("userId",user.id).order("id",{ascending:true});
      if(plantErr)throw plantErr;
      const deviceIds=plantData.map(p=>p.device_id).filter(Boolean);
      let readingMap={};
      if(deviceIds.length>0){
        const {data:sensorData,error:sensorErr}=await supabase.from("esp32_readings").select("*")
          .in("device_id",deviceIds).order("created_at",{ascending:false});
        if(sensorErr)throw sensorErr;
        sensorData.forEach(r=>{if(!readingMap[r.device_id])readingMap[r.device_id]=r;});
      }
      setPlants(plantData);setReadings(readingMap);
    }catch(err){setError("Could not load data: "+err.message);}
    finally{setLoading(false);}
  };

  const handleAdd    = (plant) => setPlants(prev=>[...prev,plant]);
  const handleDelete = async (id) => {
    try{
      const {error}=await supabase.from("Plant").delete().eq("id",id);
      if(error)throw error;
      setPlants(prev=>prev.filter(p=>p.id!==id));
    }catch(err){alert("Failed to delete: "+err.message);}
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="w-full px-5 py-6 min-h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto">

          <div className="fade-up flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-black text-white dark:text-white">My Plants 🌿</h1>
              <p className="text-sm mt-1">
                <span className="font-black text-white dark:text-white">{plants.length}</span>
                <span className="text-white dark:text-white"> {plants.length===1?"plant":"plants"} added</span>
              </p>
            </div>
            <button onClick={()=>setShowModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl px-5 py-2.5 text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
              <span className="text-lg">+</span> Add Plant
            </button>
          </div>

          {error&&<div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 mb-6 text-sm">{error}</div>}

          {loading&&(
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin"/>
            </div>
          )}

          {!loading&&plants.length===0&&!error&&(
            <div className="text-center py-24">
              <div className={`${CARD} rounded-3xl p-12 shadow-xl inline-block`}>
                <div className="text-6xl mb-4">🪴</div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No plants yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Add your first plant to start tracking sensor data</p>
                <button onClick={()=>setShowModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-2xl px-6 py-2.5 text-sm font-bold transition-colors shadow-md">
                  + Add your first plant
                </button>
              </div>
            </div>
          )}

          {!loading&&plants.length>0&&(
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {plants.map((plant,i)=>(
                <PlantCard key={plant.id} plant={plant} reading={readings[plant.device_id]||null}
                  onDelete={handleDelete} index={i}/>
              ))}
            </div>
          )}
        </div>
      </div>
      {showModal&&<AddPlantModal onClose={()=>setShowModal(false)} onAdd={handleAdd}/>}
    </>
  );
};

export default PlantProfile;