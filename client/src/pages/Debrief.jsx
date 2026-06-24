import { useLocation } from 'react-router-dom'
import ROLE_CONFIG from '../roleConfig'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip)

const ROLES = ['retailer', 'wholesaler', 'distributor', 'manufacturer']

export default function Debrief() {
  const { state } = useLocation()
  const { results, fullHistory, myRole } = state || {}

  if (!results) return <div style={{ padding:'2rem', textAlign:'center' }}>没有游戏数据</div>

  const weeks = Array.from({ length: 20 }, (_, i) => `第${i+1}周`)

  const bullwhipData = {
    labels: weeks,
    datasets: ROLES.filter(r => fullHistory[r]).map(r => ({
      label: ROLE_CONFIG[r].name,
      data: fullHistory[r].map(w => w.orderPlaced),
      borderColor: ROLE_CONFIG[r].color,
      backgroundColor: 'transparent',
      tension: 0.3, pointRadius: 2
    }))
  }

  const sorted = [...ROLES].filter(r => results[r]).sort((a, b) => results[a].totalCost - results[b].totalCost)

  return (
    <div style={{ minHeight:'100vh', padding:'1rem', maxWidth:'480px', margin:'0 auto' }}>
      <h2 style={{ textAlign:'center', marginBottom:'1.5rem', fontSize:'1.5rem' }}>🏁 游戏结束</h2>

      {results.teamWin && (
        <div style={{ background:'#065f46', borderRadius:'8px', padding:'1rem', textAlign:'center', marginBottom:'1rem' }}>
          <p style={{ color:'#6ee7b7', fontWeight:'bold' }}>🎉 团队胜利！总成本 ${results.teamTotal?.toFixed(1)}</p>
        </div>
      )}

      {/* 排名 */}
      <div style={{ marginBottom:'1.5rem' }}>
        {sorted.map((role, i) => {
          const r = results[role]; const cfg = ROLE_CONFIG[role]
          const isMe = role === myRole
          return (
            <div key={role} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.75rem 1rem', borderRadius:'8px', marginBottom:'0.5rem', background: isMe ? `${cfg.color}22` : '#1e293b', border:`1px solid ${isMe ? cfg.color : '#334155'}` }}>
              <span style={{ fontSize:'1.25rem', fontWeight:'bold', color:'#94a3b8', width:'1.5rem' }}>#{i+1}</span>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:'600', color: cfg.color }}>{cfg.name} {isMe ? '(你)' : ''}</p>
                <p style={{ fontSize:'0.8rem', color:'#94a3b8' }}>缺货 {r.shortageWeeks} 周</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontWeight:'bold', fontSize:'1.1rem' }}>${r.totalCost?.toFixed(1)}</p>
                {r.totalCost <= cfg.excellentThreshold && <p style={{ fontSize:'0.75rem', color:'#10B981' }}>⭐ 优秀</p>}
              </div>
            </div>
          )
        })}
      </div>

      {/* 牛鞭效应图 */}
      <div style={{ background:'#1e293b', borderRadius:'8px', padding:'1rem', marginBottom:'1rem' }}>
        <p style={{ fontWeight:'600', marginBottom:'0.75rem', fontSize:'0.9rem' }}>📈 牛鞭效应：各角色订单量对比</p>
        <p style={{ fontSize:'0.8rem', color:'#94a3b8', marginBottom:'0.75rem' }}>消费者需求只从 4 箱跳到 8 箱，但上游的订单波动远大于此。</p>
        <Line data={bullwhipData} options={{ responsive:true, plugins:{ legend:{ labels:{ color:'#94a3b8', boxWidth:12 } } }, scales:{ x:{ ticks:{ color:'#64748b', maxTicksLimit:10 } }, y:{ ticks:{ color:'#64748b' } } } }} />
      </div>

      <div style={{ background:'#1e293b', borderRadius:'8px', padding:'1rem', fontSize:'0.85rem' }}>
        <p style={{ fontWeight:'600', marginBottom:'0.5rem' }}>💡 什么是牛鞭效应？</p>
        <p style={{ color:'#94a3b8', lineHeight:'1.6' }}>
          即使消费者需求变动不大，供应链上游的订单波动会越来越大。原因：每个角色只看到局部信息，在不确定中过度下单，结果放大了整体波动。
        </p>
      </div>
    </div>
  )
}
