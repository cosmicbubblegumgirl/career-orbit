export const CAREER_ROUTINE = {
  version: '2026-10-30',
  start: '2026-10-30',
  end: '2026-12-22',
  timeZone: 'Africa/Johannesburg',
  blocks: [
    { key: 'morning-email', time: '08:30', duration: 15, title: 'Check emails · morning', category: 'Admin', priority: 'high', notes: 'Check inbox, spam and job alerts. Reply to recruiters, note interview deadlines and flag anything needing a longer response.' },
    { key: 'remote-search', time: '08:50', duration: 25, title: 'Find and shortlist remote jobs', category: 'Applications', priority: 'high', notes: 'Shortlist 2–3 suitable fully remote roles open to applicants based in South Africa. Check location eligibility, required skills and closing dates; add the strongest matches to Applications.' },
    { key: 'apply', time: '09:20', duration: 50, title: 'Tailor and submit one remote application', category: 'Applications', priority: 'high', notes: 'Choose one strong match, tailor the CV and project evidence, review all answers and apply. Work in two 25-minute blocks with a short pause. Log the application and its next follow-up date.' },
    { key: 'break', time: '10:10', duration: 20, title: 'Screen break · stretch and reset', category: 'Personal', priority: 'medium', notes: 'Step away from the screen, have some water and stretch. Leave this time free from job searching.' },
    { key: 'linkedin', time: '10:30', duration: 25, title: 'LinkedIn networking', category: 'Networking', priority: 'medium', notes: 'Leave two thoughtful comments and send one personalised connection request or follow-up. Focus on developers, designers, recruiters and your Umuzi/SAP network. Record useful conversations in Network.' },
    { key: 'ideas', time: '11:00', duration: 30, title: 'Brainstorm web app ideas for my portfolio', category: 'Portfolio', priority: 'medium', notes: 'Capture the user, problem, smallest useful feature and one distinctive interaction. Keep a short idea backlog and choose a practical next step.' },
    { key: 'pogo', time: '11:30', duration: 30, title: 'Pogo time', category: 'Personal', priority: 'medium', notes: 'Keep this block for Pogo time. Pause the career tasks and enjoy the break.' },
    { key: 'outlier', start: '2026-11-02', time: '12:30', duration: 30, title: 'Outlier · check projects and progress', category: 'Skills', priority: 'medium', notes: 'Check your Outlier dashboard, project availability, onboarding requirements and messages. Complete your own assigned work if available. Log actual work or preparation in Effort log; an empty queue is not completed paid work.' },
    { key: 'upwork', start: '2026-11-02', time: '13:00', duration: 45, title: 'Upwork · proposals and client follow-ups', category: 'Applications', priority: 'medium', notes: 'Review suitable remote gigs, shortlist carefully, tailor one proposal and relevant work samples, and check client messages and existing proposals. Record drafts, submitted proposals and client work separately in Effort log. Keep communication on Upwork and avoid duplicate proposals.' },
    { key: 'afternoon-email', time: '14:00', duration: 15, title: 'Check emails · afternoon', category: 'Admin', priority: 'medium', notes: 'Check for recruiter replies, interview invitations and application updates. Reply where needed and add any action or deadline to the planner.' },
    { key: 'wrap-up', time: '14:15', duration: 15, title: 'Log progress and choose tomorrow’s next step', category: 'Admin', priority: 'medium', notes: 'Update Applications and Network, note follow-ups and save your best portfolio idea. Pick one small first task for the next working day. Friday: review the week and plan Monday.' }
  ]
};

const ideaFocus = {
  1: 'Monday focus: collect three real problems a small business or learner faces.',
  2: 'Tuesday focus: choose one problem and map the user journey.',
  3: 'Wednesday focus: sketch the smallest useful app and list the essential features.',
  4: 'Thursday focus: explore the visual direction, accessibility and one memorable interaction.',
  5: 'Friday focus: pick the strongest idea, outline a small prototype and note what its portfolio case study could demonstrate.'
};

// One additive migration. Stable IDs prevent duplicate tasks when restoring older backups.
// Keeping the version after an edit or deletion respects the user's later changes.
export function populateCareerRoutine(plan, today = CAREER_ROUTINE.start) {
  const baseReady = plan.careerRoutine?.version === CAREER_ROUTINE.version;
  if (baseReady && plan.gigRoutineVersion === '2026-10-30-gigs-v1') return plan;
  const tasks = Array.isArray(plan.tasks) ? [...plan.tasks] : [];
  const ids = new Set(tasks.map(task => task.id));
  const start = today > CAREER_ROUTINE.start ? today : CAREER_ROUTINE.start;
  const date = new Date(`${start}T12:00:00Z`);
  for (; date.toISOString().slice(0, 10) <= CAREER_ROUTINE.end; date.setUTCDate(date.getUTCDate() + 1)) {
    const weekday = date.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    const day = date.toISOString().slice(0, 10);
    for (const block of CAREER_ROUTINE.blocks) {
      if (baseReady && !['outlier', 'upwork'].includes(block.key)) continue;
      if (block.start && day < block.start) continue;
      const id = `career-routine-${CAREER_ROUTINE.version}-${day}-${block.key}`;
      if (ids.has(id)) continue;
      const { key, start: blockStart, ...details } = block;
      tasks.push({ ...details, id, date: day, timeZone: CAREER_ROUTINE.timeZone, routineId: CAREER_ROUTINE.version, notes: `${details.notes}${key === 'ideas' ? ` ${ideaFocus[weekday]}` : ''}`, done: false });
      ids.add(id);
    }
  }
  return { ...plan, tasks, gigRoutineVersion: '2026-10-30-gigs-v1', careerRoutine: baseReady ? plan.careerRoutine : { version: CAREER_ROUTINE.version, from: start, through: CAREER_ROUTINE.end, timeZone: CAREER_ROUTINE.timeZone } };
}

