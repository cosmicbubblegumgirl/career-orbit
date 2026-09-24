const STORE_KEY = 'career-orbit-v1';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const isoDate = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const safe = (text = '') => String(text).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const percent = (current, target) => Math.min(100, Math.round((current / Math.max(1, target)) * 100));

const roadmap = [
  { phase: 1, title: 'Clarify & prepare', dates: '23 Sep – 20 Oct', weeks: [
    { label: 'Week 1', dates: '23–29 Sep', items: ['Block three 25-minute career sessions in the calendar', 'Polish LinkedIn headline and About section', 'Build a list of 10 target companies'] },
    { label: 'Week 2', dates: '30 Sep–6 Oct', items: ['Choose three portfolio projects to lead with', 'Draft one reusable project story', 'Follow five company or graduate pages'] },
    { label: 'Week 3', dates: '7–13 Oct', items: ['Create five tailored application building blocks', 'Ask two people for CV feedback', 'Add two trusted contacts to the reference bank'] },
    { label: 'Week 4', dates: '14–20 Oct', items: ['Publish portfolio case study one', 'Practise a 60-second introduction', 'Attend one free career or technology event'] }
  ]},
  { phase: 2, title: 'Apply & become visible', dates: '21 Oct – 17 Nov', weeks: [
    { label: 'Week 5', dates: '21–27 Oct', items: ['Submit five well-matched applications', 'Share one useful LinkedIn insight', 'Send five thoughtful connection requests'] },
    { label: 'Week 6', dates: '28 Oct–3 Nov', items: ['Publish portfolio case study two', 'Follow up on applications older than seven days', 'Have one virtual coffee chat'] },
    { label: 'Week 7', dates: '4–10 Nov', items: ['Submit five targeted applications', 'Join two relevant opportunity communities', 'Practise three common interview questions'] },
    { label: 'Week 8', dates: '11–17 Nov', items: ['Attend one free networking event', 'Follow up with two people using a clear next step', 'Review results and adjust target roles'] }
  ]},
  { phase: 3, title: 'Deepen & convert', dates: '18 Nov – 22 Dec', weeks: [
    { label: 'Week 9', dates: '18–24 Nov', items: ['Publish portfolio case study three', 'Request one mock technical interview', 'Submit five targeted applications'] },
    { label: 'Week 10', dates: '25 Nov–1 Dec', items: ['Prepare six STAR stories', 'Reconnect with three warm contacts', 'Review frontend and integration fundamentals'] },
    { label: 'Week 11', dates: '2–8 Dec', items: ['Run one portfolio walkthrough', 'Send five personal follow-ups', 'Apply to one sensible stretch role'] },
    { label: 'Week 12', dates: '9–15 Dec', items: ['Practise salary and availability answers', 'Complete one mock interview', 'Refresh the target-company list'] },
    { label: 'Week 13', dates: '16–22 Dec', items: ['Review the full 13-week scoreboard', 'Thank the people who helped', 'Plan the next 30-day experiment'] }
  ]}
];

const defaultState = () => ({
  tasks: [
    { id: uid(), title: 'Tailor one application with proof, not fluff', date: isoDate(), time: '09:00', category: 'Applications', priority: 'high', notes: 'Match the opening profile and top project evidence to the role.', done: false },
    { id: uid(), title: 'Leave two thoughtful LinkedIn comments', date: isoDate(), time: '12:30', category: 'Networking', priority: 'medium', notes: '', done: false },
    { id: uid(), title: 'Give one portfolio case study a tiny upgrade', date: isoDate(), time: '15:00', category: 'Portfolio', priority: 'medium', notes: 'One screenshot, outcome or accessibility detail is enough.', done: false }
  ],
  goals: [
    { id: uid(), title: 'Submit thoughtful applications', current: 0, target: 65, unit: 'applications', deadline: '2026-12-22' },
    { id: uid(), title: 'Publish useful LinkedIn posts', current: 0, target: 13, unit: 'posts', deadline: '2026-12-22' },
    { id: uid(), title: 'Build genuine new connections', current: 0, target: 65, unit: 'connections', deadline: '2026-12-22' },
    { id: uid(), title: 'Attend free career events', current: 0, target: 6, unit: 'events', deadline: '2026-12-22' },
    { id: uid(), title: 'Complete portfolio case studies', current: 0, target: 3, unit: 'case studies', deadline: '2026-12-22' },
    { id: uid(), title: 'Practise mock sessions', current: 0, target: 8, unit: 'sessions', deadline: '2026-12-22' }
  ],
  roadmapChecks: {},
  opportunityChecks: {},
  weeklyNetworkingChecks: {},
  applications: [],
  contacts: [
    { id: uid(), name: 'Warm contact #1', context: 'Former colleague or facilitator', next: 'Share career update' },
    { id: uid(), name: 'Warm contact #2', context: 'Developer or designer in my network', next: 'Ask for one practical tip' }
  ],
  references: [
    { id: uid(), name: 'Reference #1', relationship: 'Add name and relationship', confirmed: false },
    { id: uid(), name: 'Reference #2', relationship: 'Add name and relationship', confirmed: false },
    { id: uid(), name: 'Reference #3', relationship: 'Add name and relationship', confirmed: false },
    { id: uid(), name: 'Reference #4', relationship: 'Add name and relationship', confirmed: false },
    { id: uid(), name: 'Reference #5', relationship: 'Add name and relationship', confirmed: false }
  ],
  settings: { supabaseUrl: '', supabaseKey: '', googleClientId: '' }
});

let state = loadState();
let activeView = 'today';
let taskFilter = 'today';
let cloudClient = null;
let cloudUser = null;
let googleAccessToken = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return saved ? { ...defaultState(), ...saved } : defaultState();
  } catch { return defaultState(); }
}

function saveState(message = 'Saved on this device') {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  $('#save-state').innerHTML = `<i></i> ${safe(message)}`;
  if (cloudClient && cloudUser) syncToCloud();
}

function formatDate(date, options = { weekday: 'long', day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat('en-ZA', options).format(new Date(`${date}T12:00:00`));
}

function setView(view) {
  activeView = view;
  const titles = { today: 'Today’s orbit', plan: 'Your 13-week flight plan', goals: 'Goals that can be measured', applications: 'Application runway', network: 'People, not just profiles', calendar: 'Calendar view', settings: 'Connections & backup' };
  $('#view-title').textContent = titles[view];
  $$('.nav-item[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  $('.sidebar').classList.remove('open');
  $('#mobile-menu').setAttribute('aria-expanded', 'false');
  render();
}

function render() {
  const views = { today: renderToday, plan: renderPlan, goals: renderGoals, applications: renderApplications, network: renderNetwork, calendar: renderCalendar, settings: renderSettings };
  views[activeView]();
}

function renderToday() {
  const today = isoDate();
  let tasks = state.tasks.filter(task => taskFilter === 'all' || (taskFilter === 'done' ? task.done : task.date === today));
  if (taskFilter !== 'done') tasks.sort((a, b) => Number(a.done) - Number(b.done) || (a.time || '99:99').localeCompare(b.time || '99:99'));
  const todaysTasks = state.tasks.filter(task => task.date === today);
  const done = todaysTasks.filter(task => task.done).length;
  const progress = percent(done, todaysTasks.length || 1);
  const appGoal = state.goals.find(goal => goal.unit === 'applications');
  const connectionGoal = state.goals.find(goal => goal.unit === 'connections');

  $('#view-root').innerHTML = `
    <section class="dashboard-grid">
      <div class="stack">
        <article class="card card-pad focus-card">
          <div class="focus-grid">
            <div class="progress-ring" style="--progress:${progress * 3.6}deg"><strong>${progress}%</strong></div>
            <div class="focus-copy"><p class="eyebrow">Today’s signal</p><h2>${done === todaysTasks.length && todaysTasks.length ? 'Orbit complete. Tiny victory dance permitted.' : 'Do the next useful thing—not every possible thing.'}</h2><p>${done} of ${todaysTasks.length} tasks complete</p></div>
          </div>
        </article>
        <article class="card card-pad">
          <div class="card-head"><div><p class="eyebrow">Daily list</p><h2>Clear, checkable, kind</h2></div><button class="button primary small" data-action="add-task">+ New task</button></div>
          <div class="toolbar"><div class="filter-group"><button class="filter ${taskFilter === 'today' ? 'active' : ''}" data-filter="today">Today</button><button class="filter ${taskFilter === 'all' ? 'active' : ''}" data-filter="all">All</button><button class="filter ${taskFilter === 'done' ? 'active' : ''}" data-filter="done">Done</button></div><span class="subtle">${tasks.length} item${tasks.length === 1 ? '' : 's'}</span></div>
          <div class="task-list">${tasks.length ? tasks.map(taskTemplate).join('') : emptyTemplate('Nothing here yet', 'A blank list is either peaceful or suspicious. Add one small next step.')}</div>
        </article>
      </div>
      <aside class="stack">
        <article class="card card-pad">
          <div class="card-head"><div><p class="eyebrow">13-week scoreboard</p><h2>Steady beats dramatic</h2></div></div>
          <div class="metric-grid">
            ${metricTemplate(appGoal?.current || 0, appGoal?.target || 65, 'applications', 'coral')}
            ${metricTemplate(connectionGoal?.current || 0, connectionGoal?.target || 65, 'connections', 'mint')}
            ${metricTemplate(countRoadmapChecks(), 39, 'plan actions', '')}
            ${metricTemplate(state.applications.filter(item => item.stage === 'Interview').length, 1, 'interviews', 'mint')}
          </div>
        </article>
        <article class="card card-pad quote-card"><blockquote>“A sensible stretch is still a stretch. Apply before your inner critic writes a dissertation.”</blockquote><p>— note to future Simoné</p></article>
        <article class="card card-pad"><p class="eyebrow">Weekly rhythm</p><h2 class="section-title">Three short blocks</h2><p class="subtle">Monday: find and shortlist. Wednesday: tailor and submit. Friday: follow up, network and review.</p><button class="button ghost small" data-action="weekly-calendar">Schedule weekly rhythm</button></article>
      </aside>
    </section>`;
}

function taskTemplate(task) {
  return `<div class="task-item ${task.done ? 'completed' : ''}" data-task-id="${task.id}">
    <label class="pretty-check"><input type="checkbox" data-action="toggle-task" ${task.done ? 'checked' : ''} aria-label="Mark ${safe(task.title)} complete"><span></span></label>
    <div><span class="task-title">${safe(task.title)}</span><div class="task-meta">${task.time ? `<span>${safe(task.time)}</span>` : ''}<span class="tag">${safe(task.category)}</span>${task.priority === 'high' ? '<span class="tag coral">Must do</span>' : ''}${task.repeat ? '<span class="tag mint">Weekdays</span>' : ''}</div></div>
    <div class="task-actions"><button data-action="calendar-task" title="Add to Google Calendar" aria-label="Add to Google Calendar">▦</button><button data-action="edit-task" title="Edit" aria-label="Edit task">✎</button><button data-action="delete-task" title="Delete" aria-label="Delete task">×</button></div>
  </div>`;
}

function metricTemplate(current, target, label, tone) {
  return `<div class="metric"><strong>${current}<small> / ${target}</small></strong><small>${label}</small><div class="bar ${tone}"><span style="width:${percent(current, target)}%"></span></div></div>`;
}

function emptyTemplate(title, copy) { return `<div class="empty-state"><strong>${title}</strong>${copy}</div>`; }
function countRoadmapChecks() { return Object.values(state.roadmapChecks).filter(Boolean).length; }

function renderPlan() {
  $('#view-root').innerHTML = `<div class="toolbar"><p class="subtle">Built directly from the Task 5 instructions: recurring calendar blocks, visible LinkedIn activity, networking follow-ups, five references and strategic applications.</p><button class="button secondary" data-action="plan-calendar">Schedule weekly rhythm</button></div><section class="phase-list">${roadmap.map(phaseTemplate).join('')}</section>`;
}

function phaseTemplate(phase) {
  const keys = phase.weeks.flatMap((week, wi) => week.items.map((_, ii) => `${phase.phase}-${wi}-${ii}`));
  const complete = keys.filter(key => state.roadmapChecks[key]).length;
  return `<article class="card phase-card"><header class="phase-head"><div class="phase-number">0${phase.phase}</div><div><h2>${safe(phase.title)}</h2><p>${phase.dates} · ${phase.weeks.length} week${phase.weeks.length === 1 ? '' : 's'}</p></div><div class="phase-progress"><strong>${complete}/${keys.length}</strong><div class="bar"><span style="width:${percent(complete, keys.length)}%"></span></div></div></header><div class="week-grid">${phase.weeks.map((week, wi) => `<section class="week-block"><h3>${week.label}</h3><p>${week.dates}</p><div class="checklist">${week.items.map((item, ii) => { const key = `${phase.phase}-${wi}-${ii}`; return `<label><input type="checkbox" data-roadmap-key="${key}" ${state.roadmapChecks[key] ? 'checked' : ''}><span>${safe(item)}</span></label>`; }).join('')}</div></section>`).join('')}</div></article>`;
}

function renderGoals() {
  $('#view-root').innerHTML = `<div class="toolbar"><p class="subtle">Specific enough to measure, flexible enough to survive real life.</p><button class="button primary" data-action="add-goal">+ Add goal</button></div><section class="goal-grid">${state.goals.map(goalTemplate).join('')}</section>`;
}

function goalTemplate(goal) {
  return `<article class="card goal-card" data-goal-id="${goal.id}"><p class="eyebrow">${goal.deadline ? `Due ${formatDate(goal.deadline, {day:'numeric', month:'short'})}` : 'No deadline'}</p><h3>${safe(goal.title)}</h3><div class="goal-amount"><strong>${goal.current}<span> / ${goal.target}</span></strong><span>${safe(goal.unit)}</span></div><div class="bar"><span style="width:${percent(goal.current, goal.target)}%"></span></div><div class="goal-controls"><button class="button ghost small" data-action="decrease-goal" aria-label="Decrease progress">−</button><button class="button ghost small" data-action="increase-goal" aria-label="Increase progress">+</button><button class="button ghost small" data-action="edit-goal">Edit</button><button class="button ghost small" data-action="delete-goal">Delete</button></div></article>`;
}

function renderApplications() {
  const columns = [
    ['Wishlist', 'Tailoring'], ['Applied'], ['Interview', 'Offer'], ['Closed']
  ];
  $('#view-root').innerHTML = `<div class="toolbar"><p class="subtle">Treat each application like a small design project: fit, evidence, polish, submit.</p><button class="button primary" data-action="add-application">+ Add opportunity</button></div><section class="kanban">${columns.map((stages, index) => applicationColumn(stages, ['To shape', 'In flight', 'Conversations', 'Archived'][index])).join('')}</section>`;
}

function applicationColumn(stages, label) {
  const items = state.applications.filter(item => stages.includes(item.stage));
  return `<div class="kanban-column"><div class="kanban-head"><h2>${label}</h2><span class="count">${items.length}</span></div>${items.length ? items.map(applicationTemplate).join('') : emptyTemplate('Quiet for now', 'Add an opportunity when it earns your attention.')}</div>`;
}

function applicationTemplate(item) {
  return `<article class="application-card" data-application-id="${item.id}"><strong>${safe(item.role)}</strong><span>${safe(item.company)} · ${safe(item.stage)}</span>${item.next ? `<p><b>Next:</b> ${safe(item.next)}</p>` : '<p class="subtle">Choose the next small move.</p>'}<footer>${item.link ? `<a class="button ghost small" href="${safe(item.link)}" target="_blank" rel="noopener">Open role</a>` : '<span></span>'}<span><button class="button ghost small" data-action="move-application">Move</button> <button class="button ghost small" data-action="delete-application">×</button></span></footer></article>`;
}

function renderNetwork() {
  $('#view-root').innerHTML = `<section class="two-column"><article class="card card-pad"><div class="card-head"><div><p class="eyebrow">Relationship map</p><h2>Warm contacts & follow-ups</h2></div><button class="button primary small" data-action="add-contact">+ Add person</button></div><div class="contact-list">${state.contacts.map(contact => `<div class="person-row" data-contact-id="${contact.id}"><div style="display:flex;gap:11px;align-items:center"><span class="initials">${safe(contact.name.split(/\s+/).map(word => word[0]).slice(0,2).join('').toUpperCase())}</span><div><strong>${safe(contact.name)}</strong><small>${safe(contact.context)} · Next: ${safe(contact.next)}</small></div></div><button class="button ghost small" data-action="contact-done">Done</button></div>`).join('')}</div><p class="subtle">A good follow-up is personal, specific and ends with a gentle next step—advice, a short call or a coffee chat.</p></article><article class="card card-pad"><div class="card-head"><div><p class="eyebrow">Top five</p><h2>Reference bank</h2></div></div><div class="reference-list">${state.references.map(reference => `<label class="reference-row"><div><strong>${safe(reference.name)}</strong><small>${safe(reference.relationship)}</small></div><input type="checkbox" data-reference-id="${reference.id}" ${reference.confirmed ? 'checked' : ''} aria-label="Reference confirmed"></label>`).join('')}</div><p class="subtle">Confirm permission, preferred contact details and what each person can confidently speak about.</p></article></section>`;
  renderOpportunityRadar();
}

const opportunitySources = [
  {
    "id": "umuzi",
    "name": "Umuzi",
    "platform": "LinkedIn",
    "why": "Learner, alumni and employer updates.",
    "url": "https://www.linkedin.com/search/results/companies/?keywords=Umuzi"
  },
  {
    "id": "sap",
    "name": "SAP and SAP University Alliances",
    "platform": "LinkedIn",
    "why": "SAP training, events and graduate opportunities.",
    "url": "https://www.linkedin.com/search/results/companies/?keywords=SAP"
  },
  {
    "id": "afsug",
    "name": "African SAP User Group (AFSUG)",
    "platform": "LinkedIn",
    "why": "Industry conversations and professional networking.",
    "url": "https://www.linkedin.com/search/results/companies/?keywords=African%20SAP%20User%20Group"
  },
  {
    "id": "offerzen",
    "name": "OfferZen",
    "platform": "LinkedIn / website",
    "why": "Developer opportunities and local hiring insights.",
    "url": "https://www.offerzen.com/"
  },
  {
    "id": "wethinkcode",
    "name": "WeThinkCode_",
    "platform": "LinkedIn",
    "why": "Developer community and career updates.",
    "url": "https://www.linkedin.com/search/results/companies/?keywords=WeThinkCode"
  },
  {
    "id": "microsoft",
    "name": "Microsoft Learn",
    "platform": "Website / LinkedIn",
    "why": "Free sessions to strengthen my frontend and cloud skills.",
    "url": "https://learn.microsoft.com/en-us/training/"
  },
  {
    "id": "devmeetup",
    "name": "DevMeetup Cape Town",
    "platform": "Community website",
    "why": "Developer meetups, hackathons and new connections.",
    "url": "https://hackathon.devmeetup.capetown/docs/about"
  },
  {
    "id": "sapcommunity",
    "name": "SAP Community",
    "platform": "Community website",
    "why": "SAP Integration Suite discussions, learning and events.",
    "url": "https://community.sap.com/"
  },
  {
    "id": "github",
    "name": "GitHub developer communities",
    "platform": "GitHub",
    "why": "Learn from open-source work and share my own projects.",
    "url": "https://github.com/"
  },
  {
    "id": "jobalerts",
    "name": "Junior remote frontend / UX / SAP job alerts",
    "platform": "LinkedIn Jobs",
    "why": "Check eligibility for South African applicants before applying.",
    "url": "https://www.linkedin.com/jobs/search/?keywords=junior%20frontend%20developer&f_WT=2"
  },
  {
    "id": "recruiters",
    "name": "Relevant recruiters and employers",
    "platform": "LinkedIn",
    "why": "Follow hiring teams and respond to suitable opportunities.",
    "url": "https://www.linkedin.com/search/results/people/?keywords=technical%20recruiter%20South%20Africa"
  }
];
const weeklyNetworkingActions = [
  {
    "id": "roles",
    "text": "Check my alerts and shortlist up to three suitable remote junior frontend, UX or SAP roles."
  },
  {
    "id": "engage",
    "text": "Follow two relevant pages and leave two specific, thoughtful comments."
  },
  {
    "id": "post",
    "text": "Share one genuine project update or lesson from Mind Weather, Resume Radar, Career Orbit or SAP learning."
  },
  {
    "id": "connect",
    "text": "Reconnect with one person or send a personalised post-event message with a clear question."
  },
  {
    "id": "events",
    "text": "Look for free webinars and meetups; attend when one fits my calendar and follow up afterwards."
  }
];

function orbitRadarWeekKey(){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return isoDate(d);}

function renderOpportunityRadar(){
 const done=state.opportunityChecks ||= {};
 const allWeeks=state.weeklyNetworkingChecks ||= {};
 const week=allWeeks[orbitRadarWeekKey()] ||= {};
 const section=document.createElement('section');section.className='opportunity-radar';
 section.innerHTML='<article class="card card-pad"><p class="eyebrow">My opportunity radar</p><h2>Follow with purpose, not just for the numbers</h2><p class="subtle">I am looking for junior frontend, UX/UI and SAP opportunities I can genuinely apply for from South Africa. These are accounts and channels I plan to follow for hiring updates, free events and useful conversations.</p><p class="radar-progress" data-radar-count></p><div class="radar-list" data-radar-list></div><p class="subtle">Each checkbox means I actually followed that account or channel. LinkedIn links open searches so I can choose the correct official page.</p></article><article class="card card-pad"><div class="card-head"><div><p class="eyebrow">My weekly networking checklist</p><h2>Small steps, real connections</h2></div><button type="button" class="button secondary small" data-action="radar-schedule">Schedule a 25-minute check</button></div><p class="subtle">A fresh checklist starts on Mondays. Previous weeks stay in my saved plan. I will use my portfolio as proof of what I can build and follow up with a real person after attending events.</p><p class="radar-progress" data-radar-week-count></p><div class="radar-week-list" data-radar-week-list></div></article>';
 section.querySelector('[data-radar-count]').textContent=opportunitySources.filter(x=>done[x.id]).length+' / '+opportunitySources.length+' channels followed';
 const list=section.querySelector('[data-radar-list]');
 for(const item of opportunitySources){
  const row=document.createElement('div');row.className='radar-row';
  const label=document.createElement('label');label.className='radar-check';
  const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.dataset.opportunityId=item.id;checkbox.checked=!!done[item.id];checkbox.setAttribute('aria-label','Followed '+item.name);
  const copy=document.createElement('span');copy.className='radar-copy';
  const name=document.createElement('strong');name.textContent=item.name;
  const note=document.createElement('small');note.textContent=item.platform+' · '+item.why;
  copy.append(name,note);label.append(checkbox,copy);
  const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.className='button ghost small';link.textContent='Explore';
  row.append(label,link);list.append(row);
 }
 section.querySelector('[data-radar-week-count]').textContent=weeklyNetworkingActions.filter(x=>week[x.id]).length+' / '+weeklyNetworkingActions.length+' weekly actions checked';
 const actions=section.querySelector('[data-radar-week-list]');
 for(const action of weeklyNetworkingActions){
  const label=document.createElement('label');label.className='radar-check radar-week-check';
  const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.dataset.radarWeeklyId=action.id;checkbox.checked=!!week[action.id];
  const copy=document.createElement('span');copy.textContent=action.text;label.append(checkbox,copy);actions.append(label);
 }
 $('#view-root').append(section);
}

function scheduleRadarCheck(){
 const title='Opportunity Radar: 25-minute networking check';
 const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()+(1+7-date.getDay())%7);
 const day=isoDate(date);
 if(state.tasks.some(x=>x.title===title&&x.date===day)){toast('This networking check is already scheduled.');return;}
 state.tasks.push({id:uid(),title,date:day,time:'12:30',category:'Networking',priority:'medium',notes:'Review Opportunity Radar, follow relevant pages, engage thoughtfully and send one personal follow-up. Use the task calendar button to add this to Google Calendar.',done:false});
 saveState();render();toast('Networking check added to my planner.');
}

function renderCalendar() {
  const groups = [...state.tasks].sort((a,b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')).reduce((result, task) => {
    (result[task.date] ||= []).push(task);
    return result;
  }, {});
  const dates = Object.keys(groups);
  $('#view-root').innerHTML = `<div class="toolbar"><p class="subtle">A date without a next action is just decorative. Give the week somewhere to land.</p><button class="button primary" data-action="add-task">+ Schedule task</button></div><section class="calendar-board">${dates.length ? dates.map(date => `<div class="date-group"><div class="date-label"><strong>${formatDate(date, {weekday:'short', day:'numeric', month:'short'})}</strong><span>${date === isoDate() ? 'Today' : date}</span></div><div class="calendar-items">${groups[date].map(task => `<div class="calendar-item"><i style="background:${categoryColor(task.category)}"></i><div><strong>${safe(task.title)}</strong><small>${task.time || 'Any time'} · ${safe(task.category)}</small></div><button class="button ghost small" data-task-id="${task.id}" data-action="calendar-task">Google Calendar</button></div>`).join('')}</div></div>`).join('') : emptyTemplate('The calendar is empty', 'Schedule a small action and give future you a fighting chance.')}</section>`;
}

function categoryColor(category) {
  return ({ Applications:'#f47b82', Portfolio:'#6d55da', Networking:'#66cfa9', Skills:'#72b7d8', Admin:'#e8b55c', Personal:'#a58fdc' })[category] || '#6d55da';
}

function renderSettings() {
  const cloudText = cloudUser ? `Connected as ${safe(cloudUser.email)}` : 'Optional: connect a free Supabase project for sign-in and cross-device backup.';
  $('#view-root').innerHTML = `<section class="settings-grid">
    <article class="card setting-card"><p class="eyebrow">Google Calendar</p><h2>Put plans where time lives</h2><p>Every task already has a one-click Google Calendar link. Add a browser client ID below if you also want direct event creation from this dashboard.</p><div class="field-stack"><label>Google browser client ID<input id="google-client-id" value="${safe(state.settings.googleClientId || '')}" placeholder="...apps.googleusercontent.com"></label></div><div class="settings-actions"><button class="button primary small" data-action="save-google">Save connection</button><button class="button ghost small" data-action="test-google">Connect calendar</button></div></article>
    <article class="card setting-card"><p class="eyebrow">Cloud backup</p><h2>Keep the plan on more than one device</h2><p>${cloudText}</p><div class="field-stack"><label>Supabase project URL<input id="supabase-url" value="${safe(state.settings.supabaseUrl || '')}" placeholder="https://project.supabase.co"></label><label>Supabase public anon key<input id="supabase-key" type="password" value="${safe(state.settings.supabaseKey || '')}"></label></div><div class="settings-actions"><button class="button primary small" data-action="connect-cloud">Connect</button>${cloudUser ? '<button class="button ghost small" data-action="sync-cloud">Sync now</button><button class="button ghost small" data-action="sign-out">Sign out</button>' : ''}</div></article>
    <article class="card setting-card"><p class="eyebrow">Portable copy</p><h2>Export or restore</h2><p>Download a private JSON backup whenever you want. Restore it here on another device.</p><div class="settings-actions"><button class="button secondary small" data-action="export-data">Export data</button><label class="button ghost small">Import data<input id="import-data" type="file" accept="application/json" hidden></label></div></article>
    <article class="card setting-card"><p class="eyebrow">Fresh start</p><h2>Reset the dashboard</h2><p>Returns to the original Task 5 plan and removes your changes from this device.</p><button class="button ghost small" data-action="reset-data">Reset local data</button></article>
  </section>`;
}

function openTaskDialog(task = null) {
  $('#task-dialog-title').textContent = task ? 'Edit task' : 'Add a task';
  $('#task-id').value = task?.id || '';
  $('#task-title').value = task?.title || '';
  $('#task-date').value = task?.date || isoDate();
  $('#task-time').value = task?.time || '';
  $('#task-category').value = task?.category || 'Applications';
  $('#task-priority').value = task?.priority || 'medium';
  $('#task-notes').value = task?.notes || '';
  $('#task-repeat').checked = Boolean(task?.repeat);
  $('#task-dialog').showModal();
}

function saveTaskFromForm() {
  if (!$('#task-form').reportValidity()) return;
  const id = $('#task-id').value;
  const task = { id: id || uid(), title: $('#task-title').value.trim(), date: $('#task-date').value, time: $('#task-time').value, category: $('#task-category').value, priority: $('#task-priority').value, notes: $('#task-notes').value.trim(), repeat: $('#task-repeat').checked, done: id ? state.tasks.find(item => item.id === id)?.done || false : false };
  state.tasks = id ? state.tasks.map(item => item.id === id ? task : item) : [...state.tasks, task];
  saveState();
  $('#task-dialog').close();
  render();
  toast(id ? 'Task updated.' : 'Task added to the orbit.');
}

function openGoalDialog(goal = null) {
  $('#goal-dialog-title').textContent = goal ? 'Edit goal' : 'Add a goal';
  $('#goal-id').value = goal?.id || '';
  $('#goal-title').value = goal?.title || '';
  $('#goal-target').value = goal?.target || 1;
  $('#goal-unit').value = goal?.unit || 'milestone';
  $('#goal-current').value = goal?.current || 0;
  $('#goal-deadline').value = goal?.deadline || '';
  $('#goal-dialog').showModal();
}

function saveGoalFromForm() {
  if (!$('#goal-form').reportValidity()) return;
  const id = $('#goal-id').value;
  const goal = { id: id || uid(), title: $('#goal-title').value.trim(), target: Number($('#goal-target').value), unit: $('#goal-unit').value.trim(), current: Number($('#goal-current').value), deadline: $('#goal-deadline').value };
  state.goals = id ? state.goals.map(item => item.id === id ? goal : item) : [...state.goals, goal];
  saveState(); $('#goal-dialog').close(); render(); toast('Goal saved.');
}

function openApplicationDialog(item = null) {
  $('#application-id').value = item?.id || '';
  $('#application-company').value = item?.company || '';
  $('#application-role').value = item?.role || '';
  $('#application-stage').value = item?.stage || 'Wishlist';
  $('#application-deadline').value = item?.deadline || '';
  $('#application-link').value = item?.link || '';
  $('#application-next').value = item?.next || '';
  $('#application-dialog').showModal();
}

function saveApplicationFromForm() {
  if (!$('#application-form').reportValidity()) return;
  const id = $('#application-id').value;
  const item = { id: id || uid(), company: $('#application-company').value.trim(), role: $('#application-role').value.trim(), stage: $('#application-stage').value, deadline: $('#application-deadline').value, link: $('#application-link').value.trim(), next: $('#application-next').value.trim() };
  state.applications = id ? state.applications.map(old => old.id === id ? item : old) : [...state.applications, item];
  if (!id && item.stage === 'Applied') bumpGoal('applications', 1);
  saveState(); $('#application-dialog').close(); render(); toast('Opportunity saved.');
}

function bumpGoal(unit, amount) {
  state.goals = state.goals.map(goal => goal.unit === unit ? { ...goal, current: Math.max(0, Math.min(goal.target, goal.current + amount)) } : goal);
}

function googleCalendarUrl(task) {
  const start = `${task.date.replaceAll('-', '')}T${(task.time || '09:00').replace(':', '')}00`;
  const startDate = new Date(`${task.date}T${task.time || '09:00'}:00`);
  const endDate = new Date(startDate.getTime() + 30 * 60000);
  const end = `${isoDate(endDate).replaceAll('-', '')}T${String(endDate.getHours()).padStart(2,'0')}${String(endDate.getMinutes()).padStart(2,'0')}00`;
  const params = new URLSearchParams({ action: 'TEMPLATE', text: task.title, dates: `${start}/${end}`, details: task.notes || `Career Orbit · ${task.category}` });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function addWeeklyRhythm() {
  const tasks = [
    ['Find & shortlist roles', 1, '09:00'], ['Tailor & submit', 3, '09:00'], ['Follow up & network', 5, '14:00']
  ];
  const now = new Date();
  tasks.forEach(([title, weekday, time]) => {
    const date = new Date(now);
    date.setDate(now.getDate() + ((weekday + 7 - now.getDay()) % 7 || 7));
    state.tasks.push({ id: uid(), title, date: isoDate(date), time, category: title.includes('network') ? 'Networking' : 'Applications', priority: 'high', notes: 'Recurring weekly career block from the Task 5 action plan.', repeat: true, done: false });
  });
  saveState(); render(); toast('Weekly rhythm added to your planner.');
}

async function connectCloud() {
  const url = $('#supabase-url').value.trim();
  const key = $('#supabase-key').value.trim();
  if (!url || !key) return toast('Add the project URL and public anon key first.');
  state.settings.supabaseUrl = url; state.settings.supabaseKey = key; saveState();
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    cloudClient = createClient(url, key);
    const { data: { session } } = await cloudClient.auth.getSession();
    if (session) { cloudUser = session.user; await loadFromCloud(); renderSettings(); toast('Cloud backup connected.'); return; }
    const email = prompt('Email for a magic sign-in link:');
    if (!email) return;
    const { error } = await cloudClient.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href.split('#')[0] } });
    if (error) throw error;
    toast('Check your email for the sign-in link.');
  } catch (error) { toast(`Connection problem: ${error.message}`); }
}

async function syncToCloud() {
  if (!cloudClient || !cloudUser) return;
  const { error } = await cloudClient.from('career_plans').upsert({ user_id: cloudUser.id, payload: state, updated_at: new Date().toISOString() });
  if (!error) $('#save-state').innerHTML = '<i></i> Synced';
}

async function loadFromCloud() {
  const { data, error } = await cloudClient.from('career_plans').select('payload').eq('user_id', cloudUser.id).maybeSingle();
  if (error) throw error;
  if (data?.payload) { state = { ...defaultState(), ...data.payload }; saveState('Synced'); }
  else await syncToCloud();
}

async function connectGoogle() {
  const clientId = state.settings.googleClientId;
  if (!clientId) return toast('Save your Google browser client ID first.');
  if (!window.google?.accounts?.oauth2) await loadScript('https://accounts.google.com/gsi/client');
  const tokenClient = google.accounts.oauth2.initTokenClient({ client_id: clientId, scope: 'https://www.googleapis.com/auth/calendar.events', callback: response => {
    if (response.error) return toast('Calendar connection was not completed.');
    googleAccessToken = response.access_token;
    toast('Google Calendar connected for this browser session.');
  }});
  tokenClient.requestAccessToken({ prompt: 'consent' });
}

async function sendToGoogleCalendar(task) {
  if (!googleAccessToken) {
    window.open(googleCalendarUrl(task), '_blank', 'noopener');
    return;
  }
  const start = new Date(`${task.date}T${task.time || '09:00'}:00`);
  const end = new Date(start.getTime() + 30 * 60000);
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: task.title, description: task.notes || `Career Orbit · ${task.category}`, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } })
    });
    if (!response.ok) throw new Error('The calendar session may have expired.');
    toast('Event added to Google Calendar.');
  } catch (error) {
    googleAccessToken = null;
    toast(error.message);
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = src; script.onload = resolve; script.onerror = reject; document.head.append(script); });
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `career-orbit-backup-${isoDate()}.json`; link.click(); URL.revokeObjectURL(link.href);
}

function toast(message) {
  const node = $('#toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 2800);
}

document.addEventListener('click', event => {
  const actionNode = event.target.closest('[data-action]');
  if (!actionNode) return;
  const action = actionNode.dataset.action;
  const taskNode = actionNode.closest('[data-task-id]');
  const task = taskNode ? state.tasks.find(item => item.id === taskNode.dataset.taskId) : null;
  const goalNode = actionNode.closest('[data-goal-id]');
  const goal = goalNode ? state.goals.find(item => item.id === goalNode.dataset.goalId) : null;
  const applicationNode = actionNode.closest('[data-application-id]');
  const application = applicationNode ? state.applications.find(item => item.id === applicationNode.dataset.applicationId) : null;

  if (action === 'add-task') openTaskDialog();
  if (action === 'edit-task') openTaskDialog(task);
  if (action === 'delete-task' && confirm(`Delete “${task.title}”?`)) { state.tasks = state.tasks.filter(item => item.id !== task.id); saveState(); render(); }
  if (action === 'calendar-task') sendToGoogleCalendar(task);
  if (action === 'weekly-calendar' || action === 'plan-calendar') addWeeklyRhythm();
  if (action === 'add-goal') openGoalDialog();
  if (action === 'edit-goal') openGoalDialog(goal);
  if (action === 'delete-goal' && confirm(`Delete “${goal.title}”?`)) { state.goals = state.goals.filter(item => item.id !== goal.id); saveState(); render(); }
  if (action === 'increase-goal') { goal.current = Math.min(goal.target, goal.current + 1); saveState(); render(); }
  if (action === 'decrease-goal') { goal.current = Math.max(0, goal.current - 1); saveState(); render(); }
  if (action === 'add-application') openApplicationDialog();
  if (action === 'delete-application' && confirm(`Remove ${application.role} at ${application.company}?`)) { state.applications = state.applications.filter(item => item.id !== application.id); saveState(); render(); }
  if (action === 'move-application') { const stages = ['Wishlist','Tailoring','Applied','Interview','Offer','Closed']; application.stage = stages[(stages.indexOf(application.stage) + 1) % stages.length]; if (application.stage === 'Applied') bumpGoal('applications', 1); saveState(); render(); }
  if (action === 'radar-schedule') scheduleRadarCheck();
  if (action === 'add-contact') { const name = prompt('Name:'); if (!name) return; const context = prompt('How do you know them?') || 'Professional contact'; const next = prompt('Next step?') || 'Send a thoughtful hello'; state.contacts.push({ id: uid(), name, context, next }); saveState(); render(); }
  if (action === 'contact-done') { const id = actionNode.closest('[data-contact-id]').dataset.contactId; state.contacts = state.contacts.filter(item => item.id !== id); bumpGoal('connections', 1); saveState(); render(); toast('Follow-up logged. Nice humaning.'); }
  if (action === 'save-google') { state.settings.googleClientId = $('#google-client-id').value.trim(); saveState(); toast('Calendar setting saved.'); }
  if (action === 'test-google') connectGoogle();
  if (action === 'connect-cloud') connectCloud();
  if (action === 'sync-cloud') syncToCloud().then(() => toast('Plan synced.'));
  if (action === 'sign-out') cloudClient?.auth.signOut().then(() => { cloudUser = null; renderSettings(); toast('Signed out.'); });
  if (action === 'export-data') exportData();
  if (action === 'reset-data' && confirm('Reset all local changes and return to the original plan?')) { state = defaultState(); saveState(); render(); }
});

document.addEventListener('change', event => {
  if (event.target.matches('[data-opportunity-id]')) { (state.opportunityChecks ||= {})[event.target.dataset.opportunityId] = event.target.checked; saveState(); renderNetwork(); }
  if (event.target.matches('[data-radar-weekly-id]')) { const week = ((state.weeklyNetworkingChecks ||= {})[orbitRadarWeekKey()] ||= {}); week[event.target.dataset.radarWeeklyId] = event.target.checked; saveState(); renderNetwork(); }
  if (event.target.matches('[data-action="toggle-task"]')) { const id = event.target.closest('[data-task-id]').dataset.taskId; const task = state.tasks.find(item => item.id === id); task.done = event.target.checked; saveState(); render(); }
  if (event.target.matches('[data-roadmap-key]')) { state.roadmapChecks[event.target.dataset.roadmapKey] = event.target.checked; saveState(); renderPlan(); }
  if (event.target.matches('[data-reference-id]')) { const reference = state.references.find(item => item.id === event.target.dataset.referenceId); reference.confirmed = event.target.checked; saveState(); }
  if (event.target.id === 'import-data') { const file = event.target.files[0]; if (!file) return; file.text().then(text => { try { state = { ...defaultState(), ...JSON.parse(text) }; saveState(); render(); toast('Backup restored.'); } catch { toast('That file is not a valid backup.'); } }); }
});

document.addEventListener('click', event => {
  const filter = event.target.closest('[data-filter]');
  if (filter) { taskFilter = filter.dataset.filter; renderToday(); }
});

$$('.nav-item[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
$('#quick-add').addEventListener('click', () => openTaskDialog());
$('#mobile-menu').addEventListener('click', () => { const sidebar = $('.sidebar'); sidebar.classList.toggle('open'); $('#mobile-menu').setAttribute('aria-expanded', sidebar.classList.contains('open')); });
$('#save-task').addEventListener('click', event => { event.preventDefault(); saveTaskFromForm(); });
$('#save-goal').addEventListener('click', event => { event.preventDefault(); saveGoalFromForm(); });
$('#save-application').addEventListener('click', event => { event.preventDefault(); saveApplicationFromForm(); });

$('#date-line').textContent = new Intl.DateTimeFormat('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
render();

if (state.settings.supabaseUrl && state.settings.supabaseKey) {
  import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(async ({ createClient }) => {
    cloudClient = createClient(state.settings.supabaseUrl, state.settings.supabaseKey);
    const { data: { session } } = await cloudClient.auth.getSession();
    if (session) { cloudUser = session.user; await loadFromCloud(); render(); }
  }).catch(() => {});
}
