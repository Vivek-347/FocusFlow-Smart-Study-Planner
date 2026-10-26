import { ArrowUpRight } from 'lucide-react'

export default function StatCard({ icon: Icon, label, value, note, tone = 'purple' }) {
  return <article className="stat-card">
    <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-note">{note} <ArrowUpRight size={14} /></div>
  </article>
}