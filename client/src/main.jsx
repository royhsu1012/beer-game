import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Room from './pages/Room'
import Game from './pages/Game'
import Debrief from './pages/Debrief'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:code" element={<Room />} />
      <Route path="/game/:code" element={<Game />} />
      <Route path="/debrief" element={<Debrief />} />
    </Routes>
  </BrowserRouter>
)
