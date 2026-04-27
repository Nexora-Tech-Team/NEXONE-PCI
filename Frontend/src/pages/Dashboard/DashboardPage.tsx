import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  CheckSquare,
  Clock,
  CreditCard,
  FolderKanban,
  TrendingUp,
  Users,
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import clsx from 'clsx'
import { toast } from 'react-toastify'
import { RootState, AppDispatch } from '@/store'
import { fetchMe } from '@/store/slices/authSlice'
import { dashboardService, taskService, projectService, teamService } from '@/services/api'
import { Loading, StatusBadge, ProgressBar } from '@/components/common'
import { formatIDR } from '@/utils/format'

const TASK_COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444']

export default function DashboardPage() {
  const { user } = useSelector((s: RootState) => s.auth)
  const dispatch = useDispatch<AppDispatch>()
  const [stats, setStats] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [clockLoading, setClockLoading] = useState(false)

  const loadData = (uid?: number) => {
    Promise.all([
      dashboardService.getStats(),
      taskService.list({ assigned_to_id: uid, limit: 5 }),
      projectService.list({ status: 'open', limit: 3 }),
    ]).then(([s, t, p]) => {
      setStats(s.data)
      setTasks(t.data.data || [])
      setProjects(p.data.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData(user?.id) }, [user?.id])

  const handleClock = async () => {
    setClockLoading(true)
    try {
      if (user?.clocked_in) {
        await teamService.clockOut()
        toast.success('Clocked out successfully!')
      } else {
        await teamService.clockIn()
        toast.success('Clocked in successfully!')
      }
      await dispatch(fetchMe())
      const s = await dashboardService.getStats()
      setStats(s.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Clock action failed')
    } finally {
      setClockLoading(false)
    }
  }

  if (loading) return <div className="p-6"><Loading /></div>

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Selamat pagi'
    if (hour < 17) return 'Selamat siang'
    return 'Selamat sore'
  }

  const taskChartData = [
    { name: 'To do', value: stats?.tasks_todo ?? 0 },
    { name: 'In progress', value: stats?.tasks_in_progress ?? 0 },
    { name: 'Done', value: stats?.tasks_done ?? 0 },
    { name: 'Expired', value: stats?.tasks_expired ?? 0 },
  ]

  const incomeExpenseData = [
    { value: stats?.total_income ?? 0 },
    { value: stats?.total_expenses ?? 0 },
  ]
  const totalIE = (stats?.total_income ?? 0) + (stats?.total_expenses ?? 0)
  const incomePercent = totalIE > 0 ? Math.round(((stats?.total_income ?? 0) / totalIE) * 100) : 0

  const invoiceRows = [
    { label: 'Overdue', color: '#c0392b', val: stats?.overdue_amount ?? 0 },
    { label: 'Not paid', color: '#d97706', val: stats?.not_paid_amount ?? 0 },
    { label: 'Partially paid', color: '#2980b9', val: stats?.partially_paid_amount ?? 0 },
    { label: 'Fully paid', color: '#1e8449', val: stats?.fully_paid_amount ?? 0 },
    { label: 'Draft', color: '#94a3b8', val: stats?.draft_amount ?? 0 },
  ]

  const projectTotal =
    (stats?.open_projects ?? 0) +
    (stats?.completed_projects ?? 0) +
    (stats?.hold_projects ?? 0)
  const projectCompletion = projectTotal > 0
    ? Math.round(((stats?.completed_projects ?? 0) / projectTotal) * 100)
    : 0
  const clockedOut = Math.max((stats?.total_members ?? 0) - (stats?.clocked_in_count ?? 0), 0)

  const statCards = [
    {
      label: 'My open tasks',
      value: stats?.open_tasks ?? 0,
      hint: `${stats?.tasks_in_progress ?? 0} in progress`,
      icon: CheckSquare,
      iconClass: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Open projects',
      value: stats?.open_projects ?? 0,
      hint: `${stats?.completed_projects ?? 0} completed`,
      icon: FolderKanban,
      iconClass: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'On leave today',
      value: stats?.on_leave_today ?? 0,
      hint: `${stats?.total_members ?? 0} total members`,
      icon: Calendar,
      iconClass: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Due amount',
      value: formatIDR(stats?.due_amount ?? 0),
      hint: `${formatIDR(stats?.total_invoiced ?? 0)} invoiced`,
      icon: CreditCard,
      iconClass: 'bg-rose-50 text-rose-700',
    },
  ]

  return (
    <div className="space-y-5 p-5 md:p-6">
      <section className="grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
        <div className="overflow-hidden rounded-[22px] bg-gradient-to-br from-primary via-primary to-[#236fa0] text-white shadow-[0_24px_70px_rgba(20,64,94,0.28)]">
          <div className="flex h-full flex-col justify-between gap-6 p-6 md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Daily overview</p>
                <h2 className="mt-2 text-[28px] font-semibold leading-tight">
                  {greeting()}, {user?.name?.split(' ')[0] || 'Tim'}.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/78">
                  Ringkasan kerja hari ini sudah kami padatkan supaya Anda bisa melihat tugas, proyek,
                  billing, dan kondisi tim tanpa pindah-pindah halaman.
                </p>
              </div>

              <button
                onClick={handleClock}
                disabled={clockLoading}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/18 disabled:opacity-60"
              >
                <Clock size={14} />
                {clockLoading
                  ? 'Updating...'
                  : user?.clocked_in
                    ? 'Clock Out'
                    : 'Clock In'}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">Task health</p>
                <div className="mt-2 text-2xl font-semibold">{stats?.open_tasks ?? 0}</div>
                <p className="mt-1 text-xs text-white/68">Open task assigned to you</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">Project pace</p>
                <div className="mt-2 text-2xl font-semibold">{projectCompletion}%</div>
                <p className="mt-1 text-xs text-white/68">Completion across tracked projects</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">Team on site</p>
                <div className="mt-2 text-2xl font-semibold">{stats?.clocked_in_count ?? 0}</div>
                <p className="mt-1 text-xs text-white/68">Currently clocked in today</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-primary/10 bg-white">
          <div className="card-header border-b-primary/10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/55">Attendance</p>
              <h3 className="mt-1 text-sm font-semibold text-gray-900">Today status</h3>
            </div>
            <div className={clsx(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold',
              user?.clocked_in ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            )}>
              {user?.clocked_in ? 'Clocked In' : 'Clocked Out'}
            </div>
          </div>
          <div className="card-body space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Your session</p>
                  <div className="mt-1 text-xl font-semibold text-gray-900">
                    {user?.clocked_in ? 'Active now' : 'Not started'}
                  </div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <Clock size={18} />
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-500">
                {user?.clocked_in
                  ? 'Anda sedang tercatat aktif. Gunakan tombol clock out setelah pekerjaan selesai.'
                  : 'Mulai hari kerja dari sini agar timesheet dan kehadiran tim tetap sinkron.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <p className="text-xs text-gray-500">Clocked in</p>
                <div className="mt-1 text-lg font-semibold text-primary">{stats?.clocked_in_count ?? 0}</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <p className="text-xs text-gray-500">Clocked out</p>
                <div className="mt-1 text-lg font-semibold text-gray-800">{clockedOut}</div>
              </div>
            </div>

            <Link
              to="/team/timecards"
              className="inline-flex items-center gap-2 text-xs font-medium text-primary transition hover:text-primary/80"
            >
              Open time cards
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card">
              <div className="card-body flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">{card.label}</p>
                  <div className="mt-2 truncate text-2xl font-semibold text-gray-900">{card.value}</div>
                  <p className="mt-1 text-xs text-gray-400">{card.hint}</p>
                </div>
                <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', card.iconClass)}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr_0.95fr]">
        <div className="card">
          <div className="card-header">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/50">Projects</p>
              <span className="section-title">Projects overview</span>
            </div>
            <Link to="/projects" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 px-3 py-4">
                <div className="text-xl font-semibold text-primary">{stats?.open_projects ?? 0}</div>
                <div className="mt-1 text-xs text-gray-500">Open</div>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-4">
                <div className="text-xl font-semibold text-emerald-700">{stats?.completed_projects ?? 0}</div>
                <div className="mt-1 text-xs text-gray-500">Completed</div>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-4">
                <div className="text-xl font-semibold text-amber-700">{stats?.hold_projects ?? 0}</div>
                <div className="mt-1 text-xs text-gray-500">Hold</div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">Completion rate</span>
                <span className="font-semibold text-gray-800">{projectCompletion}%</span>
              </div>
              <ProgressBar value={projectCompletion} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/50">Finance</p>
              <span className="section-title">Invoice overview</span>
            </div>
          </div>
          <div className="card-body space-y-2.5">
            {invoiceRows.map(item => (
              <div key={item.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-gray-600">{item.label}</span>
                </div>
                <span className="font-semibold text-gray-900">{formatIDR(item.val)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-xs">
              <span className="text-gray-500">Total invoiced</span>
              <span className="font-semibold text-gray-900">{formatIDR(stats?.total_invoiced ?? 0)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/50">Flow</p>
              <span className="section-title">Income vs expenses</span>
            </div>
          </div>
          <div className="card-body flex items-center gap-4">
            <div className="relative">
              <PieChart width={112} height={112}>
                <Pie
                  data={incomeExpenseData}
                  dataKey="value"
                  cx={56}
                  cy={56}
                  innerRadius={30}
                  outerRadius={46}
                  strokeWidth={3}
                >
                  <Cell fill="#2980b9" />
                  <Cell fill="#c0392b" />
                </Pie>
                <Tooltip formatter={(v: any) => formatIDR(v)} contentStyle={{ fontSize: 10 }} />
              </PieChart>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase tracking-[0.16em] text-gray-400">Income</span>
                <span className="text-sm font-semibold text-gray-900">{incomePercent}%</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#2980b9]" />
                  <span className="text-gray-500">Income</span>
                </div>
                <div className="mt-1 font-semibold text-gray-900">{formatIDR(stats?.total_income ?? 0)}</div>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#c0392b]" />
                  <span className="text-gray-500">Expenses</span>
                </div>
                <div className="mt-1 font-semibold text-gray-900">{formatIDR(stats?.total_expenses ?? 0)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr_0.9fr]">
        <div className="card">
          <div className="card-header">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/50">Tasks</p>
              <span className="section-title">All task overview</span>
            </div>
          </div>
          <div className="card-body flex flex-col gap-4 sm:flex-row sm:items-center">
            <PieChart width={112} height={112}>
              <Pie data={taskChartData} dataKey="value" cx={56} cy={56} innerRadius={30} outerRadius={46} strokeWidth={3}>
                {taskChartData.map((_, i) => <Cell key={i} fill={TASK_COLORS[i]} />)}
              </Pie>
            </PieChart>

            <div className="grid flex-1 grid-cols-2 gap-2 text-xs">
              {taskChartData.map((item, i) => (
                <div key={item.name} className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: TASK_COLORS[i] }} />
                    <span className="text-gray-500">{item.name}</span>
                  </div>
                  <div className="mt-1 text-base font-semibold text-gray-900">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/50">Team</p>
              <span className="section-title">Team overview</span>
            </div>
          </div>
          <div className="card-body space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <div className="text-xl font-semibold text-gray-900">{stats?.total_members ?? 0}</div>
                <div className="mt-1 text-xs text-gray-500">Members</div>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <div className="text-xl font-semibold text-amber-700">{stats?.on_leave_today ?? 0}</div>
                <div className="mt-1 text-xs text-gray-500">On leave</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <div className="text-xs text-emerald-700">Clocked in</div>
                <div className="mt-1 text-lg font-semibold text-emerald-800">{stats?.clocked_in_count ?? 0}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-600">Clocked out</div>
                <div className="mt-1 text-lg font-semibold text-slate-800">{clockedOut}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/50">Performance</p>
              <span className="section-title">Quick access</span>
            </div>
          </div>
          <div className="card-body space-y-3">
            <Link to="/tasks" className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <CheckSquare size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Task board</div>
                  <div className="text-xs text-gray-500">Review assignments and deadlines</div>
                </div>
              </div>
              <ArrowRight size={15} className="text-gray-400" />
            </Link>

            <Link to="/projects" className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Project tracking</div>
                  <div className="text-xs text-gray-500">Monitor progress and completion</div>
                </div>
              </div>
              <ArrowRight size={15} className="text-gray-400" />
            </Link>

            <Link to="/team/timecards" className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Users size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Time cards</div>
                  <div className="text-xs text-gray-500">Open detailed attendance records</div>
                </div>
              </div>
              <ArrowRight size={15} className="text-gray-400" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
        <div className="table-container">
          <div className="card-header">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/50">Assignments</p>
              <span className="section-title">My tasks</span>
            </div>
            <Link to="/tasks" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Start date</th>
                <th>Deadline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-gray-400">No tasks found</td>
                </tr>
              ) : tasks.map(task => (
                <tr key={task.id}>
                  <td className="text-gray-400">{task.id}</td>
                  <td>
                    <Link to="/tasks" className="font-medium text-primary hover:underline">
                      {task.title}
                    </Link>
                  </td>
                  <td className="text-gray-500">
                    {task.start_date ? new Date(task.start_date).toLocaleDateString('id') : '-'}
                  </td>
                  <td className={clsx('text-gray-500', task.deadline && new Date(task.deadline) < new Date() && 'text-red-600')}>
                    {task.deadline ? new Date(task.deadline).toLocaleDateString('id') : '-'}
                  </td>
                  <td><StatusBadge status={task.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/50">Pipeline</p>
              <span className="section-title">Open projects</span>
            </div>
            <Link to="/projects" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <div className="card-body space-y-3">
            {projects.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">No open projects</div>
            ) : projects.map(project => (
              <div key={project.id} className="rounded-xl border border-gray-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Link
                    to={`/projects/${project.id}`}
                    className="truncate text-sm font-medium text-primary hover:underline"
                  >
                    {project.title}
                  </Link>
                  <span className="text-xs font-semibold text-gray-500">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
