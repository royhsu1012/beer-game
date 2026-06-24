import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

export default function GameChart({ history, color }) {
  const labels = history.map(w => `W${w.week}`)
  const opts = { responsive:true, plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:'#64748b', font:{ size:10 } } }, y:{ ticks:{ color:'#64748b', font:{ size:10 } } } } }

  return (
    <div style={{ background:'#1e293b', borderRadius:'8px', padding:'0.75rem' }}>
      <p style={{ fontSize:'0.75rem', color:'#94a3b8', marginBottom:'0.5rem' }}>库存趋势</p>
      <Line data={{ labels, datasets:[{ data: history.map(w => w.inventory), borderColor: color, backgroundColor:'transparent', tension:0.3, pointRadius:2 }] }} options={opts} />
      <p style={{ fontSize:'0.75rem', color:'#94a3b8', margin:'0.75rem 0 0.5rem' }}>订单趋势</p>
      <Line data={{ labels, datasets:[{ data: history.map(w => w.orderPlaced), borderColor:'#F59E0B', backgroundColor:'transparent', tension:0.3, pointRadius:2 }] }} options={opts} />
    </div>
  )
}
