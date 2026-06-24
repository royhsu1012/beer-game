import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import socket from '../socket'
import ROLE_CONFIG from '../roleConfig'

const ROLES = ['retailer', 'wholesaler', 'distributor', 'manufacturer']

export default function Room() {
  const { code } = useParams()
  const { state } = useLocation()
  const nav = useNavigate()
  const [players, setPlayers] = useState([])
  const [myRole, setMyRole] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    socket.on('room_updated', ({ players }) => setPlayers(players))
    socket.on('game_started', (data) => {
      nav(`/game/${code}`, { state: { ...data, name: state?.name } })
    })
    return () => { socket.off('room_updated'); socket.off('game_started') }
  }, [])

  function selectRole(role) {
    socket.emit('select_role', { roomCode: code, role }, (res) => {
      if (res.error) return setError(res.error)
      setMyRole(role)
    })
  }

  function startGame() {
    socket.emit('start_game', { roomCode: code }, (res) => {
      if (res.error) setError(res.error)
    })
  }

  const allReady = players.length >= 2 && players.every(p => p.role)

  return (
    <div style={{ minHeight:'100vh', padding:'1rem', maxWidth:'500px', margin:'0 auto' }}>
      <h2 style={{ textAlign:'center', marginBottom:'0.5rem' }}>等待室</h2>
      <div style={{ background:'#1e293b', borderRadius:'8px', padding:'1rem', marginBottom:'1rem', textAlign:'center' }}>
        <p style={{ color:'#94a3b8', fontSize:'0.85rem', marginBottom:'0.25rem' }}>房间码（分享给朋友）</p>
        <p style={{ fontSize:'2rem', fontWeight:'bold', letterSpacing:'0.3em', color:'#3B82F6' }}>{code}</p>
      </div>

      <div style={{ marginBottom:'1rem' }}>
        {ROLES.map(role => {
          const cfg = ROLE_CONFIG[role]
          const player = players.find(p => p.role === role)
          const isMe = myRole === role
          return (
            <div key={role} onClick={() => !player || isMe ? selectRole(role) : null}
              style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.75rem 1rem', borderRadius:'8px', marginBottom:'0.5rem', border:`2px solid ${isMe ? cfg.color : player ? '#334155' : '#1e293b'}`, background: isMe ? `${cfg.color}22` : '#1e293b', cursor: player && !isMe ? 'not-allowed' : 'pointer' }}>
              <div style={{ width:'12px', height:'12px', borderRadius:'50%', background: cfg.color, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:'600', fontSize:'0.95rem' }}>{cfg.name}</p>
                <p style={{ fontSize:'0.8rem', color:'#94a3b8' }}>{cfg.victoryCondition}</p>
              </div>
              <p style={{ fontSize:'0.9rem', color: player ? '#e2e8f0' : '#475569' }}>
                {player ? player.name : '空位'}
              </p>
            </div>
          )
        })}
      </div>

      <p style={{ textAlign:'center', color:'#94a3b8', fontSize:'0.85rem', marginBottom:'1rem' }}>
        {players.length} 人已加入 · 最少 2 人可开始
      </p>

      {allReady && (
        <button onClick={startGame} style={{ width:'100%', padding:'0.75rem', borderRadius:'8px', background:'#10B981', color:'white', border:'none', fontSize:'1rem', fontWeight:'600' }}>
          开始游戏
        </button>
      )}
      {error && <p style={{ color:'#EF4444', textAlign:'center', marginTop:'0.5rem' }}>{error}</p>}
    </div>
  )
}
