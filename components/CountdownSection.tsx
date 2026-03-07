'use client'
import { useState, useEffect } from 'react'
import { SCHEDULE } from '@/lib/constants'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  }
}

export default function CountdownSection() {
  const [appTime, setAppTime] = useState<TimeLeft>(calculateTimeLeft(SCHEDULE.applicationDeadline))
  const [shokouTime, setShokouTime] = useState<TimeLeft>(calculateTimeLeft(SCHEDULE.shokoukaideadline))

  useEffect(() => {
    const timer = setInterval(() => {
      setAppTime(calculateTimeLeft(SCHEDULE.applicationDeadline))
      setShokouTime(calculateTimeLeft(SCHEDULE.shokoukaideadline))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const isShokouUrgent = shokouTime.days < 7
  const isAppUrgent = appTime.days < 14

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white/10 backdrop-blur rounded-xl w-12 h-12 flex items-center justify-center font-bold text-xl text-white tabular-nums">
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-xs text-white/60 mt-1">{label}</span>
    </div>
  )

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* Electronic application deadline */}
      <div className={`rounded-2xl p-4 ${isAppUrgent ? 'bg-gradient-to-br from-red-600 to-red-500 deadline-urgent' : 'bg-gradient-to-br from-primary-700 to-primary-600'} shadow-lg`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">📅</span>
          <div>
            <p className="text-white/70 text-xs">電子申請締切</p>
            <p className="text-white font-semibold text-sm">2026年4月30日 17:00</p>
          </div>
          {isAppUrgent && <span className="ml-auto bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">⚡ 急いで！</span>}
        </div>
        <div className="flex gap-2 justify-center">
          <TimeUnit value={appTime.days} label="日" />
          <div className="text-white/60 flex items-center text-xl font-light mb-4">:</div>
          <TimeUnit value={appTime.hours} label="時間" />
          <div className="text-white/60 flex items-center text-xl font-light mb-4">:</div>
          <TimeUnit value={appTime.minutes} label="分" />
          <div className="text-white/60 flex items-center text-xl font-light mb-4">:</div>
          <TimeUnit value={appTime.seconds} label="秒" />
        </div>
      </div>

      {/* Shokoukai deadline */}
      <div className={`rounded-2xl p-4 ${isShokouUrgent ? 'bg-gradient-to-br from-amber-600 to-amber-500' : 'bg-gradient-to-br from-slate-700 to-slate-600'} shadow-lg`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🏢</span>
          <div>
            <p className="text-white/70 text-xs">様式4 発行受付締切</p>
            <p className="text-white font-semibold text-sm">2026年4月16日</p>
          </div>
          {isShokouUrgent && <span className="ml-auto bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">⚡ 急ぎ</span>}
        </div>
        <div className="flex gap-2 justify-center">
          <TimeUnit value={shokouTime.days} label="日" />
          <div className="text-white/60 flex items-center text-xl font-light mb-4">:</div>
          <TimeUnit value={shokouTime.hours} label="時間" />
          <div className="text-white/60 flex items-center text-xl font-light mb-4">:</div>
          <TimeUnit value={shokouTime.minutes} label="分" />
          <div className="text-white/60 flex items-center text-xl font-light mb-4">:</div>
          <TimeUnit value={shokouTime.seconds} label="秒" />
        </div>
      </div>
    </div>
  )
}
