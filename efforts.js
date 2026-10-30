export const EFFORT_STATUSES = ['Prepared', 'Submitted', 'Viewed', 'Completed', 'Acknowledged', 'Pending', 'Needs checking', 'Outcome'];
const clip = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';

export function validateEfforts(items = []) {
  if (!Array.isArray(items) || items.length > 2000) throw new Error('Invalid effort log');
  return items.map(item => {
    if (!item || !clip(item.id, 150) || !clip(item.title, 200) || !clip(item.platform, 80) || !EFFORT_STATUSES.includes(item.status)) throw new Error('Invalid effort entry');
    const date = clip(item.date, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('Invalid effort date');
    let link = '';
    if (item.link) {
      const url = new URL(item.link);
      if (url.protocol !== 'https:') throw new Error('Evidence links must use HTTPS');
      link = url.href;
    }
    const minutes = item.minutes == null || item.minutes === '' ? null : Number(item.minutes);
    if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)) throw new Error('Invalid time spent');
    return {id:clip(item.id,150),title:clip(item.title,200),date,platform:clip(item.platform,80),type:clip(item.type,80)||'Other',status:item.status,notes:clip(item.notes,2500),source:clip(item.source,1000),link,minutes,...(item.taskId ? {taskId:clip(item.taskId,150)} : {})};
  });
}

export function mergeEfforts(current, incoming) {
  const records = [...(current || [])];
  const ids = new Set(records.map(item => item.id));
  for (const item of incoming) {
    if (ids.has(item.id)) continue;
    records.push(item); ids.add(item.id);
  }
  return records;
}

export function recordCompletedTask(state, task, completedDate) {
  if (task.category === 'Personal') return state;
  const id = `completed-task-${task.id}`;
  if (!task.done) return {...state, efforts:(state.efforts || []).filter(item => item.id !== id)};
  const record = {id,taskId:task.id,title:task.title,date:completedDate,platform:/upwork/i.test(task.title)?'Upwork':/outlier/i.test(task.title)?'Outlier':task.category==='Networking'?'LinkedIn':task.category==='Portfolio'?'Portfolio':'Career Orbit',type:task.category,status:'Completed',notes:task.notes||'',source:'Marked complete in Career Orbit. Scheduled duration is not counted as actual time spent.',link:'',minutes:null};
  return {...state,efforts:mergeEfforts(state.efforts,validateEfforts([record]))};
}
