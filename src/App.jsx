import { useCallback, useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen, CheckCircle2, Clock3, Flame, Plus, ArrowRight, CalendarDays,
  Target, Sparkles, Search, Filter, Trash2, Moon, Sun, Save, RotateCcw,
  GraduationCap, CircleHelp, Check, X, Pencil, Trophy
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import StatCard from './components/StatCard.jsx'
import TaskForm from './components/TaskForm.jsx'
import TaskItem from './components/TaskItem.jsx'
import PomodoroTimer from './components/PomodoroTimer.jsx'
import { readStorage, writeStorage, clearFocusFlowStorage } from './utils/storage.js'
import { todayISO, daysUntil, formatDate } from './utils/date.js'
import { getStudyInsights } from './utils/studyInsights.js'

const initialSubjects = [
  { id: 'sub-react', name: 'React.js', color: '#7665e8', goal: 180 },
  { id: 'sub-java', name: 'Java', color: '#f29b62', goal: 180 },
  { id: 'sub-sql', name: 'SQL & Database', color: '#39b7a0', goal: 120 },
  { id: 'sub-fsd', name: 'Full Stack Development', color: '#5b9dec', goal: 240 },
]
const initialTasks = [
  { id: 'task-1', title: 'Revise React components and props', subjectId: 'sub-react', dueDate: todayISO(), priority: 'High', estimatedMinutes: 45, notes: 'Review reusable components', completed: false, createdAt: todayISO() },
  { id: 'task-2', title: 'Practice Java OOP questions', subjectId: 'sub-java', dueDate: todayISO(), priority: 'High', estimatedMinutes: 60, notes: '', completed: true, createdAt: todayISO() },
  { id: 'task-3', title: 'Write SQL JOIN queries', subjectId: 'sub-sql', dueDate: '', priority: 'Medium', estimatedMinutes: 30, notes: 'Practice INNER and LEFT JOIN', completed: false, createdAt: todayISO() },
  { id: 'task-4', title: 'Build the FocusFlow dashboard', subjectId: 'sub-fsd', dueDate: '', priority: 'Medium', estimatedMinutes: 50, notes: '', completed: false, createdAt: todayISO() },
]
const initialExams = [
  { id: 'exam-1', name: 'Full Stack Development', date: addDays(todayISO(), 9), subjectId: 'sub-fsd' },
  { id: 'exam-2', name: 'React.js Assessment', date: addDays(todayISO(), 16), subjectId: 'sub-react' },
]
function addDays(date, days) { const d = new Date(`${date}T00:00:00`); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
const pageNames = { '/': 'Dashboard', '/tasks': 'My Tasks', '/subjects': 'Subjects', '/planner': 'Study Planner', '/focus': 'Focus Timer', '/analytics': 'Analytics', '/settings': 'Settings', '/smart-tools': 'Smart Study Tools' }
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function FocusFlowApp({ user, onLogout }) {
  const [subjects, setSubjects] = useState(initialSubjects)
  const [tasks, setTasks] = useState(initialTasks)
  const [exams, setExams] = useState(initialExams)
  const [theme, setTheme] = useState('light')
  const [dailyGoal, setDailyGoal] = useState(120)
  const [studyLogs, setStudyLogs] = useState({})
  const [notes, setNotes] = useState([])
  const [flashcards, setFlashcards] = useState([])
  const [serverDataLoaded, setServerDataLoaded] = useState(false)
  const [serverDataLoadFailed, setServerDataLoadFailed] = useState(false)
  const [syncStatus, setSyncStatus] = useState('Saving your workspace…')
  const [taskModal, setTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const today = todayISO()
  const minutesToday = studyLogs[today] || 0
  useEffect(() => writeStorage('subjects', subjects), [subjects])
  useEffect(() => writeStorage('tasks', tasks), [tasks])
  useEffect(() => writeStorage('exams', exams), [exams])
  useEffect(() => writeStorage('theme', theme), [theme])
  useEffect(() => writeStorage('dailyGoal', dailyGoal), [dailyGoal])
  useEffect(() => writeStorage('studyLogs', studyLogs), [studyLogs])
  useEffect(() => writeStorage('notes', notes), [notes])
  useEffect(() => {
    let active = true
    const token = localStorage.getItem('focusflow_auth_token')
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/data`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load your saved workspace')
        return response.json()
      })
      .then(({ data }) => {
        if (!active) return
        if (data) {
          if (Array.isArray(data.subjects)) setSubjects(data.subjects)
          if (Array.isArray(data.tasks)) setTasks(data.tasks)
          if (Array.isArray(data.exams)) setExams(data.exams)
          if (typeof data.theme === 'string') setTheme(data.theme)
          if (typeof data.dailyGoal === 'number') setDailyGoal(data.dailyGoal)
          if (data.studyLogs && typeof data.studyLogs === 'object') setStudyLogs(data.studyLogs)
          if (Array.isArray(data.notes)) setNotes(data.notes)
          if (Array.isArray(data.flashcards)) setFlashcards(data.flashcards)
        }
        setSyncStatus('Synced to MySQL')
        setServerDataLoaded(true)
      })
      .catch((error) => {
        if (!active) return
        console.error(error)
        setSyncStatus('Database unavailable — check backend setup')
        setServerDataLoadFailed(true)
        setServerDataLoaded(true)
      })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!serverDataLoaded || serverDataLoadFailed) return
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('focusflow_auth_token')
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/data`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ subjects, tasks, exams, theme, dailyGoal, studyLogs, notes, flashcards }),
        })
        if (!response.ok) throw new Error('Save failed')
        setSyncStatus('All changes saved')
      } catch (error) {
        console.error(error)
        setSyncStatus('Could not sync — check backend connection')
      }
    }, 700)
    return () => clearTimeout(timer)
  }, [serverDataLoaded, serverDataLoadFailed, subjects, tasks, exams, theme, dailyGoal, studyLogs, notes, flashcards])
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  const completed = tasks.filter((t) => t.completed).length
  const openTasks = tasks.filter((t) => !t.completed)
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0
  const totalStudyMinutes = Object.values(studyLogs).reduce((sum, value) => sum + Number(value || 0), 0)
  const studyDateSet = new Set(Object.keys(studyLogs).filter((date) => Number(studyLogs[date]) > 0))
  let studyStreak = 0
  const streakCursor = new Date(`${today}T00:00:00`)
  if (!studyDateSet.has(today)) streakCursor.setDate(streakCursor.getDate() - 1)
  while (studyDateSet.has(`${streakCursor.getFullYear()}-${String(streakCursor.getMonth()+1).padStart(2,'0')}-${String(streakCursor.getDate()).padStart(2,'0')}`)) {
    studyStreak += 1
    streakCursor.setDate(streakCursor.getDate() - 1)
  }
  const xp = completed * 25 + Math.floor(totalStudyMinutes / 25) * 10
  const level = Math.floor(xp / 100) + 1
  const subjectFor = (id) => subjects.find((s) => s.id === id)
  const addStudyMinutes = useCallback((minutes) => {
    setStudyLogs((logs) => ({ ...logs, [todayISO()]: (logs[todayISO()] || 0) + minutes }))
  }, [])
  const saveTask = (task) => {
    if (editingTask) setTasks((items) => items.map((item) => item.id === editingTask.id ? { ...item, ...task } : item))
    else setTasks((items) => [{ ...task, id: uid(), completed: false, createdAt: todayISO() }, ...items])
    setEditingTask(null)
  }
  const openEdit = (task) => { setEditingTask(task); setTaskModal(true) }
  const closeTaskModal = () => { setTaskModal(false); setEditingTask(null) }
  const toggleTask = (id) => setTasks((items) => items.map((item) => item.id === id ? { ...item, completed: !item.completed, completedAt: !item.completed ? todayISO() : null } : item))
  const deleteTask = (id) => { if (window.confirm('Delete this task?')) setTasks((items) => items.filter((item) => item.id !== id)) }
  const insights = useMemo(() => getStudyInsights(tasks, subjects, exams, dailyGoal, minutesToday), [tasks, subjects, exams, dailyGoal, minutesToday])
  const common = { subjects, tasks, setTasks, exams, setExams, studyLogs, minutesToday, totalStudyMinutes, studyStreak, xp, level, dailyGoal, setDailyGoal, setStudyLogs, completed, openTasks, progress, subjectFor, addStudyMinutes, setTaskModal, openEdit, toggleTask, deleteTask, insights, today, notes, setNotes, flashcards, setFlashcards, setSubjects, setTheme }
  if (!serverDataLoaded) return <div className="auth-loading"><div className="brand-mark">F</div><h2>Loading your FocusFlow…</h2><p>Connecting to your saved study workspace.</p></div>
  if (serverDataLoadFailed) return <div className="auth-loading"><div className="brand-mark">F</div><h2>Could not load your workspace</h2><p>Check that the API and MySQL are running, then try again.</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Retry connection</button><button className="btn btn-secondary" onClick={onLogout}>Log out</button></div>
  return <div className="app-shell">
    <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    <div className="main-shell">
      <Topbar theme={theme} toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} onMenu={() => setSidebarOpen(true)} pageTitle={pageNames[location.pathname] || 'FocusFlow'} user={user} onLogout={onLogout} syncStatus={syncStatus} />
      <main className="page-content">
        <Routes>
          <Route path="/" element={<Dashboard {...common} />} />
          <Route path="/tasks" element={<TasksPage {...common} onEdit={openEdit} onAdd={() => setTaskModal(true)} />} />
          <Route path="/subjects" element={<SubjectsPage {...common} setSubjects={setSubjects} />} />
          <Route path="/planner" element={<PlannerPage {...common} onAdd={() => setTaskModal(true)} />} />
          <Route path="/focus" element={<FocusPage {...common} />} />
          <Route path="/analytics" element={<AnalyticsPage {...common} />} />
          <Route path="/smart-tools" element={<SmartToolsPage {...common} theme={theme} />} />
          <Route path="/settings" element={<SettingsPage {...common} theme={theme} setTheme={setTheme} />} />
          <Route path="*" element={<NotFound onHome={() => navigate('/')} />} />
        </Routes>
        <footer className="app-footer"><span>© {new Date().getFullYear()} FocusFlow</span><span>Made for focused minds <span className="footer-heart">♥</span></span></footer>
      </main>
    </div>
    <TaskForm open={taskModal} onClose={closeTaskModal} onSave={saveTask} subjects={subjects} initialTask={editingTask} />
  </div>
}

function SectionTitle({ eyebrow, title, subtitle, action }) {
  return <div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>
}
function Dashboard(p) {
  const navigate = useNavigate()
  const todayTasks = p.tasks.filter((t) => !t.completed && (!t.dueDate || t.dueDate <= p.today)).slice(0, 4)
  const weekly = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${p.today}T00:00:00`); date.setDate(date.getDate() - (6 - index))
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
    return { day: date.toLocaleDateString(undefined, { weekday: 'short' }), minutes: p.studyLogs[key] || 0 }
  })
  const upcoming = [...p.exams].filter((e) => e.date >= p.today).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 2)
  return <>
    <SectionTitle eyebrow="YOUR PERSONAL STUDY SPACE" title="Let's make today count." subtitle="A little progress every day adds up to big results." action={<button className="btn btn-primary" onClick={() => p.setTaskModal(true)}><Plus size={17} /> Add task</button>} />
    <div className="stats-grid">
      <StatCard icon={CheckCircle2} label="Tasks completed" value={`${p.completed}/${p.tasks.length}`} note={`${p.progress}% overall progress`} tone="purple" />
      <StatCard icon={Target} label="Daily study time" value={`${Math.floor(p.minutesToday/60)}h ${p.minutesToday%60}m`} note={`${Math.max(0,p.dailyGoal-p.minutesToday)} min to daily goal`} tone="green" />
      <StatCard icon={BookOpen} label="Active subjects" value={p.subjects.length} note="Keep your learning balanced" tone="orange" />
      <StatCard icon={Flame} label="Tasks to focus on" value={p.openTasks.length} note="One step at a time" tone="blue" />
    </div>
    <section className="panel dashboard-gamification">
      <div className="game-level-mark">🏆</div>
      <div className="game-level-copy"><span className="eyebrow">YOUR LEARNING JOURNEY</span><h2>Level {p.level} learner <span>· {p.xp} XP</span></h2><p>{p.studyStreak ? `You're on a ${p.studyStreak}-day study streak. Keep the momentum going!` : 'Start a focus session today to begin building your study streak.'}</p><div className="progress-track"><span style={{width:`${p.xp % 100}%`}}/></div><small>{100-(p.xp%100)} XP to the next level</small></div>
      <div className="game-streak"><strong>🔥 {p.studyStreak}</strong><span>day streak</span></div>
    </section>
    <div className="dashboard-grid">
      <section className="panel task-panel">
        <div className="panel-heading"><div><h2>Today's focus</h2><p>Your next small wins</p></div><button className="text-button" onClick={() => navigate('/tasks')}>View all <ArrowRight size={15} /></button></div>
        {todayTasks.length ? <div className="task-list compact">{todayTasks.map((task) => <TaskItem key={task.id} task={task} subject={p.subjectFor(task.subjectId)} onToggle={p.toggleTask} onEdit={p.openEdit} onDelete={p.deleteTask} />)}</div> : <EmptyState icon={CheckCircle2} title="You're all caught up!" copy="Add a study task whenever you're ready." action={<button className="btn btn-secondary" onClick={() => p.setTaskModal(true)}>Add a task</button>} />}
      </section>
      <section className="panel progress-panel">
        <div className="panel-heading"><div><h2>Your progress</h2><p>Task completion at a glance</p></div><span className="panel-icon"><Trophy size={18} /></span></div>
        <div className="progress-visual"><div className="progress-ring" style={{ '--progress': `${p.progress}%` }}><div><strong>{p.progress}%</strong><span>completed</span></div></div></div>
        <div className="progress-legend"><span><i className="legend-dot purple-dot" />Completed <strong>{p.completed}</strong></span><span><i className="legend-dot grey-dot" />Remaining <strong>{p.openTasks.length}</strong></span></div>
        <button className="btn btn-secondary full-width" onClick={() => navigate('/analytics')}>See analytics <ArrowRight size={15} /></button>
      </section>
    </div>
    <div className="dashboard-grid lower-grid">
      <section className="panel chart-panel"><div className="panel-heading"><div><h2>Study activity</h2><p>Minutes studied in the last 7 days</p></div><span className="chart-badge">THIS WEEK</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekly} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}><defs><linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7868e8" stopOpacity={0.22}/><stop offset="100%" stopColor="#7868e8" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }}/><Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)' }} formatter={(v) => [`${v} min`, 'Study time']}/><Area type="monotone" dataKey="minutes" stroke="#7868e8" strokeWidth={2.5} fill="url(#studyGradient)" /></AreaChart></ResponsiveContainer></div></section>
      <section className="panel insights-panel"><div className="panel-heading"><div><h2><Sparkles size={18} className="inline-icon" /> Smart insights</h2><p>Small suggestions for your next step</p></div></div><div className="insights-list">{p.insights.slice(0,3).map((item, i) => <div className="insight-row" key={i}><div className={`insight-icon ${item.kind}`}><Sparkles size={16}/></div><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div></section>
    </div>
    <div className="dashboard-grid bottom-grid">
      <section className="panel subjects-panel"><div className="panel-heading"><div><h2>Your subjects</h2><p>Track progress by subject</p></div><button className="text-button" onClick={() => navigate('/subjects')}>Manage <ArrowRight size={15}/></button></div>{p.subjects.length ? <div className="subject-progress-list">{p.subjects.slice(0,4).map((s) => { const related=p.tasks.filter(t=>t.subjectId===s.id); const done=related.filter(t=>t.completed).length; const pct=related.length?Math.round(done/related.length*100):0; return <div className="subject-progress" key={s.id}><div className="subject-progress-head"><span><i style={{background:s.color}}/>{s.name}</span><b>{pct}%</b></div><div className="progress-track"><span style={{width:`${pct}%`,background:s.color}}/></div></div> })}</div> : <EmptyState title="Add your first subject" copy="Organize your tasks by subject." action={<button className="btn btn-secondary" onClick={() => navigate('/subjects')}>Add subject</button>} />}</section>
      <section className="panel exams-panel"><div className="panel-heading"><div><h2>Upcoming exams</h2><p>Keep an eye on what's next</p></div><button className="text-button" onClick={() => navigate('/planner')}>Planner <ArrowRight size={15}/></button></div>{upcoming.length ? upcoming.map((exam) => { const days=daysUntil(exam.date); return <div className="exam-row" key={exam.id}><div className="exam-date"><strong>{new Date(`${exam.date}T00:00:00`).getDate()}</strong><span>{new Date(`${exam.date}T00:00:00`).toLocaleDateString(undefined,{month:'short'})}</span></div><div className="exam-name"><strong>{exam.name}</strong><span>{p.subjectFor(exam.subjectId)?.name || 'General exam'}</span></div><span className={`countdown ${days<=3?'soon':''}`}>{days===0?'Today':`${days} days`}</span></div> }) : <EmptyState title="No upcoming exams" copy="Add exam dates in your study planner." action={<button className="btn btn-secondary" onClick={() => navigate('/planner')}>Add exam</button>} />}</section>
    </div>
  </>
}
function EmptyState({ icon: Icon, title, copy, action }) { return <div className="empty-state">{Icon && <div className="empty-icon"><Icon size={23}/></div>}<strong>{title}</strong>{copy && <p>{copy}</p>}{action}</div> }

function TasksPage(p) {
  const [query,setQuery]=useState(''); const [status,setStatus]=useState('all'); const [priority,setPriority]=useState('all'); const [subject,setSubject]=useState('all')
  const filtered=p.tasks.filter(t=>(t.title+' '+(t.notes||'')).toLowerCase().includes(query.toLowerCase())&&(status==='all'||(status==='done'?t.completed:!t.completed))&&(priority==='all'||t.priority===priority)&&(subject==='all'||t.subjectId===subject)).sort((a,b)=>Number(a.completed)-Number(b.completed))
  return <><SectionTitle eyebrow="YOUR TASK LIST" title="Make it happen." subtitle="Break big goals into small, doable steps." action={<button className="btn btn-primary" onClick={p.onAdd}><Plus size={17}/> Add task</button>}/><div className="filter-bar"><div className="search-field"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tasks..."/></div><div className="filter-control"><Filter size={15}/><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All tasks</option><option value="open">To do</option><option value="done">Completed</option></select></div><div className="filter-control"><select value={priority} onChange={e=>setPriority(e.target.value)}><option value="all">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></div><div className="filter-control"><select value={subject} onChange={e=>setSubject(e.target.value)}><option value="all">All subjects</option>{p.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div></div><section className="panel task-page-panel"><div className="panel-heading"><div><h2>{filtered.length} {filtered.length===1?'task':'tasks'}</h2><p>Check off tasks as you complete them.</p></div><span className="small-muted">{p.completed} completed total</span></div>{filtered.length?<div className="task-list">{filtered.map(task=><TaskItem key={task.id} task={task} subject={p.subjectFor(task.subjectId)} onToggle={p.toggleTask} onEdit={p.openEdit} onDelete={p.deleteTask}/>)}</div>:<EmptyState icon={Search} title="No tasks found" copy="Try changing your filters or add a new task." action={<button className="btn btn-secondary" onClick={p.onAdd}>Create task</button>}/>}</section></>
}

function SubjectsPage({subjects,setSubjects,tasks}) {
  const [name,setName]=useState(''); const [goal,setGoal]=useState(120); const [color,setColor]=useState('#7665e8')
  const colors=['#7665e8','#f29b62','#39b7a0','#5b9dec','#e66d9b','#d1a33d']
  const add= (e)=>{e.preventDefault(); if(!name.trim())return; setSubjects(list=>[...list,{id:uid(),name:name.trim(),color,goal:Number(goal)||120}]);setName('');setGoal(120)}
  const remove=(id)=>{if(tasks.some(t=>t.subjectId===id)){if(!window.confirm('Tasks are linked to this subject. Remove the subject anyway?'))return}setSubjects(list=>list.filter(s=>s.id!==id))}
  return <><SectionTitle eyebrow="ORGANIZE YOUR LEARNING" title="Your subjects." subtitle="Keep every topic in its own lane."/><div className="subjects-layout"><section className="panel"><div className="panel-heading"><div><h2>Add a subject</h2><p>Build your personal study list</p></div><BookOpen size={20} className="muted"/></div><form className="form-stack" onSubmit={add}><label>Subject name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Data Structures" maxLength={50} required/></label><label>Weekly study goal (minutes)<input type="number" min="30" max="3000" step="30" value={goal} onChange={e=>setGoal(e.target.value)}/></label><div><span className="field-label">Choose a colour</span><div className="color-picker">{colors.map(c=><button key={c} type="button" aria-label={`Choose ${c}`} className={color===c?'chosen':''} style={{background:c}} onClick={()=>setColor(c)}>{color===c&&<Check size={15}/>}</button>)}</div></div><button className="btn btn-primary full-width" type="submit"><Plus size={17}/> Add subject</button></form></section><div className="subject-cards">{subjects.map(s=>{const related=tasks.filter(t=>t.subjectId===s.id);const done=related.filter(t=>t.completed).length;const pct=related.length?Math.round(done/related.length*100):0;return <article className="subject-card" key={s.id}><div className="subject-card-top"><div className="subject-large-icon" style={{background:`${s.color}1b`,color:s.color}}><BookOpen size={23}/></div><button className="icon-button small danger-hover" onClick={()=>remove(s.id)} aria-label={`Delete ${s.name}`}><Trash2 size={16}/></button></div><h3>{s.name}</h3><p>{related.length} {related.length===1?'task':'tasks'} · {s.goal} min/week goal</p><div className="subject-card-progress"><div className="progress-track"><span style={{width:`${pct}%`,background:s.color}}/></div><strong>{pct}%</strong></div><div className="subject-card-footer"><span>{done} done</span><span>{related.length-done} remaining</span></div></article>})}{!subjects.length&&<EmptyState title="No subjects yet" copy="Add a subject to start organizing your study plan."/>}</div></div></>
}

function PlannerPage(p) {
  const [examModal,setExamModal]=useState(false); const [examName,setExamName]=useState(''); const [examDate,setExamDate]=useState(''); const [examSubject,setExamSubject]=useState('')
  const addExam=(e)=>{e.preventDefault();if(!examName.trim()||!examDate)return;p.setExams(items=>[...items,{id:uid(),name:examName.trim(),date:examDate,subjectId:examSubject}].sort((a,b)=>a.date.localeCompare(b.date)));setExamName('');setExamDate('');setExamSubject('');setExamModal(false)}
  const removeExam=(id)=>{if(window.confirm('Delete this exam?'))p.setExams(items=>items.filter(e=>e.id!==id))}
  const days=Array.from({length:7},(_,i)=>{const date=new Date(`${p.today}T00:00:00`);date.setDate(date.getDate()+i);const iso=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;return{iso,date,items:p.tasks.filter(t=>t.dueDate===iso)}})
  return <><SectionTitle eyebrow="PLAN AHEAD" title="Your study planner." subtitle="See your week and get ready for exam day." action={<button className="btn btn-primary" onClick={()=>setExamModal(true)}><Plus size={17}/> Add exam</button>}/><section className="panel week-panel"><div className="panel-heading"><div><h2>This week</h2><p>Your tasks grouped by due date</p></div><CalendarDays className="muted" size={20}/></div><div className="week-grid">{days.map(d=><div key={d.iso} className={`week-day ${d.iso===p.today?'is-today':''}`}><span>{d.date.toLocaleDateString(undefined,{weekday:'short'})}</span><strong>{d.date.getDate()}</strong><div className="week-day-tasks">{d.items.length?d.items.map(t=><div className={`week-task ${t.completed?'done':''}`} key={t.id} title={t.title}><i style={{background:p.subjectFor(t.subjectId)?.color||'#7665e8'}}/>{t.title}</div>):<span className="no-week-task">—</span>}</div></div>)}</div></section><section className="panel exam-list-panel"><div className="panel-heading"><div><h2>Exam countdowns</h2><p>Dates worth keeping in view</p></div><GraduationCap className="muted" size={22}/></div>{p.exams.length?p.exams.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(exam=>{const d=daysUntil(exam.date);return <div className="exam-full-row" key={exam.id}><div className="exam-date large-date"><strong>{new Date(`${exam.date}T00:00:00`).getDate()}</strong><span>{new Date(`${exam.date}T00:00:00`).toLocaleDateString(undefined,{month:'short'})}</span></div><div className="exam-name"><strong>{exam.name}</strong><span>{p.subjectFor(exam.subjectId)?.name||'General exam'} · {formatDate(exam.date)}</span></div><span className={`countdown ${d<0?'past':d<=3?'soon':''}`}>{d<0?`${Math.abs(d)} days ago`:d===0?'Today':`${d} days left`}</span><button className="icon-button small danger-hover" onClick={()=>removeExam(exam.id)} aria-label="Delete exam"><Trash2 size={16}/></button></div>}):<EmptyState icon={CalendarDays} title="No exams added" copy="Add an exam date to start a countdown." action={<button className="btn btn-secondary" onClick={()=>setExamModal(true)}>Add exam</button>}/>}</section>{examModal&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setExamModal(false)}><section className="modal-card" role="dialog" aria-modal="true"><div className="modal-heading"><div><span className="eyebrow">PLAN YOUR REVISION</span><h2>Add an exam</h2></div><button className="icon-button" onClick={()=>setExamModal(false)}><X size={20}/></button></div><form className="form-stack" onSubmit={addExam}><label>Exam name<input value={examName} onChange={e=>setExamName(e.target.value)} placeholder="e.g. Java end-semester" required maxLength={80}/></label><label>Exam date<input type="date" min={p.today} value={examDate} onChange={e=>setExamDate(e.target.value)} required/></label><label>Subject<select value={examSubject} onChange={e=>setExamSubject(e.target.value)}><option value="">General</option>{p.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={()=>setExamModal(false)}>Cancel</button><button className="btn btn-primary">Save exam</button></div></form></section></div>}</>
}

function FocusPage(p) {
  const [goalNotice,setGoalNotice]=useState(false)
  const complete=useCallback((minutes)=>{p.addStudyMinutes(minutes);setGoalNotice(true);setTimeout(()=>setGoalNotice(false),4500)},[p.addStudyMinutes])
  return <><SectionTitle eyebrow="ONE THING AT A TIME" title="Find your focus." subtitle="Quiet the noise. Give one task your full attention."/><div className="focus-layout"><section className="panel focus-main"><div className="focus-welcome"><div className="focus-orb"><Target size={25}/></div><h2>Make space for deep work.</h2><p>Put distractions aside and start a focused session. Your progress is saved automatically when a focus session finishes.</p></div><PomodoroTimer onSessionComplete={complete}/>{goalNotice&&<div className="success-banner"><CheckCircle2 size={17}/> Great session! 25 minutes added to today's study time.</div>}</section><aside className="focus-side"><section className="panel goal-panel"><div className="panel-heading"><div><h2>Today's goal</h2><p>You're doing better than you think.</p></div><Target className="muted" size={19}/></div><div className="goal-big-number">{Math.min(100,Math.round(p.minutesToday/Math.max(1,p.dailyGoal)*100))}<span>%</span></div><div className="progress-track tall"><span style={{width:`${Math.min(100,p.minutesToday/Math.max(1,p.dailyGoal)*100)}%`}}/></div><div className="goal-foot"><span>{p.minutesToday} min studied</span><strong>{p.dailyGoal} min goal</strong></div></section><section className="panel focus-tips"><h2><Sparkles size={17} className="inline-icon"/> Focus tips</h2>{['Choose one task before you start.','Put your phone out of reach.','Take a real break between sessions.','Celebrate showing up, not just finishing.'].map((tip,i)=><div className="tip-row" key={tip}><span>{String(i+1).padStart(2,'0')}</span>{tip}</div>)}</section><section className="panel focus-total"><div className="focus-total-icon"><Clock3 size={20}/></div><div><strong>{Math.floor(p.minutesToday/60)}h {p.minutesToday%60}m</strong><span>Study time today</span></div></section></aside></div></>
}

function AnalyticsPage(p) {
  const taskData=p.subjects.map(s=>{const related=p.tasks.filter(t=>t.subjectId===s.id);return{name:s.name.length>14?s.name.slice(0,12)+'…':s.name,completed:related.filter(t=>t.completed).length,remaining:related.filter(t=>!t.completed).length,color:s.color,total:related.length}})
  const completionData=[{name:'Completed',value:p.completed,color:'#7665e8'},{name:'Remaining',value:p.openTasks.length,color:'#e6e7ef'}]
  const weekly=Array.from({length:7},(_,i)=>{const d=new Date(`${p.today}T00:00:00`);d.setDate(d.getDate()-(6-i));const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;return{day:d.toLocaleDateString(undefined,{weekday:'short'}),minutes:p.studyLogs[key]||0}})
  const totalMinutes=Object.values(p.studyLogs).reduce((a,b)=>a+b,0)
  return <><SectionTitle eyebrow="YOUR PROGRESS, VISUALIZED" title="Look how far you've come." subtitle="Use your progress to plan your next step."/><div className="stats-grid analytics-stats"><StatCard icon={CheckCircle2} label="Completion rate" value={`${p.progress}%`} note={`${p.completed} tasks completed`} tone="purple"/><StatCard icon={Clock3} label="Total study time" value={`${Math.floor(totalMinutes/60)}h ${totalMinutes%60}m`} note="Across recorded sessions" tone="green"/><StatCard icon={BookOpen} label="Subjects" value={p.subjects.length} note="In your study workspace" tone="orange"/><StatCard icon={Target} label="Daily target" value={`${p.dailyGoal} min`} note="Your personal study goal" tone="blue"/></div><div className="analytics-grid"><section className="panel"><div className="panel-heading"><div><h2>Study time</h2><p>Minutes recorded over the last 7 days</p></div></div><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekly} margin={{top:10,right:8,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:11}}/><Tooltip contentStyle={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:12,color:'var(--text)'}} formatter={v=>[`${v} min`,'Study time']}/><Bar dataKey="minutes" fill="#7665e8" radius={[6,6,0,0]} maxBarSize={38}/></BarChart></ResponsiveContainer></div></section><section className="panel completion-panel"><div className="panel-heading"><div><h2>Task breakdown</h2><p>Completed vs remaining</p></div></div><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={completionData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={90} paddingAngle={4} stroke="none">{completionData.map((entry,i)=><Cell key={i} fill={entry.color}/>)}</Pie><Tooltip contentStyle={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:12,color:'var(--text)'}}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{p.tasks.length}</strong><span>Total tasks</span></div></div><div className="progress-legend"><span><i className="legend-dot purple-dot"/>Completed <strong>{p.completed}</strong></span><span><i className="legend-dot grey-dot"/>Remaining <strong>{p.openTasks.length}</strong></span></div></section></div><section className="panel study-heatmap-panel"><div className="panel-heading"><div><h2>Study consistency heatmap</h2><p>Your last 28 days of recorded study activity</p></div><span className="chart-badge">28 DAYS</span></div><div className="study-heatmap">{Array.from({length:28},(_,i)=>{const d=new Date(`${p.today}T00:00:00`);d.setDate(d.getDate()-(27-i));const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const minutes=Number(p.studyLogs[key]||0);const intensity=minutes===0?0:minutes<25?1:minutes<60?2:minutes<120?3:4;return <div key={key} className={`heatmap-cell heatmap-${intensity}`} title={`${key}: ${minutes} minutes`} aria-label={`${key}: ${minutes} minutes`}><span>{new Date(`${key}T00:00:00`).getDate()}</span></div>})}</div><div className="heatmap-legend"><span>Less</span>{[0,1,2,3,4].map(level=><i key={level} className={`heatmap-cell heatmap-${level}`}/>)}<span>More</span><small>Hover a day to see study minutes.</small></div></section><section className="panel analytics-subjects"><div className="panel-heading"><div><h2>Subject progress</h2><p>Which areas are moving forward?</p></div></div>{p.subjects.length?taskData.map(s=><div className="analytics-subject-row" key={s.name}><div className="analytics-subject-title"><i style={{background:s.color}}/><strong>{s.name}</strong><span>{s.completed}/{s.total} tasks</span><b>{s.total?Math.round(s.completed/s.total*100):0}%</b></div><div className="progress-track"><span style={{width:`${s.total?Math.round(s.completed/s.total*100):0}%`,background:s.color}}/></div></div>):<EmptyState title="No subjects yet" copy="Add subjects and tasks to see progress here."/>}</section></>
}

function SettingsPage(p) {
  const [goal,setGoal]=useState(String(p.dailyGoal)); const [saved,setSaved]=useState(false)
  const save=()=>{const val=Number(goal);if(val>=15&&val<=1440){p.setDailyGoal(val);setSaved(true);setTimeout(()=>setSaved(false),2500)}}
  const clear=()=>{if(window.confirm('This will delete all FocusFlow data saved in this browser and restore the starter demo. Continue?')){clearFocusFlowStorage();window.location.reload()}}
  return <><SectionTitle eyebrow="MAKE IT YOURS" title="Settings." subtitle="Set up FocusFlow to work for you."/><div className="settings-layout"><section className="panel settings-section"><div className="settings-section-heading"><div className="settings-icon purple"><Target size={20}/></div><div><h2>Daily study goal</h2><p>Choose how many minutes you'd like to study each day.</p></div></div><div className="settings-inline"><label className="grow-label">Daily target (minutes)<input type="number" min="15" max="1440" value={goal} onChange={e=>setGoal(e.target.value)}/></label><button className="btn btn-primary settings-save" onClick={save}><Save size={16}/> Save goal</button></div>{saved&&<div className="inline-success"><Check size={15}/> Daily goal saved.</div>}<div className="quick-goals">{[30,60,120,180,240].map(v=><button key={v} className={Number(goal)===v?'selected':''} onClick={()=>setGoal(String(v))}>{v>=60?`${v/60}h${v%60?` ${v%60}m`:''}`:`${v} min`}</button>)}</div></section><section className="panel settings-section"><div className="settings-section-heading"><div className="settings-icon blue"><Sun size={20}/></div><div><h2>Appearance</h2><p>Choose the look that feels right for you.</p></div></div><div className="theme-options"><button className={`theme-option ${p.theme==='light'?'chosen':''}`} onClick={()=>p.setTheme('light')}><div className="theme-preview light-preview"><div/><div/><div/></div><span><Sun size={16}/> Light mode</span>{p.theme==='light'&&<Check size={17} className="theme-check"/>}</button><button className={`theme-option ${p.theme==='dark'?'chosen':''}`} onClick={()=>p.setTheme('dark')}><div className="theme-preview dark-preview"><div/><div/><div/></div><span><Moon size={16}/> Dark mode</span>{p.theme==='dark'&&<Check size={17} className="theme-check"/>}</button></div></section><section className="panel settings-section"><div className="settings-section-heading"><div className="settings-icon orange"><CircleHelp size={20}/></div><div><h2>About FocusFlow</h2><p>A little space to study with intention.</p></div></div><div className="about-list"><div><span>App version</span><strong>1.0.0</strong></div><div><span>Storage</span><strong>Browser LocalStorage</strong></div><div><span>Data sync</span><strong>Local device only</strong></div><div><span>Built with</span><strong>React · JavaScript · Vite</strong></div></div></section><section className="panel settings-section danger-zone"><div className="settings-section-heading"><div className="settings-icon red"><RotateCcw size={20}/></div><div><h2>Reset application data</h2><p>Remove saved subjects, tasks, exams, preferences, and study logs from this browser.</p></div></div><button className="btn btn-danger" onClick={clear}><Trash2 size={16}/> Reset all data</button></section></div></>
}
function SmartToolsPage(p) {
  const [hours, setHours] = useState('3')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [noteSubject, setNoteSubject] = useState('')
  const [cardFront, setCardFront] = useState('')
  const [cardBack, setCardBack] = useState('')
  const [cardSubject, setCardSubject] = useState('')
  const [revealed, setRevealed] = useState({})
  const [schedule, setSchedule] = useState(null)
  const [backupMessage, setBackupMessage] = useState('')
  const [remindersOn, setRemindersOn] = useState(() => readStorage('remindersOn', true))
  useEffect(() => writeStorage('remindersOn', remindersOn), [remindersOn])
  const totalMinutes = Object.values(p.studyLogs).reduce((sum, n) => sum + Number(n || 0), 0)
  const activeDates = Object.keys(p.studyLogs).filter(date => Number(p.studyLogs[date]) > 0).sort().reverse()
  let streak = 0
  const cursor = new Date(`${p.today}T00:00:00`)
  if (!activeDates.includes(p.today)) cursor.setDate(cursor.getDate() - 1)
  while (activeDates.includes(`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`)) { streak++; cursor.setDate(cursor.getDate()-1) }
  const focusScore = Math.min(100, Math.round((p.progress * .4) + (Math.min(100, p.minutesToday / Math.max(1,p.dailyGoal) * 100) * .3) + (Math.min(100, streak / 7 * 100) * .3)))
  const xp = p.completed * 25 + Math.floor(totalMinutes / 25) * 10
  const level = Math.floor(xp / 100) + 1
  const reminders = [
    ...p.tasks.filter(t => !t.completed && t.dueDate && t.dueDate <= p.today).map(t => ({id:t.id, title:t.title, detail:t.dueDate < p.today ? 'Overdue task' : 'Due today', type:'Task'})),
    ...p.exams.filter(e => e.date >= p.today && daysUntil(e.date) <= 7).map(e => ({id:e.id,title:e.name,detail:daysUntil(e.date)===0?'Exam today':`Exam in ${daysUntil(e.date)} day(s)`,type:'Exam'})),
    ...p.tasks.filter(t => !t.completed && t.priority === 'High' && (!t.dueDate || t.dueDate > p.today)).slice(0,2).map(t => ({id:`high-${t.id}`,title:t.title,detail:'High-priority task',type:'Priority'})),
  ].slice(0,8)
  const suggestions = []
  const overdue = p.tasks.filter(t=>!t.completed && t.dueDate && t.dueDate < p.today)
  const due = p.tasks.filter(t=>!t.completed && t.dueDate===p.today)
  if (overdue.length) suggestions.push(`Start with ${overdue.length} overdue task${overdue.length>1?'s':''}; pick the shortest one to build momentum.`)
  if (due.length) suggestions.push(`You have ${due.length} task${due.length>1?'s':''} due today. Prioritize these before optional revision.`)
  const weakest = p.subjects.map(s=>({...s,open:p.tasks.filter(t=>t.subjectId===s.id&&!t.completed).length,total:p.tasks.filter(t=>t.subjectId===s.id).length})).sort((a,b)=>b.open-a.open)[0]
  if (weakest && weakest.open) suggestions.push(`${weakest.name} has ${weakest.open} unfinished task${weakest.open>1?'s':''}. Consider a 25-minute focus session for it.`)
  if (p.minutesToday < p.dailyGoal) suggestions.push(`You are ${p.dailyGoal-p.minutesToday} minutes away from today's goal. Try one focused session and a short break.`)
  if (!suggestions.length) suggestions.push('Great momentum! Review your notes or prepare tomorrow’s top three tasks.')
  const buildSchedule = () => {
    let remaining = Math.max(15, Math.round((Number(hours)||1)*60))
    const queue = p.tasks.filter(t=>!t.completed).slice().sort((a,b)=>{
      const aDue = a.dueDate || '9999-12-31'; const bDue = b.dueDate || '9999-12-31'
      const aOverdue = a.dueDate && a.dueDate < p.today ? 0 : 1; const bOverdue = b.dueDate && b.dueDate < p.today ? 0 : 1
      return aOverdue-bOverdue || aDue.localeCompare(bDue) || ({High:0,Medium:1,Low:2}[a.priority] - {High:0,Medium:1,Low:2}[b.priority])
    })
    const items=[]
    for (const task of queue) { if (remaining < 15) break; const duration=Math.min(Math.max(15,Number(task.estimatedMinutes)||25),remaining); items.push({...task,plannedMinutes:duration}); remaining-=duration }
    setSchedule(items)
  }
  const saveNote = e => { e.preventDefault(); if(!noteTitle.trim()||!noteBody.trim()) return; p.setNotes(old=>[{id:uid(),title:noteTitle.trim(),body:noteBody.trim(),subjectId:noteSubject,createdAt:new Date().toISOString()},...old]);setNoteTitle('');setNoteBody('') }
  const saveCard = e => { e.preventDefault(); if(!cardFront.trim()||!cardBack.trim()) return; p.setFlashcards(old=>[{id:uid(),front:cardFront.trim(),back:cardBack.trim(),subjectId:cardSubject,createdAt:new Date().toISOString()},...old]);setCardFront('');setCardBack('') }
  const exportCSV = () => {
    const rows = [['Title', 'Subject', 'Priority', 'Due date', 'Estimated minutes', 'Status'], ...p.tasks.map((t) => [t.title, p.subjectFor(t.subjectId)?.name || 'General', t.priority, t.dueDate || '', t.estimatedMinutes || 0, t.completed ? 'Completed' : 'Pending'])]
    const csv = rows.map((row) => row.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n')
    downloadFile('focusflow-tasks.csv', csv, 'text/csv;charset=utf-8;')
  }
  const exportBackup = () => { const data={version:2,exportedAt:new Date().toISOString(),subjects:p.subjects,tasks:p.tasks,exams:p.exams,theme:p.theme||readStorage('theme','light'),dailyGoal:p.dailyGoal,studyLogs:p.studyLogs,notes:p.notes,flashcards:p.flashcards};downloadFile('focusflow-backup.json',JSON.stringify(data,null,2),'application/json');setBackupMessage('Backup downloaded. Keep it somewhere safe.') }
  const importBackup = async e => { const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.subjects)||!Array.isArray(data.tasks))throw new Error('This file does not look like a FocusFlow backup.');if(!window.confirm('Restore this backup? It will replace the current FocusFlow data in this browser.'))return;p.setSubjects(data.subjects);p.setTasks(data.tasks);p.setExams(Array.isArray(data.exams)?data.exams:[]);p.setDailyGoal(Number(data.dailyGoal)||120);p.setStudyLogs(data.studyLogs&&typeof data.studyLogs==='object'?data.studyLogs:{});p.setNotes(Array.isArray(data.notes)?data.notes:[]);p.setFlashcards(Array.isArray(data.flashcards)?data.flashcards:[]);if(data.theme)p.setTheme(data.theme);setBackupMessage('Backup restored successfully.');}catch(err){setBackupMessage(err.message||'Could not read that backup file.')}finally{e.target.value=''} }
  const badges=[{name:'First Steps',desc:'Complete your first task',earned:p.completed>=1},{name:'Getting Focused',desc:'Study for 60 minutes total',earned:totalMinutes>=60},{name:'On a Roll',desc:'Build a 3-day study streak',earned:streak>=3},{name:'Task Champion',desc:'Complete 10 tasks',earned:p.completed>=10},{name:'Deep Work',desc:'Record 5 hours of study',earned:totalMinutes>=300},{name:'Consistent Learner',desc:'Build a 7-day study streak',earned:streak>=7}]
  return <>
    <SectionTitle eyebrow="YOUR PERSONAL LEARNING COACH" title="Smart Study Tools." subtitle="Plan smarter, track consistency, and keep all your learning resources together." />
    <div className="smart-stat-grid">
      <div className="smart-stat panel"><span>🎯 Focus score</span><strong>{focusScore}<small>/100</small></strong><div className="progress-track"><span style={{width:`${focusScore}%`}}/></div><p>Based on tasks, today's goal, and study streak.</p></div>
      <div className="smart-stat panel"><span>🔥 Study streak</span><strong>{streak}<small> day{streak===1?'':'s'}</small></strong><p>{streak ? 'Nice consistency. Protect your streak today.' : 'Log a focus session to start your streak.'}</p></div>
      <div className="smart-stat panel"><span>🏆 Level & XP</span><strong>Lv. {level}</strong><p>{xp} XP earned · {100-(xp%100)} XP to next level.</p><div className="progress-track"><span style={{width:`${xp%100}%`}}/></div></div>
      <div className="smart-stat panel"><span>⏱️ Total study</span><strong>{Math.floor(totalMinutes/60)}h {totalMinutes%60}m</strong><p>Recorded focus sessions across all days.</p></div>
    </div>
    <section className="panel smart-section"><div className="panel-heading"><div><h2>🧠 AI Study Assistant</h2><p>Personalized rule-based suggestions from your current progress</p></div><span className="smart-pill">SMART INSIGHTS</span></div><div className="smart-suggestions">{suggestions.map((s,i)=><div className="smart-suggestion" key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{s}</p></div>)}</div></section>
    <section className="panel smart-section"><div className="panel-heading"><div><h2>📅 Smart Study Scheduler</h2><p>Prioritize overdue work and the nearest deadlines first</p></div></div><div className="smart-scheduler-controls"><label>Available study time (hours)<input type="number" min="0.25" max="16" step="0.25" value={hours} onChange={e=>setHours(e.target.value)}/></label><button className="btn btn-primary" onClick={buildSchedule}>Generate my schedule</button></div>{schedule&&<div className="generated-schedule">{schedule.length?schedule.map((t,i)=><div className="schedule-item" key={t.id}><span className="schedule-number">{i+1}</span><div><strong>{t.title}</strong><p>{p.subjectFor(t.subjectId)?.name||'General'} · {t.priority} priority{t.dueDate?` · Due ${t.dueDate}`:''}</p></div><b>{t.plannedMinutes} min</b></div>):<p className="small-muted">No pending tasks to schedule. Add tasks to build your plan.</p>}{schedule.length>0&&<p className="schedule-footnote">Schedule order uses task priority and due date. Add breaks between longer sessions.</p>}</div>}</section>
    <section className="panel smart-section">
      <div className="panel-heading">
        <div><h2>🔔 Smart Reminders</h2><p>Upcoming exams, overdue tasks, and important work</p></div>
        <label className="reminder-toggle"><input type="checkbox" checked={remindersOn} onChange={(e) => setRemindersOn(e.target.checked)} /> Show reminders</label>
      </div>
      {remindersOn ? (
        reminders.length > 0 ? (
          <div className="reminder-list">
            {reminders.map((r) => (
              <div className="reminder-row" key={`${r.type}-${r.id}`}>
                <span className={`reminder-type ${r.type.toLowerCase()}`}>{r.type}</span>
                <div><strong>{r.title}</strong><p>{r.detail}</p></div>
              </div>
            ))}
          </div>
        ) : <p className="small-muted">You're all clear. No urgent tasks or exams in the next 7 days.</p>
      ) : <p className="small-muted">Reminders are hidden. Turn them back on whenever you need them.</p>}
    </section>
    <section className="panel smart-section"><div className="panel-heading"><div><h2>📝 Notes & Flashcards</h2><p>Save subject notes and test yourself with revision cards</p></div></div><div className="learning-grid"><form className="form-stack" onSubmit={saveNote}><h3>Create a note</h3><label>Note title<input value={noteTitle} onChange={e=>setNoteTitle(e.target.value)} placeholder="e.g. React hooks revision" maxLength="100" required/></label><label>Subject<select value={noteSubject} onChange={e=>setNoteSubject(e.target.value)}><option value="">General</option>{p.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Note content<textarea value={noteBody} onChange={e=>setNoteBody(e.target.value)} placeholder="Write your key points..." rows="4" required/></label><button className="btn btn-primary">Save note</button></form><form className="form-stack" onSubmit={saveCard}><h3>Create a flashcard</h3><label>Question / front<input value={cardFront} onChange={e=>setCardFront(e.target.value)} placeholder="What is a React prop?" maxLength="250" required/></label><label>Subject<select value={cardSubject} onChange={e=>setCardSubject(e.target.value)}><option value="">General</option>{p.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Answer / back<textarea value={cardBack} onChange={e=>setCardBack(e.target.value)} placeholder="Write the answer..." rows="3" required/></label><button className="btn btn-primary">Save flashcard</button></form></div><div className="saved-learning-grid"><div><h3>Saved notes ({p.notes.length})</h3>{p.notes.length?p.notes.map(n=><article className="saved-note" key={n.id}><div><strong>{n.title}</strong><span>{p.subjectFor(n.subjectId)?.name||'General'}</span></div><p>{n.body}</p><button className="text-button danger-text" onClick={()=>p.setNotes(old=>old.filter(x=>x.id!==n.id))}>Delete note</button></article>):<p className="small-muted">Your notes will appear here.</p>}</div><div><h3>Flashcards ({p.flashcards.length})</h3>{p.flashcards.length?p.flashcards.map(c=><article className="flashcard" key={c.id} onClick={()=>setRevealed(old=>({...old,[c.id]:!old[c.id]}))} role="button" tabIndex="0" onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setRevealed(old=>({...old,[c.id]:!old[c.id]}))}}}><span>{p.subjectFor(c.subjectId)?.name||'General'} · Tap to flip</span><strong>{revealed[c.id]?c.back:c.front}</strong><button className="text-button danger-text" onClick={e=>{e.stopPropagation();p.setFlashcards(old=>old.filter(x=>x.id!==c.id))}}>Delete</button></article>):<p className="small-muted">Create flashcards to start revision.</p>}</div></div></section>
    <section className="panel smart-section"><div className="panel-heading"><div><h2>🏅 Achievements</h2><p>Earn XP by completing tasks and logging study time</p></div><span className="smart-pill">{badges.filter(b=>b.earned).length}/{badges.length} UNLOCKED</span></div><div className="badge-grid">{badges.map(b=><div className={`badge-card ${b.earned?'earned':''}`} key={b.name}><span>{b.earned?'🏆':'🔒'}</span><strong>{b.name}</strong><p>{b.desc}</p><small>{b.earned?'Unlocked':'Keep studying to unlock'}</small></div>)}</div></section>
    <section className="panel smart-section"><div className="panel-heading"><div><h2>📤 Export & 💾 Backup</h2><p>Download your reports or move your data to another browser</p></div></div><div className="backup-actions"><div><strong>Task report (CSV)</strong><p>Open in Excel or Google Sheets.</p><button className="btn btn-secondary" onClick={exportCSV}>Download CSV report</button></div><div><strong>Full backup (JSON)</strong><p>Includes subjects, tasks, exams, notes, flashcards, and study logs.</p><button className="btn btn-secondary" onClick={exportBackup}>Download backup</button></div><div><strong>Restore backup</strong><p>Import a previously exported FocusFlow JSON backup.</p><label className="btn btn-secondary upload-label">Choose backup file<input type="file" accept="application/json,.json" onChange={importBackup}/></label></div></div>{backupMessage&&<div className="inline-success">{backupMessage}</div>}</section>
  </>
}
function downloadFile(name, content, type) { const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url) }

function NotFound({onHome}) { return <div className="not-found panel"><div className="empty-icon"><CircleHelp size={26}/></div><h1>Page not found</h1><p>That page isn't part of your study space.</p><button className="btn btn-primary" onClick={onHome}>Back to dashboard</button></div> }


const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function App() {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('focusflow_auth_token')
    if (!token) { setCheckingSession(false); return }
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session expired')
        return response.json()
      })
      .then((result) => setUser(result.user))
      .catch(() => { localStorage.removeItem('focusflow_auth_token'); setUser(null) })
      .finally(() => setCheckingSession(false))
  }, [])

  const submitAuth = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthBusy(true)
    const form = new FormData(event.currentTarget)
    const payload = { name: form.get('name'), email: form.get('email'), password: form.get('password') }
    try {
      const response = await fetch(`${API_BASE}/auth/${authMode === 'register' ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Authentication failed')
      localStorage.setItem('focusflow_auth_token', result.token)
      setUser(result.user)
    } catch (error) {
      setAuthError(error.message || 'Unable to connect to the server. Is the backend running?')
    } finally { setAuthBusy(false) }
  }

  const logout = async () => {
    const token = localStorage.getItem('focusflow_auth_token')
    try { await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }) } catch {}
    localStorage.removeItem('focusflow_auth_token')
    setUser(null)
  }

  if (checkingSession) return <div className="auth-loading"><div className="brand-mark">F</div><h2>Welcome back to FocusFlow</h2><p>Checking your account…</p></div>
  if (!user) return <AuthPage mode={authMode} setMode={(mode) => { setAuthMode(mode); setAuthError('') }} onSubmit={submitAuth} error={authError} busy={authBusy} />
  return <FocusFlowApp key={user.id} user={user} onLogout={logout} />
}

function AuthPage({ mode, setMode, onSubmit, error, busy }) {
  const isRegister = mode === 'register'
  return <div className="auth-screen">
    <div className="auth-decoration auth-decoration-one" /><div className="auth-decoration auth-decoration-two" />
    <section className="auth-card">
      <div className="auth-brand"><div className="brand-mark">F</div><div><strong>FocusFlow</strong><span>STUDY SMARTER</span></div></div>
      <span className="eyebrow auth-eyebrow">YOUR PERSONAL STUDY SPACE</span>
      <h1>{isRegister ? 'Build your focus habit.' : 'Welcome back.'}</h1>
      <p className="auth-subtitle">{isRegister ? 'Create your account and keep your study progress in one place.' : 'Sign in to pick up right where your progress left off.'}</p>
      <form className="auth-form" onSubmit={onSubmit}>
        {isRegister && <label>Full name<input name="name" type="text" placeholder="Your name" autoComplete="name" minLength="2" maxLength="80" required /></label>}
        <label>Email address<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : 1} required /></label>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <span>→</span></button>
      </form>
      <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to FocusFlow?'} <button type="button" onClick={() => setMode(isRegister ? 'login' : 'register')}>{isRegister ? 'Sign in' : 'Create an account'}</button></p>
      <div className="auth-footnote"><span>🔒</span> Your study data is saved to your own account.</div>
    </section>
  </div>
}
