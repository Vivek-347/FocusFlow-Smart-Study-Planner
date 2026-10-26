import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'

export default function PomodoroTimer({ onSessionComplete }) {
  const [mode, setMode] = useState('focus')
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const durations = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 }
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setSeconds((value) => {
      if (value <= 1) {
        clearInterval(timer)
        setRunning(false)
        if (mode === 'focus') onSessionComplete?.(25)
        return 0
      }
      return value - 1
    }), 1000)
    return () => clearInterval(timer)
  }, [running, mode, onSessionComplete])
  const chooseMode = (next) => { setMode(next); setSeconds(durations[next]); setRunning(false) }
  const reset = () => { setRunning(false); setSeconds(durations[mode]) }
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const progress = (durations[mode] - seconds) / durations[mode]
  return <div className="timer-card">
    <div className="timer-tabs">{[['focus', 'Focus'], ['short', 'Short break'], ['long', 'Long break']].map(([key, label]) => <button key={key} onClick={() => chooseMode(key)} className={mode === key ? 'selected' : ''}>{label}</button>)}</div>
    <div className="timer-ring" style={{ '--progress': `${progress * 100}%` }}><div className="timer-inner"><span className="timer-time">{mm}:{ss}</span><span className="timer-caption">{running ? 'YOU’RE IN THE ZONE' : mode === 'focus' ? 'READY WHEN YOU ARE' : 'TAKE A BREATHER'}</span></div></div>
    <div className="timer-controls"><button className="btn btn-primary timer-start" onClick={() => seconds === 0 ? reset() : setRunning((v) => !v)}>{running ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}{running ? 'Pause session' : seconds === 0 ? 'Start again' : 'Start focus'}</button><button className="icon-button" onClick={reset} aria-label="Reset timer"><RotateCcw size={18} /></button></div>
    <p className="muted center-text">A focused session is one small win. Keep going.</p>
  </div>
}