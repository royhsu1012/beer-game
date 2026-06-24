import ROLE_CONFIG from '../roleConfig'

export default function RoleCard({ role, onClose }) {
  const cfg = ROLE_CONFIG[role]
  if (!cfg) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#1e293b', borderRadius:'12px', padding:'1.5rem', maxWidth:'380px', width:'100%', border:`2px solid ${cfg.color}` }}>
        <h3 style={{ color: cfg.color, fontSize:'1.25rem', fontWeight:'bold', marginBottom:'0.25rem' }}>{cfg.name}</h3>
        <p style={{ color:'#94a3b8', fontSize:'0.85rem', marginBottom:'1rem' }}>{cfg.card.description}</p>

        <div style={{ marginBottom:'0.75rem' }}>
          <p style={{ fontSize:'0.8rem', fontWeight:'600', color:'#10B981', marginBottom:'0.25rem' }}>✅ 你能看到</p>
          {cfg.card.canSee.map(s => <p key={s} style={{ fontSize:'0.8rem', color:'#94a3b8', paddingLeft:'0.5rem' }}>• {s}</p>)}
        </div>

        <div style={{ marginBottom:'0.75rem' }}>
          <p style={{ fontSize:'0.8rem', fontWeight:'600', color:'#EF4444', marginBottom:'0.25rem' }}>❌ 你看不到</p>
          {cfg.card.cannotSee.map(s => <p key={s} style={{ fontSize:'0.8rem', color:'#94a3b8', paddingLeft:'0.5rem' }}>• {s}</p>)}
        </div>

        <div style={{ background:'#0f172a', borderRadius:'8px', padding:'0.75rem', marginBottom:'1rem', borderLeft:`3px solid ${cfg.color}` }}>
          <p style={{ fontSize:'0.8rem', fontWeight:'600', marginBottom:'0.25rem' }}>🏆 胜利条件</p>
          <p style={{ fontSize:'0.85rem', color: cfg.color }}>{cfg.victoryCondition}</p>
        </div>

        <div style={{ background:'#0f172a', borderRadius:'8px', padding:'0.75rem', marginBottom:'1rem' }}>
          <p style={{ fontSize:'0.8rem', color:'#F59E0B' }}>💡 {cfg.card.tip}</p>
        </div>

        <button onClick={onClose} style={{ width:'100%', padding:'0.75rem', borderRadius:'8px', background: cfg.color, color:'white', border:'none', fontWeight:'bold', fontSize:'1rem' }}>
          我准备好了！
        </button>
      </div>
    </div>
  )
}
