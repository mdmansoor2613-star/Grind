const SECS=['Aptitude','DSA','Core CS','Programming','Communication','Other'];
const $=id=>document.getElementById(id);
const iso=d=>{const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
const today=()=>iso(new Date());
let tasks=JSON.parse(localStorage.getItem('tasks')||'[]'),cur='All',flt='all',editId=null;
const save=()=>localStorage.setItem('tasks',JSON.stringify(tasks));
const status=t=>t.done?'done':t.date<today()?'missed':'pending';
const toast=m=>{const d=document.createElement('div');d.textContent=m;$('toast').append(d);setTimeout(()=>d.remove(),2500)};

function dayStats(d){const l=tasks.filter(t=>t.date===d);return{n:l.length,done:l.filter(t=>t.done).length}}
function streak(){let s=0,d=new Date();
  const st=dayStats(today());if(!(st.n&&st.done===st.n))d.setDate(d.getDate()-1);
  for(;;d.setDate(d.getDate()-1)){const x=dayStats(iso(d));if(x.n&&x.done===x.n)s++;else break}
  return s}

function render(){
  $('date').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const s=streak();$('streak').textContent=s;
  const last=+localStorage.getItem('lastStreak')||0;
  if(s<last&&dayStats(today()).done===0&&last>0&&s===0)toast('Streak lost 💔 Start again today!');
  localStorage.setItem('lastStreak',s);
  // nav with section progress
  $('nav').innerHTML=['All',...SECS].map(n=>{
    const l=tasks.filter(t=>(n==='All'||t.sec===n)),p=l.length?Math.round(l.filter(t=>t.done).length/l.length*100):0;
    return `<div><button data-s="${n}" class="${n===cur?'on':''}" style="width:100%">${n} <small>${p}%</small></button><div class="bar"><i style="width:${p}%"></i></div></div>`}).join('');
  // daily progress
  const ds=dayStats(today()),dp=ds.n?Math.round(ds.done/ds.n*100):0;
  $('dp').textContent=`${ds.done}/${ds.n} (${dp}%)`;$('dbar').style.width=dp+'%';
  // tasks
  const q=$('q').value.toLowerCase();
  const l=tasks.filter(t=>(cur==='All'||t.sec===cur)&&(flt==='all'||status(t)===flt)&&t.title.toLowerCase().includes(q))
    .sort((a,b)=>a.date<b.date?1:-1);
  $('view').innerHTML=l.length?l.map(t=>`<div class="task ${status(t)}"><input type="checkbox" class="chk" data-id="${t.id}" ${t.done?'checked':''}>
    <div class="t">${t.title.replace(/</g,'&lt;')}<small>${t.sec} • ${t.date}</small></div>
    <button data-e="${t.id}">✏️</button><button data-d="${t.id}">🗑️</button></div>`).join(''):'<p style="color:var(--mu);padding:20px">No tasks here yet. Click “+ Add Task”.</p>';
  heat();charts();badges();
}

function heat(){let h='';const e=new Date(),b=new Date();b.setDate(b.getDate()-139-((e.getDay()+6)%7)%7);
  for(let i=0;i<140+((e.getDay()+6)%7)%7+1;i++){const d=new Date(b);d.setDate(b.getDate()+i);if(d>e)break;
    const c=dayStats(iso(d)).done,l=c?Math.min(4,Math.ceil(c/2)):0;
    h+=`<i class="${l?'l'+l:''}" title="${iso(d)}: ${c} done"></i>`}
  $('heat').innerHTML=h}

function bars(cv,labels,vals){const c=$(cv),x=c.getContext('2d'),w=c.width=c.clientWidth*2,h=c.height=320;
  const st=getComputedStyle(document.body),tx=st.getPropertyValue('--mu'),mx=Math.max(1,...vals),bw=w/vals.length;
  x.clearRect(0,0,w,h);x.font='22px sans-serif';x.fillStyle=tx;x.textAlign='center';
  vals.forEach((v,i)=>{const bh=(h-60)*v/mx;x.fillStyle='#22c55e';x.fillRect(i*bw+bw*.2,h-35-bh,bw*.6,bh);
    x.fillStyle=tx;x.fillText(labels[i],i*bw+bw/2,h-8);if(v)x.fillText(v,i*bw+bw/2,h-42-bh)})}
function charts(){const L=[],V=[];
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);L.push(d.toLocaleDateString(undefined,{weekday:'short'}));V.push(dayStats(iso(d)).done)}
  bars('wk',L,V);
  const L2=[],V2=[];for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const p=iso(d).slice(0,7);
    L2.push(d.toLocaleDateString(undefined,{month:'short'}));V2.push(tasks.filter(t=>t.done&&t.date.startsWith(p)).length)}
  bars('mo',L2,V2)}

function badges(){const s=streak(),best=Math.max(s,+localStorage.getItem('best')||0);localStorage.setItem('best',best);
  $('badges').innerHTML=[3,7,14,30,60,100].map(n=>`<span class="badge ${best>=n?'got':''}">${best>=n?'🏅':'🔒'} ${n} days</span>`).join('')}

function confetti(){const c=$('cf'),x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;
  const p=Array.from({length:150},()=>({x:Math.random()*c.width,y:-20,vx:Math.random()*4-2,vy:Math.random()*4+3,s:Math.random()*8+4,c:`hsl(${Math.random()*360},90%,60%)`}));
  let f=0;(function a(){x.clearRect(0,0,c.width,c.height);p.forEach(q=>{q.x+=q.vx;q.y+=q.vy;x.fillStyle=q.c;x.fillRect(q.x,q.y,q.s,q.s)});
    if(++f<150)requestAnimationFrame(a);else x.clearRect(0,0,c.width,c.height)})()}

// events
document.addEventListener('click',e=>{const t=e.target;
  if(t.dataset.s){cur=t.dataset.s;$('view').style.opacity=.2;setTimeout(()=>{render();$('view').style.opacity=1;$('view').style.animation='none';void $('view').offsetWidth;$('view').style.animation=''},180)}
  if(t.dataset.d){tasks=tasks.filter(k=>k.id!=t.dataset.d);save();render();toast('Task deleted')}
  if(t.dataset.e){const k=tasks.find(k=>k.id==t.dataset.e);editId=k.id;$('mt').textContent='Edit Task';$('title').value=k.title;$('sec').value=k.sec;$('tdate').value=k.date;$('modal').classList.add('show')}
  if(t.classList.contains('f')){flt=t.dataset.f;document.querySelectorAll('.f').forEach(b=>b.classList.toggle('on',b===t));render()}
  if(t.id==='modal'||t.id==='cancel')$('modal').classList.remove('show')});
document.addEventListener('change',e=>{if(!e.target.dataset.id)return;
  const k=tasks.find(k=>k.id==e.target.dataset.id);k.done=e.target.checked;save();render();
  if(k.done){toast('Task completed! ✅');const d=dayStats(today());if(k.date===today()&&d.n&&d.done===d.n){confetti();toast('Daily goal hit! 🔥')}}});
$('add').onclick=()=>{editId=null;$('mt').textContent='Add Task';$('form').reset();$('tdate').value=today();if(cur!=='All')$('sec').value=cur;$('modal').classList.add('show')};
$('form').onsubmit=e=>{e.preventDefault();const v={title:$('title').value.trim(),sec:$('sec').value,date:$('tdate').value};
  if(editId){Object.assign(tasks.find(k=>k.id===editId),v);toast('Task updated')}else{tasks.push({id:Date.now(),done:false,...v});toast('Task added')}
  save();$('modal').classList.remove('show');render()};
$('q').oninput=render;
$('theme').onclick=()=>{const d=document.body.parentElement,n=d.dataset.theme==='dark'?'light':'dark';d.dataset.theme=n;localStorage.setItem('theme',n);charts()};
document.documentElement.dataset.theme=localStorage.getItem('theme')||'light';
$('sec').innerHTML=SECS.map(s=>`<option>${s}</option>`).join('');
addEventListener('resize',charts);
render();
