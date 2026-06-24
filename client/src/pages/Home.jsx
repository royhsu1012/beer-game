import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../socket'

export default function Home() {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  function connect(cb) {
    if (!name.trim()) return setError('请输入你的名字')
    if (!socket.connected) {
      socket.connect()
      socket.once('connect', cb)
    } else cb()
  }

  function createRoom() {
    connect(() => {
      socket.emit('create_room', { name: name.trim() }, (res) => {
        if (res.error) return setError(res.error)
        nav(`/room/${res.roomCode}`, { state: { name: name.trim() } })
      })
    })
  }

  function joinRoom() {
    if (!code.trim()) return setError('请输入房间码')
    connect(() => {
      socket.emit('join_room', { roomCode: code.trim().toUpperCase(), name: name.trim() }, (res) => {
        if (res.error) return setError(res.error)
        nav(`/room/${code.trim().toUpperCase()}`, { state: { name: name.trim() } })
      })
    })
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ width:'100%', maxWidth:'400px' }}>
        <h1 style={{ fontSize:'2rem', fontWeight:'bold', textAlign:'center', marginBottom:'0.5rem' }}>🍺</h1>
        <h2 style={{ fontSize:'1.5rem', fontWeight:'bold', textAlign:'center', marginBottom:'0.5rem' }}>啤酒分销游戏</h2>
        <p style={{ textAlign:'center', color:'#94a3b8', marginBottom:'2rem', fontSize:'0.9rem' }}>体验供应链牛鞭效应的教学游戏</p>

        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="输入你的名字"
          style={{ width:'100%', padding:'0.75rem 1rem', borderRadius:'8px', border:'1px solid #334155', background:'#1e293b', color:'#e2e8f0', fontSize:'1rem', marginBottom:'1rem' }}
        />

        <button onClick={createRoom} style={{ width:'100%', padding:'0.75rem', borderRadius:'8px', background:'#3B82F6', color:'white', border:'none', fontSize:'1rem', fontWeight:'600', marginBottom:'1rem' }}>
          创建新房间
        </button>

        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem' }}>
          <input
            value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="输入房间码"
            maxLength={6}
            style={{ flex:1, padding:'0.75rem 1rem', borderRadius:'8px', border:'1px solid #334155', background:'#1e293b', color:'#e2e8f0', fontSize:'1rem', letterSpacing:'0.2em' }}
          />
          <button onClick={joinRoom} style={{ padding:'0.75rem 1.25rem', borderRadius:'8px', background:'#10B981', color:'white', border:'none', fontSize:'1rem', fontWeight:'600' }}>
            加入
          </button>
        </div>

        {error && <p style={{ color:'#EF4444', textAlign:'center', fontSize:'0.9rem' }}>{error}</p>}
      </div>
    </div>
  )
}
