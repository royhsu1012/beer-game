import { io } from 'socket.io-client'
const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080'
const socket = io(URL, { autoConnect: false, reconnectionAttempts: 5 })
export default socket
