import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const blank = { title: '', subjectId: '', dueDate: '', priority: 'Medium', estimatedMinutes: 30, notes: '' }

export default function TaskForm({ open, onClose, onSave, subjects, initialTask }) {
  const [form, setForm] = useState(blank)
  useEffect(() => {
    if (open) setForm(initialTask ? { ...blank, ...initialTask } : { ...blank, subjectId: subjects[0]?.id || '' })
  }, [open, initialTask, subjects])
  if (!open) return null
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const submit = (event) => {
    event.preventDefault()
    if (!form.title.trim()) return
    onSave({ ...form, title: form.title.trim(), estimatedMinutes: Number(form.estimatedMinutes) || 0 })
    onClose()
  }
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
      <div className="modal-heading"><div><span className="eyebrow">MAKE A PLAN</span><h2 id="task-modal-title">{initialTask ? 'Edit task' : 'Add a study task'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
      <form onSubmit={submit} className="form-stack">
        <label>Task name<input autoFocus value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Revise React hooks" required maxLength={100} /></label>
        <div className="form-grid">
          <label>Subject<select value={form.subjectId} onChange={(e) => update('subjectId', e.target.value)}><option value="">General</option>{subjects.map((s) => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
          <label>Priority<select value={form.priority} onChange={(e) => update('priority', e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <label>Due date<input type="date" value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} /></label>
          <label>Estimated minutes<input type="number" min="5" max="600" step="5" value={form.estimatedMinutes} onChange={(e) => update('estimatedMinutes', e.target.value)} /></label>
        </div>
        <label>Notes (optional)<textarea rows="3" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="What do you need to cover?" maxLength={500} /></label>
        <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit">{initialTask ? 'Save changes' : 'Create task'}</button></div>
      </form>
    </section>
  </div>
}