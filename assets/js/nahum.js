/* UI del perfil Nahum. Separado del motor y los datos automáticos de Mario. */
const navLinks=[...document.querySelectorAll('#nav a')];
const sidebar=document.getElementById('sidebar');
const scrim=document.getElementById('scrim');
const menuBtn=document.getElementById('menuBtn');

function closeSidebar(){sidebar?.classList.remove('open');scrim?.classList.remove('show');menuBtn?.setAttribute('aria-expanded','false');}
function toggleSidebar(){const open=sidebar?.classList.toggle('open');scrim?.classList.toggle('show',open);menuBtn?.setAttribute('aria-expanded',String(open));}
menuBtn?.addEventListener('click',toggleSidebar);
scrim?.addEventListener('click',closeSidebar);
navLinks.forEach(a=>a.addEventListener('click',()=>{if(matchMedia('(max-width:1023px)').matches)closeSidebar();}));

if('IntersectionObserver' in window){
  const map=new Map(navLinks.map(a=>[a.getAttribute('href').slice(1),a]));
  const spy=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){navLinks.forEach(a=>a.classList.remove('active'));map.get(e.target.id)?.classList.add('active');}}),{rootMargin:'-25% 0px -70% 0px'});
  document.querySelectorAll('main section').forEach(s=>spy.observe(s));
}

const themeBtn=document.getElementById('themeBtn');
function setTheme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('dossier-theme',t);}catch(e){}themeBtn?.setAttribute('aria-label',t==='dark'?'Cambiar a tema claro':'Cambiar a tema oscuro');}
themeBtn?.addEventListener('click',()=>setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'));

function wireTabs(id){const root=document.getElementById(id);if(!root)return;root.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{root.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===t));root.parentElement.querySelectorAll(':scope > .tabpane').forEach(p=>p.classList.toggle('active',p.id===t.dataset.pane));}));}
wireTabs('planTabs');

const backTop=document.getElementById('backTop');
function onScroll(){backTop?.classList.toggle('show',scrollY>560);}
addEventListener('scroll',onScroll,{passive:true});onScroll();
backTop?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));

const search=document.getElementById('search');
const results=document.getElementById('results');
const searchable=[...document.querySelectorAll('main section')].map(s=>({id:s.id,title:s.querySelector('h2')?.textContent||'Resumen',text:s.textContent.toLowerCase()}));
function closeResults(){results?.classList.remove('open');}
function renderResults(){const q=search.value.trim().toLowerCase();if(!q){closeResults();return;}const hits=searchable.filter(x=>x.text.includes(q)).slice(0,8);results.innerHTML=hits.length?hits.map(x=>`<a class="ritem" href="#${x.id}"><span class="rk">sección</span><span><span class="rt">${x.title}</span><br><span class="rd">Ir al contenido relacionado</span></span></a>`).join(''):'<div class="empty">Sin coincidencias</div>';results.classList.add('open');results.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{closeResults();search.value='';}));}
search?.addEventListener('input',renderResults);
document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement!==search){e.preventDefault();search?.focus();}if(e.key==='Escape'){closeSidebar();closeResults();}});
document.addEventListener('click',e=>{if(!e.target.closest('.search'))closeResults();});

if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion:reduce)').matches){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');io.unobserve(e.target);}}),{threshold:.08});
  document.querySelectorAll('.kpi,.card,.callout,.tablewrap,.qcard,.line,.bars,.wdl').forEach(el=>io.observe(el));
}

