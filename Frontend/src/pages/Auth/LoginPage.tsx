import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login } from '@/store/slices/authSlice'
import { RootState, AppDispatch } from '@/store'
import {
  Eye, EyeOff, Mail, Lock,
  Settings, Users, DollarSign, TrendingUp, BarChart2, Shield,
} from 'lucide-react'

const FEATURES = [
  {
    Icon: Settings,
    title: 'Unified Operations',
    desc: 'Seamlessly manage projects, tasks, and workflows in one place.',
  },
  {
    Icon: Users,
    title: 'Workforce Management',
    desc: 'Empower your team with integrated tools for attendance, time tracking, and planning.',
  },
  {
    Icon: DollarSign,
    title: 'Financial Control',
    desc: 'Track invoices, payments, and expenses in real-time with accurate oversight.',
  },
  {
    Icon: TrendingUp,
    title: 'Project Tracking',
    desc: 'Monitor progress, milestones, and deadlines across all your projects.',
  },
  {
    Icon: BarChart2,
    title: 'Insights & Reporting',
    desc: 'Transform data into meaningful insights through powerful dashboards and reports.',
  },
  {
    Icon: Shield,
    title: 'Governance & Compliance',
    desc: 'Ensure security, compliance, and accountability with role-based access and audit trails.',
  },
]

export default function LoginPage() {
  const dispatch  = useDispatch<AppDispatch>()
  const navigate  = useNavigate()
  const { token, loading, error } = useSelector((s: RootState) => s.auth)

  const [email,    setEmail]    = useState(() => localStorage.getItem('remembered_email') || '')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(() => !!localStorage.getItem('remembered_email'))

  useEffect(() => { if (token) navigate('/dashboard') }, [token])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (remember) localStorage.setItem('remembered_email', email)
    else          localStorage.removeItem('remembered_email')
    dispatch(login({ email: email.trim(), password, remember }))
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ─────────────────────────────── */}
      <div className="w-full lg:w-[40%] xl:w-[38%] flex flex-col bg-white">
        <div className="flex flex-col flex-1 px-10 xl:px-16 pt-12 pb-6">

          {/* Logo */}
          <div className="mb-10">
            <NexoneLogo />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-[1.85rem] font-bold text-gray-900 leading-tight mb-2">
              Welcome back
            </h2>
            <p className="text-[15px] text-gray-500">Sign in to access your workspace</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-400" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-3 text-[14px] rounded-xl border border-gray-200 bg-white
                             placeholder-gray-300 text-gray-900
                             focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]
                             transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[14px] font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="off"
                  className="w-full pl-10 pr-11 py-3 text-[14px] rounded-xl border border-gray-200 bg-white
                             placeholder-gray-300 text-gray-900
                             focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]
                             transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-[#1e3a5f] cursor-pointer"
                />
                <span className="text-[14px] text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[14px] font-medium text-[#1a5cb0] hover:text-[#1e3a5f] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-[15px] font-semibold text-white
                         bg-[#0d1f3c] hover:bg-[#172d50] active:bg-[#0a1628]
                         flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-1"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Copyright */}
        <div className="px-10 xl:px-16 pb-6">
          <p className="text-[12px] text-gray-400">© 2026 NEXORA. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-center"
        style={{ background: 'linear-gradient(150deg, #0c1f40 0%, #091729 55%, #0b1e3d 100%)' }}
      >
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.045]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Globe decoration top-right */}
        <Globe />

        {/* Main content */}
        <div className="relative z-10 px-12 xl:px-16 py-12">
          {/* Headline */}
          <div className="mb-10 max-w-lg">
            <h1 className="text-[2.2rem] xl:text-[2.5rem] font-bold text-white leading-tight">
              Smarter operations,
            </h1>
            <h1 className="text-[2.2rem] xl:text-[2.5rem] font-bold text-blue-400 leading-tight">
              unified control
            </h1>
            <div className="w-10 h-[3px] bg-blue-500 mt-4 mb-5 rounded-full" />
            <p className="text-gray-400 text-[14px] leading-relaxed">
              Run your entire business in one integrated platform—connecting people,
              processes, finance, and clients to drive efficiency, visibility, and growth.
            </p>
          </div>

          {/* Features grid — 2 columns */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 max-w-xl">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                                bg-blue-900/40 border border-blue-700/40">
                  <Icon size={16} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white text-[13px] font-semibold mb-0.5">{title}</h3>
                  <p className="text-gray-500 text-[11.5px] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup — bottom right */}
        <DashboardMockup />
      </div>

    </div>
  )
}

/* ── NEXONE Logo ───────────────────────────────────────────── */
function NexoneLogo() {
  return (
    <div className="flex items-center gap-3">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#0d1f3c" />
        <path d="M10 28 L17 12 L20 18 L23 12 L30 28" stroke="white" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M14 28 L20 16 L26 28" stroke="#3b82f6" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      </svg>
      <div>
        <div className="text-[20px] font-bold text-[#0d1f3c] tracking-tight leading-none">
          NEX<span className="text-blue-600">ONE</span>
        </div>
        <div className="text-[11px] text-gray-400 tracking-widest mt-0.5">by NEXORA</div>
      </div>
    </div>
  )
}

/* ── Globe decoration ──────────────────────────────────────── */
function Globe() {
  const SIZE = 460
  return (
    <div
      className="absolute pointer-events-none"
      style={{ top: -SIZE * 0.25, right: -SIZE * 0.15, width: SIZE, height: SIZE }}
    >
      <div className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.18) 0%, transparent 70%)' }}
      />
      <div className="absolute inset-[8%] rounded-full"
        style={{
          background: 'radial-gradient(circle at 38% 38%, #1a4f9e 0%, #0c2a6a 40%, #060f25 80%)',
          boxShadow: '0 0 60px rgba(59,130,246,0.25)',
        }}
      />
      {[18, 30, 42, 54, 66].map(p => (
        <div key={p} className="absolute inset-0 rounded-full flex items-center justify-center">
          <div style={{
            width: `${Math.sin((p / 84) * Math.PI) * 84}%`,
            height: 1,
            background: 'rgba(99,160,255,0.15)',
            transform: `translateY(${(p - 42) * 1.5}%)`,
          }} />
        </div>
      ))}
      {[0, 30, 60, 90, 120, 150].map(deg => (
        <div key={deg} className="absolute inset-[8%] rounded-full"
          style={{ border: '1px solid rgba(99,160,255,0.1)', transform: `rotate(${deg}deg) scaleX(0.3)` }}
        />
      ))}
      {[[42,28],[58,55],[30,65],[70,40],[48,72],[62,20]].map(([t,l],i) => (
        <div key={i} className="absolute rounded-full"
          style={{ top:`${t}%`, left:`${l}%`, width:i%3===0?5:3, height:i%3===0?5:3,
            background:'#60a5fa', boxShadow:'0 0 6px rgba(96,165,250,0.8)', opacity:0.5 }}
        />
      ))}
    </div>
  )
}

/* ── Dashboard mockup ──────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="absolute pointer-events-none z-[5]"
      style={{ bottom: '5%', right: '3%', width: 340, opacity: 0.9 }}
    >
      <div className="rounded-xl overflow-hidden shadow-2xl border border-blue-900/50"
        style={{ background: '#0d1e38' }}>
        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-blue-900/60"
          style={{ background: '#091627' }}>
          <div className="w-2 h-2 rounded-full bg-red-500/70" />
          <div className="w-2 h-2 rounded-full bg-yellow-400/70" />
          <div className="w-2 h-2 rounded-full bg-green-500/70" />
          <div className="ml-auto flex items-center gap-2 flex-1 mx-4">
            <div className="flex-1 h-3 rounded-full bg-blue-900/60 flex items-center px-2">
              <div className="h-1 w-16 rounded bg-blue-700/50" />
            </div>
          </div>
          <div className="h-5 w-16 rounded bg-[#0f2240] flex items-center justify-end px-2 gap-1">
            <div className="w-4 h-4 rounded-full bg-blue-800/80 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-400/70" />
            </div>
            <div className="h-3 w-8 rounded bg-blue-900/60" />
          </div>
        </div>

        <div className="flex" style={{ height: 200 }}>
          {/* Sidebar */}
          <div className="w-20 border-r border-blue-900/40 flex flex-col py-2 px-2 gap-1"
            style={{ background: '#091627' }}>
            <div className="h-5 w-full rounded bg-blue-600/30 mb-1" />
            {['Dashboard','Projects','Tasks','Calendar','Team','Finance','Clients','Reports','Settings'].map((label, i) => (
              <div key={label} className={`h-4 w-full rounded flex items-center px-1.5 gap-1 ${i === 0 ? 'bg-blue-600/40' : ''}`}>
                <div className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ background: i === 0 ? '#60a5fa' : '#1a3a6b' }} />
                <div className="h-1.5 rounded flex-1"
                  style={{ background: i === 0 ? '#3b82f680' : '#1a3a6b60' }} />
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 p-2.5 flex flex-col gap-2">
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-1.5">
              {[['Total Projects','128','↑12%'],['Total Tasks','246','↑8%'],['Team Members','24','+2']].map(([l,v,d]) => (
                <div key={l} className="rounded-lg p-2" style={{ background: '#0f2240' }}>
                  <div className="text-[7px] mb-1" style={{ color: '#4a7cb5' }}>{l}</div>
                  <div className="text-[13px] font-bold text-white leading-none">{v}</div>
                  <div className="text-[7px] mt-0.5 text-green-400">{d}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="flex gap-1.5 flex-1">
              {/* Tasks donut */}
              <div className="rounded-lg p-2 flex-1" style={{ background: '#0f2240' }}>
                <div className="text-[7px] text-blue-400 mb-1 font-medium">Tasks Overview</div>
                <div className="flex items-center gap-2">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="16" fill="none" stroke="#1a3a6b" strokeWidth="6" />
                    <circle cx="22" cy="22" r="16" fill="none" stroke="#2563eb" strokeWidth="6"
                      strokeDasharray="50 50" strokeLinecap="round" transform="rotate(-90 22 22)" opacity="0.9" />
                    <circle cx="22" cy="22" r="16" fill="none" stroke="#16a34a" strokeWidth="6"
                      strokeDasharray="25 75" strokeDashoffset="-50" strokeLinecap="round" transform="rotate(-90 22 22)" opacity="0.8" />
                  </svg>
                  <div className="flex flex-col gap-0.5">
                    {[['To do','6','#3b82f6'],['In prog','7','#22c55e'],['Done','6','#6b7280'],['Expired','2','#ef4444']].map(([l,v,c]) => (
                      <div key={l} className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c }} />
                        <span className="text-[7px] text-gray-500">{l}</span>
                        <span className="text-[7px] font-semibold text-white ml-0.5">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="rounded-lg p-2 flex-1" style={{ background: '#0f2240' }}>
                <div className="text-[7px] text-blue-400 mb-1 font-medium">Project Progress</div>
                <div className="text-[7px] text-gray-500 mb-1">Completion rate</div>
                <div className="text-[16px] font-bold text-white leading-none mb-1.5">68%</div>
                <div className="h-1.5 rounded-full bg-blue-900/60">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: '68%' }} />
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  {[['On track','5'],['At risk','2'],['Delayed','1']].map(([l,v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-[7px] text-gray-500">{l}</span>
                      <span className="text-[7px] font-semibold text-white">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team overview */}
            <div className="rounded-lg p-2" style={{ background: '#0f2240' }}>
              <div className="text-[7px] text-blue-400 mb-1.5 font-medium">Team Overview</div>
              <div className="grid grid-cols-4 gap-1">
                {[['Members','5','#3b82f6'],['On leave','1','#f59e0b'],['Clocked in','3','#22c55e'],['Clocked out','4','#6b7280']].map(([l,v,c]) => (
                  <div key={l} className="rounded p-1 text-center" style={{ background: '#0a1a2e' }}>
                    <div className="text-[10px] font-bold" style={{ color: c }}>{v}</div>
                    <div className="text-[6px] text-gray-500 leading-tight">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
