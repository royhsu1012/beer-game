import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import socket from '../socket'
import ROLE_CONFIG from '../roleConfig'
import RoleCard from '../components/RoleCard'
import GameChart from '../components/GameChart'

export default function Game() {
  const { code } = useParams()
  const { state } = useLocation()
  const nav = useNavigate()
  const [role] = useState(state?.role)
  const [showCard, setShowCard] = useState(true)
  const [week, setWeek] = useState(1)
  const [timeLeft, setTimeLeft] = useState(60)
  const [inventory, setInventory] = useState(state?.inventory ?? 12)
  const [backlog, setBacklog] = useState(state?.backlog ?? 0)
  const [pipeline, setPipeline] = useState((state?.pipeline0 ?? 4) + (state?.pipeline1 ?? 4))
  const [incomingOrder, setIncomingOrder] = useState(0)
  const [received, setReceived] = useState(0)
  const [consumerDemand, setConsumerDemand] = useState(null)
  const [orderInput, setOrderInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [progress, setProgress] = useState({ submitted: 0, total: 4 })
  const [weekResult, setWeekResult] = useState(null)
  const [cumulativeCost, setCumulativeCost] = useState(0)
  const [history, setHistory] = useState([])
  const [hint, setHint] = useState('')
  const timerRef = useRef(null)
  const cfg = ROLE_CONFIG[role] || {}

  useEffect(() => {
    socket.on('week_started', (data) => {
      setWeek(data.week); setTimeLeft(data.timeLimit)
      setInventory(data.inventory); setBacklog(data.backlog)
      setPipeline(data.pipeline0 + data.pipeline1)
      setSubmitted(false); setOrderInput(''); setWeekResult(null)
      const h = cfg.hints?.find(h => h.week === data.week)
      if (h) setHint(h.text)
    })
    socket.on('week_results', (data) => {
      setWeekResult(data.mine); setConsumerDemand(data.consumerDemand)
      setCumulativeCost(data.mine.cumulativeCost)
      setHistory(prev => [...prev, data.mine])
      setInventory(data.mine.inventory); setBacklog(data.mine.backlog)
      setReceived(data.mine.received); setIncomingOrder(data.mine.incomingDemand)
    })
    socket.on('submission_progress', (data) => {
      setProgress({ submitted: data.submittedCount, total: data.totalPlayers })
    })
    socket.on('game_finished', (data) => {
      nav('/debrief', { state: { results: data.results, fullHistory: data.fullHistory, myRole: role } })
    })
    return () => {
      socket.off('week_started'); socket.off('week_results')
      socket.off('submission_progress'); socket.off('game_finished')
    }
  }, [role])

  useEffect(() => {
    if (showCard || submitted) return
    timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(timerRef.current)
  }, [showCard, submitted, week])

  function submitOrder() {
    const qty = parseInt(orderInput)
    if (isNaN(qty) || qty < 0) return
    socket.emit('submit_order', { quantity: qty }, (res) => {
      if (!res.error) setSubmitted(true)
    })
  }

  if (!role) return <div style={{ padding:'2rem', textAlign:'center' }}>角色未设定，请重新加入房间。</div>

  return (
    <div style={{ minHeight:'100vh', padding:'0.75rem', maxWidth:'480px', margin:'0 auto' }}>
      {showCard && <RoleCard role={role} onClose={() => setShowCard(false)} />}

      {/* 顶部 */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem', background:'#1e293b', borderRadius:'8px', padding:'0.75rem 1rem' }}>
        <span style={{ color: cfg.color, fontWeight:'bold' }}>{cfg.name}</span>
        <span style={{ color:'#94a3b8', fontSize:'0.9rem' }}>第 {week} / 20 周</span>
        <span style={{ color: timeLeft <= 10 ? '#EF4444' : '#e2e8f0', fontWeight:'bold', fontSize:'1.1rem' }}>{timeLeft}s</span>
      </div>

      {/* 状态面板 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.75rem' }}>
        {[
          { label:'库存', value: inventory, color:'#10B981' },
          { label:'积压订单', value: backlog, color:'#EF4444' },
          { label:'在途货物', value: pipeline, color:'#F59E0B' },
          { label:'累计成本', value: `$${cumulativeCost.toFixed(1)}`, color:'#94a3b8' }
        ].map(item => (
          <div key={item.label} style={{ background:'#1e293b', borderRadius:'8px', padding:'0.75rem', textAlign:'center' }}>
            <p style={{ fontSize:'0.75rem', color:'#94a3b8', marginBottom:'0.25rem' }}>{item.label}</p>
            <p style={{ fontSize:'1.5rem', fontWeight:'bold', color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 本周信息 */}
      <div style={{ background:'#1e293b', borderRadius:'8px', padding:'0.75rem 1rem', marginBottom:'0.75rem', fontSize:'0.9rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
          <span style={{ color:'#94a3b8' }}>本周到货</span>
          <span style={{ fontWeight:'600', color:'#10B981' }}>+{received} 箱</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
          <span style={{ color:'#94a3b8' }}>{role === 'retailer' ? '消费者需求' : '收到订单'}</span>
          <span style={{ fontWeight:'600' }}>{incomingOrder} 箱</span>
        </div>
        {consumerDemand !== null && (
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'#94a3b8' }}>消费者需求</span>
            <span style={{ fontWeight:'600', color:'#3B82F6' }}>{consumerDemand} 箱</span>
          </div>
        )}
      </div>

      {/* 下单区 */}
      {!submitted ? (
        <div style={{ background:'#1e293b', borderRadius:'8px', padding:'1rem', marginBottom:'0.75rem' }}>
          <p style={{ fontSize:'0.85rem', color:'#94a3b8', marginBottom:'0.5rem' }}>{cfg.orderLabel}</p>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <input
              type="number" min="0" value={orderInput}
              onChange={e => setOrderInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitOrder()}
              placeholder="输入箱数"
              style={{ flex:1, padding:'0.75rem', borderRadius:'8px', border:`1px solid ${cfg.color}`, background:'#0f172a', color:'#e2e8f0', fontSize:'1.1rem', textAlign:'center' }}
            />
            <button onClick={submitOrder}
              style={{ padding:'0.75rem 1.25rem', borderRadius:'8px', background: cfg.color, color:'white', border:'none', fontWeight:'bold', fontSize:'1rem' }}>
              确认
            </button>
          </div>
          <p style={{ textAlign:'center', color:'#475569', fontSize:'0.8rem', marginTop:'0.5rem' }}>
            {progress.submitted}/{progress.total} 人已提交
          </p>
        </div>
      ) : (
        <div style={{ background:'#1e293b', borderRadius:'8px', padding:'1rem', marginBottom:'0.75rem', textAlign:'center' }}>
          <p style={{ color:'#10B981', fontWeight:'bold', marginBottom:'0.25rem' }}>✅ 已提交</p>
          <p style={{ color:'#94a3b8', fontSize:'0.85rem' }}>等待其他玩家... {progress.submitted}/{progress.total}</p>
        </div>
      )}

      {/* 本周结果 */}
      {weekResult && (
        <div style={{ background:'#1e293b', borderRadius:'8px', padding:'0.75rem 1rem', marginBottom:'0.75rem', fontSize:'0.85rem' }}>
          <p style={{ color:'#94a3b8', marginBottom:'0.5rem', fontWeight:'600' }}>本周结算</p>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'#94a3b8' }}>持有成本</span>
            <span style={{ color:'#F59E0B' }}>-${weekResult.holdingCost.toFixed(2)}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'#94a3b8' }}>缺货成本</span>
            <span style={{ color:'#EF4444' }}>-${weekResult.shortageCost.toFixed(2)}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.25rem', borderTop:'1px solid #334155', paddingTop:'0.25rem' }}>
            <span style={{ fontWeight:'600' }}>本周成本</span>
            <span style={{ fontWeight:'bold', color:'#e2e8f0' }}>-${weekResult.weekCost.toFixed(2)}</span>
          </div>
        </div>
      )}

      {hint && (
        <div style={{ background:'#1e293b', borderRadius:'8px', padding:'0.75rem 1rem', marginBottom:'0.75rem', borderLeft:`3px solid ${cfg.color}` }}>
          <p style={{ fontSize:'0.85rem', color:'#e2e8f0' }}>{hint}</p>
        </div>
      )}

      {history.length > 0 && <GameChart history={history} color={cfg.color} />}
    </div>
  )
}
