import { CalendarDays, Clock3, Pencil, Trash2, Check } from 'lucide-react'
import { formatDate } from '../utils/date'

export default function TaskItem({ task, subject, onToggle, onEdit, onDelete }) {
  const overdue = !task.completed && task.dueDate && task.dueDate < new Date().toLocaleDateString('en-CA')
  return <article className={`task-item ${task.completed ? 'task-done' : ''}`}>
    <button className={`check-circle ${task.completed ? 'checked' : ''}`} onClick={() => onToggle(task.id)} aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}>{task.completed && <Check size={14} />}</button>
    <div className="task-main">
      <div className="task-title-row"><h3>{task.title}</h3><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span></div>
      <div className="task-meta">{subject && <span className="subject-tag"><i style={{ background: subject.color }} />{subject.name}</span>}<span className={overdue ? 'overdue' : ''}><CalendarDays size={13} />{task.dueDate ? formatDate(task.dueDate) : 'No deadline'}</span><span><Clock3 size={13} />{task.estimatedMinutes || 0} min</span></div>
      {task.notes && <p className="task-notes">{task.notes}</p>}
    </div>
    <div className="task-actions"><button className="icon-button small" onClick={() => onEdit(task)} title="Edit task" aria-label="Edit task"><Pencil size={15} /></button><button className="icon-button small danger-hover" onClick={() => onDelete(task.id)} title="Delete task" aria-label="Delete task"><Trash2 size={15} /></button></div>
  </article>
}