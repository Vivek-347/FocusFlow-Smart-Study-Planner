export function getStudyInsights(tasks, subjects, exams, dailyGoal, minutesToday) {
  const openTasks = tasks.filter((task) => !task.completed)
  const overdue = openTasks.filter((task) => task.dueDate && task.dueDate < new Date().toLocaleDateString('en-CA'))
  const subjectStats = subjects.map((subject) => {
    const related = tasks.filter((task) => task.subjectId === subject.id)
    const done = related.filter((task) => task.completed).length
    return { subject, total: related.length, done, rate: related.length ? Math.round(done / related.length * 100) : 0 }
  }).sort((a, b) => a.rate - b.rate)
  const upcoming = exams
    .filter((exam) => exam.date && exam.date >= new Date().toLocaleDateString('en-CA'))
    .sort((a, b) => a.date.localeCompare(b.date))[0]
  const insights = []
  if (overdue.length) insights.push({ title: `${overdue.length} overdue ${overdue.length === 1 ? 'task' : 'tasks'}`, detail: 'Start by clearing an overdue task to get back on track.', kind: 'warning' })
  if (subjectStats.length && subjectStats[0].total && subjectStats[0].rate < 50) insights.push({ title: `Give ${subjectStats[0].subject.name} some attention`, detail: `Only ${subjectStats[0].rate}% of its tasks are complete. Try a short focused session.`, kind: 'purple' })
  if (upcoming) {
    const diff = Math.ceil((new Date(`${upcoming.date}T00:00:00`) - new Date(`${new Date().toLocaleDateString('en-CA')}T00:00:00`)) / 86400000)
    if (diff <= 7) insights.push({ title: `${upcoming.name} is coming up`, detail: diff === 0 ? 'Your exam is today. Review your key notes.' : `Your exam is in ${diff} day${diff === 1 ? '' : 's'}. Plan a revision session.`, kind: 'blue' })
  }
  if (minutesToday < dailyGoal) insights.push({ title: 'Keep your daily goal in sight', detail: `${Math.max(0, dailyGoal - minutesToday)} minutes left to reach today's study target.`, kind: 'green' })
  if (!insights.length) insights.push({ title: 'You’re building good momentum', detail: 'Add a task or start a focus session to keep your progress moving.', kind: 'green' })
  return insights.slice(0, 4)
}