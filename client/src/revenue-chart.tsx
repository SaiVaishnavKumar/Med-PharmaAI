import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Point={date:string;revenue:string;sales:number};
export default function RevenueChart({data}:{data:Point[]}){
  return <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:14,right:12,left:0,bottom:0}}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2587cc" stopOpacity={.18}/><stop offset="95%" stopColor="#2587cc" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#edf2f5" strokeDasharray="3 4" vertical={false}/><XAxis dataKey="date" tickFormatter={v=>new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric'})} tickLine={false} axisLine={false} tick={{fontSize:9,fill:'#8c9dab'}}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:9,fill:'#8c9dab'}} width={45}/><Tooltip formatter={v=>[`₹${v}`,'Net revenue']} labelFormatter={v=>new Date(String(v)).toLocaleDateString()}/><Area type="monotone" dataKey="revenue" stroke="#2381c4" strokeWidth={2} fill="url(#revenueFill)"/></AreaChart></ResponsiveContainer>;
}
