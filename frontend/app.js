/* ================= ICONS ================= */
const I={
 overview:'<path d="M3 12l9-8 9 8"/><path d="M5 10v10h14V10"/>',
 campaigns:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
 prospects:'<circle cx="9" cy="8" r="3.3"/><path d="M2.5 20c.6-3.6 3.2-5.4 6.5-5.4S14.9 16.4 15.5 20"/><path d="M16 4.3a3.3 3.3 0 010 6.9M18 14.6c2 .6 3.1 2.2 3.5 5.4"/>',
 conversations:'<path d="M21 12a8 8 0 01-11.7 7L3 20.5l1.5-5A8 8 0 1121 12z"/>',
 agents:'<rect x="5" y="7" width="14" height="11" rx="3"/><path d="M12 3v4M9 12v1.5M15 12v1.5M9 21h6"/>',
 tasks:'<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9"/>',
 analytics:'<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',
 integrations:'<path d="M9 3v5M15 3v5M6 8h12v4a6 6 0 01-12 0zM12 18v3"/>',
 knowledge:'<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5M8 8h7M8 12h5"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8A1.7 1.7 0 003 15.1H3a2 2 0 010-4h.1A1.7 1.7 0 004.6 9.5a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 015.8 1c0 2-3 2-3 4"/><path d="M12 17h.01"/>',
 account:'<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
 bell:'<path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 004 0"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 moon:'<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>', chev:'<path d="M9 6l6 6-6 6"/>',
 up:'<path d="M12 19V5M5 12l7-7 7 7"/>', check:'<path d="M5 12l5 5 9-10"/>',
 email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
 linkedin:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 11v6M8 7.5v.01M12 17v-6M12 13.5c0-3 5-3 5 0V17"/>',
 sms:'<path d="M4 4h16v12H8l-4 4z"/>',
 voice:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
 bolt:'<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
 pause:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
 collapse:'<path d="M15 6l-6 6 6 6"/>',
 logout:'<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
 key:'<circle cx="8" cy="8" r="4.5"/><path d="M11.3 11.3L21 21M16 16l3-3M19 19l2.5-2.5"/>',
};
const ic=(n,s)=>`<svg viewBox="0 0 24 24" ${s?`style="width:${s}px;height:${s}px"`:''}>${I[n]||''}</svg>`;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ================= MARKDOWN for agent text =================
   Agents answer in markdown (## headings, **bold**, - bullets, [links](url)). Everything is HTML-escaped FIRST and only then a small fixed set of
   patterns becomes tags, so neither agent output nor a prospect's reply can inject markup. Links: http(s) and mailto only. Inline styles on
   purpose: the tags carry their own look and need nothing from the stylesheet.
   md(text) -> block HTML (paragraphs, headings, lists, tables, quotes, code, rules); mdInline(text) -> inline HTML for one-line fields. */
const MD_A='style="color:color-mix(in srgb,var(--blue) 55%,var(--ink));text-decoration:underline" target="_blank" rel="noopener noreferrer"';
function mdInline(raw){
  const keep=[],stash=h=>'\u0000'+(keep.push(h)-1)+'\u0000';
  let s=esc(String(raw??'').replace(/\u0000/g,''));
  s=s.replace(/`([^`\n]+)`/g,(_,c)=>stash(`<code style="background:var(--bg-elev2);padding:1px 5px;border-radius:4px;font-size:.92em">${c}</code>`));
  s=s.replace(/\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g,(_,t,u)=>stash(`<a href="${u}" ${MD_A}>${t}</a>`));
  s=s.replace(/(^|[\s(])(https?:\/\/[^\s<)]*[^\s<).,;:!?])/g,(_,p,u)=>p+stash(`<a href="${u}" ${MD_A}>${u}</a>`));
  s=s.replace(/\*\*([^*\n]+?)\*\*|__([^_\n]+?)__/g,(_,a,b)=>`<strong>${a||b}</strong>`);
  s=s.replace(/(^|[^*\w])\*([^*\s][^*\n]*?)\*(?![*\w])/g,'$1<em>$2</em>');
  s=s.replace(/(^|[^_\w])_([^_\s][^_\n]*?)_(?![_\w])/g,'$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g,(_,i)=>keep[+i]);
}
function md(raw){
  const lines=String(raw??'').replace(/\r\n?/g,'\n').replace(/\u0000/g,'').trim().split('\n'),out=[];
  const H=/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/,UL=/^\s*[-*+]\s+(.*)$/,OL=/^\s*\d+[.)]\s+(.*)$/,BQ=/^\s*>\s?(.*)$/,FENCE=/^\s*```/,ROW=/^\s*\|.*\|\s*$/;
  const HR=/^\s*([-*_])(\s*\1){2,}\s*$/,SEP=/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
  const blockStart=(l,n)=>H.test(l)||UL.test(l)||OL.test(l)||BQ.test(l)||FENCE.test(l)||HR.test(l)||(ROW.test(l)&&n!==undefined&&SEP.test(n));
  const cells=l=>l.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
  let i=0;
  while(i<lines.length){
    const l=lines[i];let m;
    if(!l.trim()){i++;continue}
    if(FENCE.test(l)){const code=[];i++;while(i<lines.length&&!FENCE.test(lines[i]))code.push(lines[i++]);i++;
      out.push(`<pre style="background:var(--bg-elev2);border-radius:8px;padding:10px 12px;overflow-x:auto;font-size:11.5px;margin:6px 0">${esc(code.join('\n'))}</pre>`);continue}
    if((m=H.exec(l))){const n=m[1].length;out.push(`<div style="font-weight:700;font-size:${n<=2?15:n===3?14:13}px;margin:${out.length?'14px':'0'} 0 5px">${mdInline(m[2])}</div>`);i++;continue}
    if(HR.test(l)){out.push('<hr style="border:0;border-top:1px solid var(--line2);margin:10px 0">');i++;continue}
    if(ROW.test(l)&&i+1<lines.length&&SEP.test(lines[i+1])){
      const head=cells(l);i+=2;const rows=[];while(i<lines.length&&ROW.test(lines[i]))rows.push(cells(lines[i++]));
      out.push(`<div style="overflow-x:auto;margin:6px 0"><table style="border-collapse:collapse;font-size:12px"><thead><tr>${head.map(c=>`<th style="text-align:left;padding:5px 10px;border-bottom:1px solid var(--line2)">${mdInline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td style="padding:5px 10px;border-bottom:1px solid var(--line2);vertical-align:top">${mdInline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);continue}
    if(BQ.test(l)){const q=[];while(i<lines.length&&BQ.test(lines[i]))q.push(BQ.exec(lines[i++])[1]);
      out.push(`<div style="border-left:3px solid var(--line2);padding:2px 0 2px 12px;margin:6px 0;color:var(--mute)">${q.map(mdInline).join('<br>')}</div>`);continue}
    if(UL.test(l)||OL.test(l)){const ol=!UL.test(l),re=ol?OL:UL,items=[];
      while(i<lines.length&&re.test(lines[i]))items.push(re.exec(lines[i++])[1]);
      out.push(`<${ol?'ol':'ul'} style="margin:4px 0 8px;padding-left:20px;list-style:${ol?'decimal':'disc'}">${items.map(t=>`<li style="margin:2px 0">${mdInline(t)}</li>`).join('')}</${ol?'ol':'ul'}>`);continue}
    const para=[];while(i<lines.length&&lines[i].trim()&&!(para.length&&blockStart(lines[i],lines[i+1])))para.push(lines[i++]);
    out.push(`<p style="margin:0 0 8px">${para.map(mdInline).join('<br>')}</p>`);
  }
  return out.join('');
}
const initials=n=>n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();

/* ================= DATA (loaded from the backend API; see LIVE DATA below) ================= */
let CAMPAIGNS=[];
const STAGES=['discovered','researched','qualified','contacted','engaged','meeting','opportunity'];
const STAGE_L={discovered:'Discovered',researched:'Researched',qualified:'Qualified',rejected:'Rejected',contacted:'Contacted',engaged:'Engaged',meeting:'Meeting',opportunity:'Opportunity'};

let PROS=[];
const AI_L={active:'Active',paused:'Paused',rejected:'Rejected','needs-human':'Needs human','handed-off':'Handed off'};

const AGENTS=[
 // Identity only. Every number on the Agents page comes from GET /agents/stats (the activities table), never from here.
 {id:'icp',name:'ICP Fitment',icon:'analytics'},
 {id:'research',name:'Research & Enrichment',icon:'search'},
 {id:'strategy',name:'Outreach Strategy',icon:'bolt'},
 {id:'personalisation',name:'Personalisation',icon:'email'},
 {id:'conversation',name:'Conversation',icon:'conversations'},
 {id:'voice',name:'Voice SDR (simulated)',icon:'voice'},
 {id:'follow',name:'Follow-up',icon:'clock'},
];


let TASKS=[];

let CONVOS=[];
const INTENT_C={positive:'green',escalated:'purple','not-now':'amber',unsubscribe:'red',neutral:''};

let FEED=[];

const KB=[
 {id:'k1',name:'Product overview',type:'Product info',used:['US SaaS CTO','India BFSI CIO','Voice AI Founders']},
 {id:'k2',name:'Example emails',type:'Outreach examples',used:['US SaaS CTO','India BFSI CIO','Voice AI Founders']},
 {id:'k3',name:'Case study — Northline Data',type:'Case study',used:['US SaaS CTO']},
 {id:'k4',name:'Case study — Kavach Financial',type:'Case study',used:['India BFSI CIO']},
 {id:'k5',name:'Case study — Fernway AI',type:'Case study',used:['Voice AI Founders']},
 {id:'k6',name:'Objection handling',type:'Playbook',used:['US SaaS CTO','India BFSI CIO','Voice AI Founders']},
 {id:'k7',name:'Voice call script',type:'Script',used:['Voice AI Founders']},
];

let REPS=[];
let SUPPRESSION=[];

/* ================= STATE ================= */
const S={page:'overview',theme:null,campId:null,campTab:'Overview',campFilter:'all',pid:null,agentId:null,promptSel:'icp',promptView:null,
 convTab:'all',killed:false,collapsed:false,modal:null,drawer:null,
 ready:false,loadError:null,busy:false,
 user:null,authChecked:false,loginBusy:false,loginError:null,loginNotice:null,loginEmail:'', // who is signed in (from GET /auth/me) and the login form
 cps:{},acts:{},meetings:[],campReps:[],costs:{},pv:{},
 health:null,spend:null,guard:null,gchan:{},gchanMissing:false,auto:false,autoMissing:false,working:null};
try{S.collapsed=localStorage.getItem('sdr-collapsed')==='1'}catch(_){}
const camp=id=>CAMPAIGNS.find(c=>c.id===id);
const pro=id=>PROS.find(p=>p.id===id);
// Discovery is deliberately NOT in AGENTS: those are the 7 DronaHQ agents. It runs on Groq + Tavily and has its own card.
const DISCOVERY={id:'discovery',name:'Discovery'};
const agent=id=>AGENTS.find(a=>a.id===id)||(id==='discovery'?DISCOVERY:undefined);
let toastTimer=null;
function toast(m){
  document.querySelector('.toast')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="toast">${esc(m)}</div>`);
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>document.querySelector('.toast')?.remove(),2600);
}
function statusPill(s){return `<span class="pill ${s==='completed'?'done':s}"><span class="dot pulse-${s==='live'}"></span>${s[0].toUpperCase()+s.slice(1)}</span>`}
function stagePill(s){const map={discovered:'',researched:'',qualified:'done',rejected:'paused',contacted:'',engaged:'live',meeting:'live',opportunity:'live'};
  return `<span class="pill ${map[s]||''}">${STAGE_L[s]}</span>`}
function chIcon(ch){return ch?ic(ch==='phone'?'voice':ch,13):''}
function chName(ch){return {email:'Email',linkedin:'LinkedIn',sms:'SMS',voice:'Voice',phone:'Phone'}[ch]||ch||'—'}
function avatarColor(name){const cs=['#3D6EF6','#22E6A6','#9B7DF0','#E8A33D'];let h=0;for(const c of name)h+=c.charCodeAt(0);return cs[h%cs.length]}

/* ================= LIVE DATA (talks to the backend API) ================= */
const API=new URLSearchParams(location.search).get('api')||'';
async function api(method,path,body){
  let res;
  try{res=await fetch(API+path,{method,headers:body!==undefined?{'Content-Type':'application/json'}:{},body:body!==undefined?JSON.stringify(body):undefined})}
  catch(_){throw new Error(location.protocol==='file:'?'Open this page through the backend (start the server with npm start and use the address it serves), not as a file':'Cannot reach the backend')}
  let j=null;try{j=await res.json()}catch(_){}
  // A 401 anywhere else means the session has ended (expired, signed out elsewhere, or the server forgot it): back to the login page,
  // with a clean slate so no data from the old session stays in memory. (A wrong password on the login form is also a 401: not this.)
  if(res.status===401&&S.user&&!path.startsWith('/auth/')){
    S.user=null;
    try{sessionStorage.setItem('sdr-notice','Your session has ended. Please sign in again.')}catch(_){}
    location.reload();
  }
  if(!res.ok){const e=new Error((j&&(j.error||(j.blocked&&'Blocked: '+j.reason)))||`Request failed (${res.status})`);e.status=res.status;e.body=j;throw e}
  return j;
}
// List endpoints return at most 500 rows per request, so read them in pages.
async function apiAll(path){
  const out=[];
  for(let off=0;;off+=500){
    const page=await api('GET',`${path}${path.includes('?')?'&':'?'}limit=500&offset=${off}`);
    out.push(...page);
    if(page.length<500)return out;
  }
}
function ago(iso){
  if(!iso)return '—';
  const s=Math.max(0,Math.round((Date.now()-new Date(iso))/1000));
  if(s<60)return s+'s ago';
  const m=Math.floor(s/60);if(m<60)return m+'m ago';
  const h=Math.floor(m/60);if(h<24)return h+'h ago';
  return Math.floor(h/24)+'d ago';
}
const fmtDate=iso=>iso?new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
const fmtDateTime=iso=>iso?new Date(iso).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'—';
const usd=v=>v==null?'—':'$'+Number(v).toFixed(4);
const arr=v=>Array.isArray(v)?v:(v==null||v===''?[]:[v]);

// campaigns.icp_json is { roles, geo, company_criteria:{industries, employee_count:{min,max}}, ... }
function icpView(icp){
  icp=icp||{};const cc=icp.company_criteria||{};const ec=cc.employee_count;
  const size=ec&&typeof ec==='object'
    ?(ec.min!=null&&ec.max!=null?`${ec.min}-${ec.max} employees`:ec.min!=null?`${ec.min}+ employees`:ec.max!=null?`up to ${ec.max} employees`:'-')
    :(icp.size||'-');
  return {roles:arr(icp.roles),industries:arr(cc.industries||icp.industries),geo:arr(icp.geo).join(', ')||'-',size};
}

// Numbers the cards and funnel show, computed from the campaign's prospects and meetings.
function decorate(c){
  const cps=S.cps[c.id]||[];
  const idx=s=>Math.max(STAGES.indexOf(s),0); // 'rejected' counts as discovered only
  c.funnel=STAGES.map((_,i)=>cps.filter(p=>idx(p.funnel_state)>=i).length);
  c.pros=cps.length;c.cont=c.funnel[3];c.opp=c.funnel[6];
  c.meet=S.meetings.filter(m=>m.campaign_id===c.id).length;
  c.conv=c.cont?((c.meet/c.cont)*100).toFixed(1)+'%':'—';
  c.created=fmtDate(c.created_at);
  c.rep=S.campReps.filter(r=>r.campaign_id===c.id).map(r=>r.rep&&r.rep.name).find(Boolean)||'Unassigned';
  c.view=icpView(c.icp_json);
  return c;
}
// Small LinkedIn icon linking to the prospect's real profile. Shown only when a web URL is on file, so there is never a
// dead link (and a javascript: URL can never be rendered as one).
function liLink(p){
  const u=typeof p.li==='string'?p.li.trim():'';
  if(!/^https?:\/\//i.test(u))return '';
  return `<a class="li" href="${esc(u)}" target="_blank" rel="noopener" title="Open ${esc(p.name)} on LinkedIn" aria-label="Open ${esc(p.name)} on LinkedIn">${ic('linkedin',14)}</a>`;
}
const hasPending=cp=>TASKS.some(t=>t.campaign_id===cp.campaign_id&&t.prospect_id===cp.prospect_id);
function aiStatus(cp,c){
  if(cp.funnel_state==='rejected')return 'rejected';
  if(hasPending(cp))return 'needs-human';
  if(cp.funnel_state==='meeting'||cp.funnel_state==='opportunity')return 'handed-off';
  if(S.killed||!c||c.status!=='live')return 'paused';
  return 'active';
}
function lastChannel(campId,prospectId){
  const a=(S.acts[campId]||[]).find(x=>x.prospect_id===prospectId&&x.channel&&x.status==='success');
  return a?a.channel:null;
}
const ACT_L={discover:'Discovered prospects',score:'Scored ICP fit',enrich:'Researched',draft_email:'Drafted email',decide:'Decided next step',classify_reply:'Classified reply',call:'Voice call (simulated)'};
function actTitle(a){
  const base=ACT_L[a.action_type]||a.action_type;
  if(a.status==='failed')return `${base} failed`+(a.output_summary?`: ${a.output_summary.split('\n')[0].slice(0,110)}`:'');
  if(a.action_type==='dispatch')return `Dispatched via ${chName(a.channel)} (simulated)`;
  if(a.status==='pending_approval')return `${base} (waiting for approval)`;
  return base;
}
const actWho=(a,c)=>a.prospect?`${a.prospect.name}${a.prospect.title?', '+a.prospect.title:''}`:(c?c.name:'');
const feedItem=(a,c)=>({a:a.agent_type,t:actTitle(a),s:actWho(a,c),at:a.created_at,camp:a.campaign_id});
const INTENT_NORM=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,'-');
function rebuildAll(){
  CAMPAIGNS.forEach(decorate);
  PROS=[];CONVOS=[];
  for(const c of CAMPAIGNS)for(const cp of S.cps[c.id]||[]){
    const p=cp.prospect||{};
    const ch=lastChannel(c.id,cp.prospect_id);
    PROS.push({id:cp.id,name:p.name||'Unknown',co:p.company||'—',role:p.title||'—',score:cp.icp_score==null?'—':Math.round(Number(cp.icp_score)),
      stage:cp.funnel_state,last:ago(cp.updated_at),camp:c.id,ch,ai:aiStatus(cp,c),raw:cp,at:cp.updated_at,li:p.linkedin_url||null});
    const lc=(cp.context_json||{}).last_conversation;
    if(lc&&lc.reply_text)CONVOS.push({id:'v'+cp.id,cp:cp.id,who:p.name||'Unknown',co:p.company||'—',ch:ch||'email',msg:lc.reply_text,intent:INTENT_NORM(lc.intent),camp:c.name,time:ago(lc.classified_at),at:lc.classified_at});
  }
  PROS.sort((a,b)=>new Date(b.at)-new Date(a.at));
  CONVOS.sort((a,b)=>new Date(b.at)-new Date(a.at));
  FEED=CAMPAIGNS.flatMap(c=>(S.acts[c.id]||[]).map(a=>feedItem(a,c))).sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,12);
}
function setCampaign(row){
  const i=CAMPAIGNS.findIndex(c=>c.id===row.id);
  if(i>=0)CAMPAIGNS[i]=row;else CAMPAIGNS.unshift(row);
  rebuildAll();
}

async function loadKill(){S.killed=!!(await api('GET','/global-settings/kill-switch')).kill_switch_on}
async function loadHealth(){
  try{S.health=await api('GET','/health/services')}
  catch(_){S.health={ok:false,healthy:0,total:3,services:[{name:'Backend API',ok:false,detail:'unreachable'}]}}
}
// Spend since local midnight, as estimated on each activity.
async function loadSpend(){
  try{S.spend=await api('GET','/activities/spend?since='+encodeURIComponent(new Date(new Date().setHours(0,0,0,0)).toISOString()))}catch(_){}
}
// Per-agent numbers for the Agents page, computed by the backend from the activities table ("today" = local midnight, like spend).
async function loadAgentStats(){
  try{S.agentStats=await api('GET','/agents/stats?since='+encodeURIComponent(new Date(new Date().setHours(0,0,0,0)).toISOString()));S.agentStatsErr=null}
  catch(e){S.agentStatsErr=e.message}
}
async function loadGuard(){try{S.guard=await api('GET','/global-settings/guardrails')}catch(_){}}
// Global channel pause. A 503 means the database column has not been added yet (run db/schema.sql).
async function loadChannels(){
  try{S.gchan=(await api('GET','/global-settings/channels')).channels||{};S.gchanMissing=false}
  catch(e){if(e.status===503)S.gchanMissing=true}
}
// Autonomous mode flag. A 503 means the database column has not been added yet (run db/schema.sql); it is then treated as off.
async function loadAutonomous(){
  try{S.auto=!!(await api('GET','/global-settings/autonomous-mode')).autonomous_mode;S.autoMissing=false}
  catch(e){if(e.status===503){S.autoMissing=true;S.auto=false}}
}
async function loadMeetings(){S.meetings=await apiAll('/meetings')}
async function loadCampReps(){S.campReps=await apiAll('/campaign-reps')}
async function loadReps(){REPS=await apiAll('/reps')}
async function loadSuppression(){SUPPRESSION=await apiAll('/suppression-list')}
async function loadCampData(id){
  const [cps,acts]=await Promise.all([apiAll(`/campaigns/${id}/campaign-prospects`),api('GET',`/campaigns/${id}/activities?limit=200`)]);
  S.cps[id]=cps;S.acts[id]=acts;
}
async function loadCosts(ids){await Promise.all(ids.map(async id=>{S.costs[id]=await api('GET',`/campaigns/${id}/cost-report`)}))}
function taskFromApproval(a){
  const p=a.prospect||{},c=a.campaign||{},x=a.proposed_action_json||{};
  const icp=x.type==='icp_escalation',reply=x.type==='reply_escalation';
  return {id:a.id,campaign_id:a.campaign_id,prospect_id:a.prospect_id,
    tag:icp?'ICP ESCALATION':reply?'REPLY NEEDS A HUMAN':String(x.type||'approval').replace(/_/g,' ').toUpperCase(),tagc:icp?'amber':reply?'red':'purple',
    who:p.name||'Unknown prospect',sub:[p.title,p.company,c.name].filter(Boolean).join(' · '),
    body:{what:icp?`Scored ${x.score==null?'?':x.score} against the ICP. It was borderline, so the agent escalated instead of deciding.`
        :reply?`Replied: "${x.reply_text||''}"${x.intent?` (classified: ${x.intent})`:''}`:`Proposed action: ${JSON.stringify(x)}`,
      rec:reply&&x.next_action?`${x.next_action}. Approve to release the hold so outreach can continue; reject to permanently block outreach to this prospect.`
        :'Approve to release the hold so outreach can proceed. Reject to permanently block outreach to this prospect.',
      why:x.reasoning||'No reasoning was recorded.'},
    btns:[['Approve','primary'],['Reject','danger']]};
}
async function loadApprovals(){TASKS=(await apiAll('/approvals?status=pending')).map(taskFromApproval)}
async function loadAll(){
  CAMPAIGNS=await apiAll('/campaigns');
  await Promise.all([loadKill(),loadApprovals(),loadMeetings(),loadCampReps(),loadReps(),loadSuppression(),loadHealth(),loadSpend(),loadAgentStats(),loadGuard(),loadChannels(),loadAutonomous(),...CAMPAIGNS.map(c=>loadCampData(c.id))]);
  rebuildAll();
}
// Starts the app: first find out who is signed in. No session -> the login page and NO data requests at all.
async function boot(){
  S.loadError=null;S.ready=false;render();
  try{
    S.user=await api('GET','/auth/me');
  }catch(e){
    S.user=null;
    if(e.status===403)S.loginError=e.message;                       // valid sign-in, but not a team member
    else if(e.status!==401)S.loadError=e.message;                    // backend / auth service unreachable: a retry screen, not a login form
  }
  S.authChecked=true;
  try{const n=sessionStorage.getItem('sdr-notice');if(n){S.loginNotice=n;sessionStorage.removeItem('sdr-notice')}}catch(_){}
  if(!S.user){render();return}
  render();
  try{await loadAll();S.ready=true}catch(e){S.loadError=e.message}
  render();
}
// Refreshes what a page shows when it is opened.
async function refreshFor(p){
  try{
    const ids=CAMPAIGNS.map(c=>c.id);
    if(p==='overview')await Promise.all([loadKill(),loadApprovals(),loadMeetings(),loadSpend(),...ids.map(loadCampData)]);
    else if(p==='campaigns'){
      // Swap the list in only once everything is loaded, so a click in the meantime never sees an undecorated campaign.
      const rows=await apiAll('/campaigns');
      await Promise.all([loadMeetings(),loadCampReps(),...rows.map(c=>loadCampData(c.id))]);
      CAMPAIGNS=rows;rebuildAll(); // decorate at once: the user may already have left this page, and raw rows must never be left behind
    }
    else if(p==='prospects'||p==='conversations')await Promise.all([loadApprovals(),...ids.map(loadCampData)]);
    else if(p==='tasks')await loadApprovals();
    else if(p==='analytics')await Promise.all([loadMeetings(),loadCosts(ids),...ids.map(loadCampData)]);
    else if(p==='agents')await Promise.all([loadAgentStats(),...ids.map(loadCampData)]);
    else if(p==='settings')await Promise.all([loadKill(),loadReps(),loadSuppression(),loadCampReps(),loadGuard(),loadChannels(),loadAutonomous()]);
    else return;
    rebuildAll();if(S.page!==p)return; // fresh data always goes into the derived numbers; only the redraw depends on where the user is
    render();
  }catch(e){toast(e.message)}
}
async function refreshCamp(id,tab){
  try{
    const jobs=[loadCampData(id),loadMeetings()];
    if(tab==='Analytics')jobs.push(loadCosts([id]));
    if(tab==='Prompts')jobs.push(loadPrompts(id,S.promptSel));
    if(tab==='Configuration')jobs.push(loadCampReps());
    await Promise.all(jobs);
    if(S.campId!==id||S.campTab!==tab)return;
    rebuildAll();render();
  }catch(e){toast(e.message)}
}
async function loadPrompts(campId,agentType){S.pv[campId+':'+agentType]=await api('GET',`/campaigns/${campId}/prompt-versions?agent_type=${agentType}`)}

// Chart data from real rows
function dayBuckets(rows,getDate,days=12){
  const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-(days-1)),pts=Array(days).fill(0);
  for(const r of rows){const d=new Date(getDate(r)),i=Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-start)/864e5);if(i>=0&&i<days)pts[i]++}
  const labels=[0,2,4,6,8,10].map(i=>new Date(start.getFullYear(),start.getMonth(),start.getDate()+i).toLocaleDateString('en-US',{month:'short',day:'numeric'}));
  return {pts,labels};
}
function monthBuckets(rows,getDate,n=12){
  const now=new Date(),pts=Array(n).fill(0);
  for(const r of rows){const d=new Date(getDate(r)),i=(d.getFullYear()-now.getFullYear())*12+d.getMonth()-now.getMonth()+(n-1);if(i>=0&&i<n)pts[i]++}
  const labels=[0,2,4,6,8,10].map(i=>new Date(now.getFullYear(),now.getMonth()-(n-1)+i,1).toLocaleDateString('en-US',{month:'short'}));
  return {pts,labels};
}
const dispatches=ids=>ids.flatMap(id=>(S.acts[id]||[]).filter(a=>a.action_type==='dispatch'&&a.status==='success'));
function globalCost(){
  const rs=CAMPAIGNS.map(c=>S.costs[c.id]).filter(Boolean);
  if(!rs.length)return null;
  const sum=f=>rs.reduce((a,r)=>a+f(r),0);
  const tot=sum(r=>r.total_cost),pros=sum(r=>r.total_prospects),q=sum(r=>r.qualified_count),cc=sum(r=>r.conversation_count),cv=sum(r=>(r.cost_per_conversation||0)*r.conversation_count);
  return {per_prospect:pros?tot/pros:null,per_qualified:q?tot/q:null,per_conv:cc?cv/cc:null};
}

/* ================= SHELL ================= */
function sidebar(){
  const nav=(id,label,icon,badge)=>`<button data-nav="${id}" title="${label}" aria-current="${S.page===id?'page':'false'}">${ic(icon)}<span>${label}</span>${badge?`<span class="badge">${badge}</span>`:''}</button>`;
  return `<aside class="side">
    <div class="brand"><svg class="mark" viewBox="0 0 24 24" fill="none"><path d="M3 15a9 9 0 0118 0" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/><path d="M7 15a5 5 0 0110 0" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" opacity=".6"/><circle cx="12" cy="17" r="1.6" fill="var(--accent)"/></svg><u>SDR OS</u></div>
    <div class="nav-label">MAIN</div>
    <div class="nav">
      ${nav('overview','Overview','overview')}
      ${nav('campaigns','Campaigns','campaigns')}
      ${nav('prospects','Prospects','prospects')}
      ${nav('conversations','Conversations','conversations')}
      ${nav('agents','Agents','agents')}
      ${nav('tasks','Tasks &amp; approvals','tasks',TASKS.length)}
      ${nav('analytics','Analytics','analytics')}
      ${nav('integrations','Integrations','integrations')}
      ${nav('knowledge','Knowledge','knowledge')}
    </div>
    <div class="nav-label">OTHERS</div>
    <div class="nav">${nav('settings','Settings','settings')}${nav('help','Help &amp; support','help')}${nav('account','Account','account')}</div>
    <div class="side-bottom">${sidePanel()}</div>
  </aside>`;
}
// Sidebar footer: service health, today's AI spend against a budget, who is signed in, and the collapse control.
const SPEND_BUDGET=50; // placeholder: no budget is configured anywhere yet
const money=v=>'$'+(v<1?v.toFixed(4):v.toFixed(2));
function sidePanel(){
  const h=S.health,sp=S.spend;
  const tone=!h?'warn':h.ok?'':'bad';
  const head=!h?'Checking services…':h.ok?'All systems operational':'Service problem';
  const sub=h?`${h.healthy} of ${h.total} services healthy`:'';
  const title=h?h.services.map(s=>`${s.name}: ${s.ok?'OK':'DOWN'} (${s.detail})`).join('\n'):'';
  const spent=sp?sp.total_cost:null;
  return `<div class="sys" title="${esc(title)}">
    <div class="row ${tone}"><span class="dot ${tone?'':'pulse'}" style="color:var(--${tone==='bad'?'red':tone==='warn'?'amber':'accent'})"></span><span class="txt">${head}</span></div>
    ${sub?`<div class="sub txt">${sub}</div>`:''}
    <div class="spend"><div style="display:flex;justify-content:space-between;gap:8px"><span class="mute">AI spend today</span><b class="num">${spent==null?'…':money(spent)}</b></div>
      <div class="mute" style="font-size:10.5px;margin-top:2px">of ${money(SPEND_BUDGET)} budget (placeholder)</div>
      <div class="meter"><i style="width:${spent?Math.max(2,Math.min(100,spent/SPEND_BUDGET*100)):0}%"></i></div></div>
  </div>
  <div class="me"><span class="avatar" style="background:${avatarColor(S.user.display_name)};width:30px;height:30px;font-size:12px">${initials(S.user.display_name)}</span><div class="txt" style="min-width:0"><b style="font-size:12.5px">${esc(S.user.display_name)}</b><div class="mute" style="font-size:11px">${esc(S.user.role)}</div></div><button class="icon-btn" data-act="logout" title="Sign out" aria-label="Sign out" style="margin-left:auto">${ic('logout',15)}</button></div>
  <button class="side-collapse" data-act="collapse" title="${S.collapsed?'Expand sidebar':'Collapse sidebar'}" aria-label="${S.collapsed?'Expand sidebar':'Collapse sidebar'}">${ic('collapse')}<span class="lbl">Collapse</span></button>`;
}
function topbar(){
  const h=S.health;
  const sysCls=!h?'warn':h.ok?'':'bad',sysTxt=!h?'Checking…':h.ok?'System operational':'System degraded';
  return `<div class="top">
    <div class="grow"></div>
    <span class="ind ${sysCls}"><span class="dot"></span>${sysTxt}</span>
    <span class="ind ${S.killed?'bad':''}"><span class="dot"></span>${S.killed?'AI paused':'AI working'}</span>
    <button class="icon-btn" data-act="theme" title="Toggle theme">${ic(document.documentElement.dataset.theme==='light'?'moon':'sun',17)}</button>
    <button class="icon-btn" data-nav="tasks" style="position:relative">${ic('bell',17)}${TASKS.length?'<span style="position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:var(--red)"></span>':''}</button>
    <button class="kill ${S.killed?'on':''}" data-act="kill">${ic('pause',15)}${S.killed?'Paused — resume':'Global pause'}</button>
  </div>`;
}
function shell(inner){
  return `<div class="app${S.collapsed?' collapsed':''}">${sidebar()}<main class="main">${topbar()}<div class="content">${inner}</div></main></div>${modal()}${drawer()}`;
}
/* ================= LOGIN ================= */
// A bare centred screen with no navigation and no data (used before we know who you are).
const plainScreen=inner=>`<main class="login"><div class="login-card" style="text-align:center">${inner}</div></main>`;
function loginPage(){
  return `<main class="login"><form class="login-card" id="login-form" novalidate>
    <div class="brand" style="justify-content:center;padding:0 0 18px"><svg class="mark" viewBox="0 0 24 24" fill="none"><path d="M3 15a9 9 0 0118 0" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/><path d="M7 15a5 5 0 0110 0" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" opacity=".6"/><circle cx="12" cy="17" r="1.6" fill="var(--accent)"/></svg><span>SDR OS</span></div>
    <h1 class="login-h">Sign in</h1>
    <p class="mute" style="font-size:12.5px;margin-bottom:18px;text-align:center">Use your team account to open the control plane.</p>
    ${S.loginNotice?`<div class="login-msg note" role="status">${esc(S.loginNotice)}</div>`:''}
    ${S.loginError?`<div class="login-msg err" role="alert">${esc(S.loginError)}</div>`:''}
    <div class="field"><label for="login-email">Email</label><input id="login-email" name="email" type="email" autocomplete="username" spellcheck="false" autocapitalize="none" required value="${esc(S.loginEmail)}"></div>
    <div class="field"><label for="login-password">Password</label><input id="login-password" name="password" type="password" autocomplete="current-password" required></div>
    <button class="btn primary" type="submit" style="width:100%;justify-content:center;padding:10px" ${S.loginBusy?'disabled':''}>${S.loginBusy?'Signing in…':'Sign in'}</button>
    <p class="mute" style="font-size:11.5px;margin-top:16px;text-align:center">Access is limited to team members. Ask an admin if you need an account.</p>
  </form></main>`;
}
async function doLogin(){
  if(S.loginBusy)return;
  const email=(document.getElementById('login-email')?.value||'').trim(),password=document.getElementById('login-password')?.value||'';
  S.loginEmail=email;S.loginNotice=null;
  if(!email||!password){S.loginError='Enter your email and password.';render();return}
  S.loginBusy=true;S.loginError=null;render();
  try{
    await api('POST','/auth/login',{email,password});
    S.loginBusy=false;S.loginEmail='';
    await boot(); // now there is a session: reads /auth/me and loads the data
  }catch(e){
    S.loginBusy=false;S.loginError=e.message||'Could not sign in';render();
    const pw=document.getElementById('login-password');if(pw){pw.value='';pw.focus()}
  }
}

// Shown until the first load finishes, or if it fails.
function bootScreen(){
  return shell(S.loadError
    ?`<div class="empty"><p style="margin-bottom:12px">Couldn't load data from the backend.</p><p class="mute" style="margin-bottom:16px">${esc(S.loadError)}</p><button class="btn primary" data-act="retry">Retry</button></div>`
    :'<div class="empty">Loading…</div>');
}

/* ================= OVERVIEW ================= */
function overview(){
  const live=CAMPAIGNS.filter(c=>c.status==='live').length;
  const totalPros=CAMPAIGNS.reduce((a,c)=>a+c.pros,0);
  const totalCont=CAMPAIGNS.reduce((a,c)=>a+c.cont,0);
  const totalMeet=CAMPAIGNS.reduce((a,c)=>a+c.meet,0);
  const totalOpp=CAMPAIGNS.reduce((a,c)=>a+c.opp,0);
  const ids=CAMPAIGNS.map(c=>c.id),today=new Date().toDateString();
  const addedToday=PROS.filter(p=>new Date(p.raw.created_at).toDateString()===today).length;
  const sentToday=dispatches(ids).filter(a=>new Date(a.created_at).toDateString()===today).length;
  const kpis=[[totalPros.toLocaleString(),'Prospects in pipeline',`+${addedToday} today`],[totalCont,'Contacted',`${sentToday} dispatched today`],
    [`${live} of ${CAMPAIGNS.length}`,'Campaigns live',`${CAMPAIGNS.filter(c=>c.status==='paused').length} paused, ${CAMPAIGNS.filter(c=>c.status==='draft').length} draft`],
    [TASKS.length,'Needs attention','pending approvals'],[totalMeet,'Meetings booked',`${S.meetings.filter(m=>m.scheduled_at).length} with a time set`],[totalOpp,'Qualified opportunities',`of ${totalPros} prospects`]];
  const growth=monthBuckets(PROS,p=>p.raw.created_at);
  return shell(`<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:22px;flex-wrap:wrap;gap:12px">
    <div><h1 class="page-t">Good morning</h1><p class="mute" style="margin-top:4px">Here's what your agents did while you were away.</p></div>
    <button class="btn accent" data-nav="campaigns">${ic('plus',14)} New campaign</button></div>
  <div class="grid g6" style="margin-bottom:16px">${kpis.map(([v,l,d])=>`<div class="card kpi"><div class="v num">${v}</div><div class="l">${l}</div><div class="d">${ic('up')}${d}</div></div>`).join('')}</div>
  <div class="grid g2">
    <section class="card"><div class="card-h"><h3>Prospects, last 12 months</h3></div><div class="card-b"><div class="dots"></div>${sparkChart(growth.pts,growth.labels)}</div></section>
    <section class="card"><div class="card-h"><h3>Meetings booked, per campaign</h3></div><div class="card-b">${barChart(CAMPAIGNS.filter(c=>c.status!=='draft').map(c=>[c.name,c.meet]))}</div></section>
  </div>
  <section class="card" style="margin-top:14px"><div class="card-h"><h3>Live agent activity</h3><span class="pill live"><span class="dot pulse-true"></span>Streaming</span></div>
  ${feedRows(FEED,true)}
  </section>`);
}
function feedRows(items,withAge){
  if(!items.length)return '<div class="empty">No agent activity yet.</div>';
  return items.map(e=>`<div style="display:flex;gap:12px;padding:12px 18px;border-bottom:1px solid var(--line2);align-items:center">
    <div style="width:32px;height:32px;border-radius:9px;background:var(--bg-elev2);display:grid;place-items:center;color:var(--ink2)">${ic(agent(e.a)?.icon||'bolt',15)}</div>
    <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:12.5px">${esc(e.t)}</div><div class="mute" style="font-size:11.5px;margin-top:1px">${esc(agent(e.a)?.name||({dispatch:'Dispatch',discovery:'Discovery'}[e.a]||e.a))} · ${esc(e.s)}</div></div>
    <div class="mute num" style="font-size:11.5px">${ago(e.at)}</div></div>`).join('');
}
function sparkChart(pts,labels){
  const max=Math.max(...pts,1),w=560,h=150,step=w/(pts.length-1);
  const path=pts.map((p,i)=>`${i?'L':'M'}${i*step},${h-(p/max)*h+10}`).join(' ');
  const area=path+` L${w},${h+10} L0,${h+10} Z`;
  return `<svg viewBox="0 0 ${w} ${h+30}" style="width:100%;height:190px" preserveAspectRatio="none">
    <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#sg)"/><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round"/>
    ${labels.map((m,i)=>`<text x="${i*(w/(labels.length-1))}" y="${h+26}" font-size="10" fill="var(--mute)" text-anchor="${i===0?'start':i===labels.length-1?'end':'middle'}">${esc(m)}</text>`).join('')}
  </svg>`;
}
function barChart(rows){
  const max=Math.max(...rows.map(r=>r[1]),1);
  return `<div class="bars">${rows.map(([l,v])=>`<div class="b"><i style="height:${Math.max((v/max)*110,6)}px"><span class="v">${v}</span></i><div class="l">${esc(l)}</div></div>`).join('')}</div>`;
}

/* ================= CAMPAIGNS ================= */
function campaignsPage(){
  const filt={all:()=>true,live:c=>c.status==='live',paused:c=>c.status==='paused',draft:c=>c.status==='draft',completed:c=>c.status==='completed'};
  const list=CAMPAIGNS.filter(filt[S.campFilter]);
  return shell(`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
    <h1 class="page-t">Campaigns</h1><button class="btn accent" data-act="new-camp">${ic('plus',14)} Create campaign</button></div>
  <div class="filters">${['all','live','paused','draft','completed'].map(f=>`<button aria-pressed="${S.campFilter===f}" data-filter="${f}">${f[0].toUpperCase()+f.slice(1)}</button>`).join('')}</div>
  <div class="grid gauto">${list.map(campCard).join('')||'<div class="empty">No campaigns in this view.</div>'}</div>`);
}
function campCard(c){
  const active=AGENTS.length-AGENTS.filter(a=>(c.enabled_agents||{})[a.id]===false).length;
  const chans=Object.entries(c.channel_config||{}).filter(([,v])=>v.enabled);
  return `<article class="card">
   <div style="padding:17px 18px 12px;display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
     <div><h3 style="font-size:15px;font-weight:700">${esc(c.name)}</h3><p class="mute" style="font-size:11.5px;margin-top:4px">${esc(c.view.industries.join(', '))} · ${esc(c.view.geo)}</p></div>
     ${statusPill(c.status)}</div>
   <div style="display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line2);border-bottom:1px solid var(--line2)">
     ${[['Prospects',c.pros],['Contacted',c.cont],['Meetings',c.meet]].map(([l,v],i)=>`<div style="padding:12px 16px;${i?'border-left:1px solid var(--line2)':''}"><div class="serif" style="font-size:20px;font-weight:600">${v}</div><div class="mute" style="font-size:11px">${l}</div></div>`).join('')}
   </div>
   <div style="padding:13px 18px 6px"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:7px"><span class="mute">Agent health</span><span class="ink2">${active}/7 ${c.status==='live'?'active':'enabled'}</span></div>
   <div class="health">${Array.from({length:7}).map((_,i)=>`<i class="${c.status==='live'&&i<active?'':'off'}"></i>`).join('')}</div>
   <div style="display:flex;gap:6px;margin-top:9px">${chans.map(([k])=>`<span class="pill">${chIcon(k)} ${chName(k)}</span>`).join('')||'<span class="mute" style="font-size:11px">No channels configured</span>'}</div></div>
   <div style="padding:14px 18px;display:flex;gap:8px">
     <button class="btn primary" style="flex:1" data-open-camp="${c.id}">Open campaign</button>
     ${c.status==='live'?`<button class="btn" data-pause-camp="${c.id}">Pause</button>`:c.status==='paused'?`<button class="btn" data-resume-camp="${c.id}">Resume</button>`:c.status==='draft'?`<button class="btn" data-launch="${c.id}">Launch</button>`:''}
   </div></article>`;
}

function campDetail(){
  const c=camp(S.campId); if(!c) return campaignsPage();
  const tabs=['Overview','Prospects','Activity','Agents','Prompts','Conversations','Analytics','Configuration','Knowledge'];
  return shell(`<button class="btn ghost sm" data-act="back-camps" style="margin-bottom:10px">← All campaigns</button>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:10px">
    <div style="display:flex;align-items:center;gap:12px"><h1 class="page-t">${esc(c.name)}</h1>${statusPill(c.status)}</div>
    <div style="display:flex;gap:8px">
      ${c.status==='live'?`<button class="btn danger" data-pause-camp="${c.id}">Pause campaign</button>`:c.status==='paused'?`<button class="btn accent" data-resume-camp="${c.id}">Resume campaign</button>`:c.status==='draft'?`<button class="btn accent" data-launch="${c.id}">Launch campaign</button>`:''}
      <button class="btn" data-act="dup" data-id="${c.id}">Duplicate</button>
    </div></div>
  <div class="tabs">${tabs.map(t=>`<button aria-selected="${S.campTab===t}" data-ctab="${t}">${t}</button>`).join('')}</div>
  ${campTabBody(c,S.campTab)}`);
}
function campTabBody(c,t){
  if(t==='Overview'){
    return `<div class="grid g2">
      <section class="card"><div class="card-h"><h3>Prospect funnel</h3></div><div class="card-b">${funnelChart(c.funnel)}</div></section>
      <div style="display:flex;flex-direction:column;gap:14px">
        <section class="card"><div class="card-h"><h3>Sample profile</h3></div><div class="card-b">${c.sample_profiles?.[0]?`<div class="kv"><dt>Name</dt><dd>${esc(c.sample_profiles[0].name)}</dd><dt>Title</dt><dd>${esc(c.sample_profiles[0].title)}</dd><dt>Company</dt><dd>${esc(c.sample_profiles[0].company)}</dd></div>`:'<div class="empty" style="padding:12px 0">No sample profile yet.</div>'}</div></section>
        <section class="card"><div class="card-h"><h3>Outcomes</h3></div><div class="card-b"><dl class="kv"><dt>Meetings</dt><dd>${c.meet}</dd><dt>Opportunities</dt><dd>${c.opp}</dd><dt>Conversion</dt><dd>${c.conv}</dd><dt>Owner</dt><dd>${esc(c.owner)}</dd><dt>Created</dt><dd>${c.created}</dd></dl></div></section>
      </div></div>`;
  }
  if(t==='Prospects') return discoverBar(c)+prosTable(PROS.filter(p=>p.camp===c.id),true);
  if(t==='Activity') return `<section class="card">${(S.acts[c.id]||[]).map(a=>feedItem(a,c)).map(e=>`<div style="display:flex;gap:12px;padding:12px 18px;border-bottom:1px solid var(--line2)"><div style="width:30px;height:30px;border-radius:8px;background:var(--bg-elev2);display:grid;place-items:center">${ic(agent(e.a)?.icon||'bolt',14)}</div><div><div style="font-weight:600;font-size:12.5px">${esc(e.t)}</div><div class="mute" style="font-size:11px">${esc(agent(e.a)?.name||({dispatch:'Dispatch',discovery:'Discovery'}[e.a]||e.a))} · ${esc(e.s)} · ${ago(e.at)}</div></div></div>`).join('')||'<div class="empty">No activity for this campaign yet.</div>'}</section>`;
  if(t==='Agents') return `<div class="grid gauto">${AGENTS.map(a=>{const paused=c.enabled_agents?.[a.id]===false;
    const lastRun=(S.acts[c.id]||[]).find(x=>x.agent_type===a.id);
    return `<section class="card" style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="display:flex;gap:9px;align-items:center"><div style="width:28px;height:28px;border-radius:8px;background:var(--bg-elev2);display:grid;place-items:center">${ic(a.icon,14)}</div><b style="font-size:13px">${a.name}</b></div><span class="pill ${paused?'paused':'live'}">${paused?'Paused':'Active'}</span></div>
    <p class="mute" style="font-size:11.5px;margin-bottom:12px">${paused?'Not running for this campaign':lastRun?`Last run ${ago(lastRun.created_at)}: ${esc(actTitle(lastRun))}`:'No runs yet for this campaign'}</p>
    <button class="btn sm" style="width:100%" data-cagent="${a.id}" data-camp="${c.id}">${paused?'Resume for this campaign':'Pause for this campaign'}</button></section>`}).join('')}</div>`;
  if(t==='Prompts') return promptsBody();
  if(t==='Conversations') return convList(CONVOS.filter(v=>v.camp===c.name));
  if(t==='Analytics') return analyticsForCamp(c);
  if(t==='Configuration') return configBody(c)+dangerZone(c);
  if(t==='Knowledge') return `<section class="card"><div class="scroll"><table class="tbl"><thead><tr><th>Document</th><th>Type</th><th>Used by this campaign</th></tr></thead><tbody>
    ${KB.map(k=>`<tr><td><b>${esc(k.name)}</b></td><td class="mute">${k.type}</td><td>${k.used.includes(c.name)?`<span class="pill live">${ic('check',11)} In use</span>`:'<span class="mute">Not attached</span>'}</td></tr>`).join('')}
    </tbody></table></div></section>`;
  return '';
}
// Two ways to find new prospects. Discover only searches the web (Tavily) and reads it with Groq: cheap, no DronaHQ credits.
// Discover & qualify then runs the real DronaHQ Research and ICP agents on each new prospect: it spends credits, so it is a
// separate, differently styled button that always asks first. Nothing runs it automatically.
function discoverBar(c){
  const w=S.working&&S.working.id===c.id?S.working.kind:null;
  return `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px">
    <button class="btn" data-act="discover" data-id="${c.id}" ${S.working?'disabled':''}>${ic('search',14)} ${w==='discover'?'Discovering…':'Discover prospects'}</button>
    <button class="btn warn" data-act="dq-open" data-id="${c.id}" ${S.working?'disabled':''}>${w==='dq'?'Discovering and qualifying…':'Discover &amp; qualify'}</button>
    <span class="mute" style="font-size:11.5px">Discover searches the web and adds prospects (no agent credits). Discover &amp; qualify also runs the real DronaHQ agents and spends credits.</span></div>`;
}
function funnelChart(f){
  const max=Math.max(...f,1);
  return `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:0">${STAGES.map((s,i)=>`
    <div style="padding:0 10px 0 ${i?14:0}px;${i?'border-left:1px solid var(--line2)':''}">
      <div style="height:60px;display:flex;align-items:flex-end;margin-bottom:10px"><div style="width:100%;background:${i===0?'var(--blue)':'var(--accent)'};opacity:${.5+i*.07};border-radius:4px 4px 0 0;min-height:3px;height:${Math.max((f[i]/max)*100,3)}%"></div></div>
      <div class="serif" style="font-size:19px;font-weight:600">${f[i]}</div><div class="mute" style="font-size:11px">${STAGE_L[s]}</div>
    </div>`).join('')}</div>`;
}
// The backend accepts either "voice" or "phone" for the voice channel; use whichever the campaign already has.
function chanKey(c,ch){const cc=c.channel_config||{};return ch==='voice'&&cc.voice===undefined&&cc.phone!==undefined?'phone':ch}
function dangerZone(c){
  return `<section class="card" style="margin-top:14px;border-color:var(--red)"><div class="card-h"><h3>Danger zone</h3></div>
    <div class="card-b" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
      <div style="max-width:620px"><b style="font-size:13px">Delete this campaign</b>
        <p class="mute" style="font-size:12px;margin-top:3px">Permanently removes the campaign with its prospect links, activity, prompt versions, rep assignments, approvals and meetings. The prospects themselves are kept. This cannot be undone.</p></div>
      <button class="btn danger" data-act="del-open" data-id="${c.id}">Delete campaign…</button></div></section>`;
}
function configBody(c){
  return `<div class="grid g2"><div>
    <section class="card" style="margin-bottom:14px"><div class="card-h"><h3>Targeting</h3></div><div class="card-b">
      <div class="field"><label>Target roles</label><input value="${esc(c.view.roles.join(', '))}"></div>
      <div class="field"><label>Company size</label><input value="${esc(c.view.size)}"></div>
      <div class="field"><label>Industries</label><input value="${esc(c.view.industries.join(', '))}"></div>
      <div class="field"><label>Geography</label><input value="${esc(c.view.geo)}"></div>
      <button class="btn primary sm">Save targeting</button></div></section>
    <section class="card"><div class="card-h"><h3>Assigned rep</h3></div><div class="card-b">
      <div class="field"><label>Owner for this campaign's outreach identity</label><select>${REPS.map(r=>`<option ${c.rep===r.name?'selected':''}>${esc(r.name)}</option>`).join('')}<option ${c.rep==='Unassigned'?'selected':''}>Unassigned</option></select></div></div></section>
  </div><div>
    <section class="card" style="margin-bottom:14px"><div class="card-h"><h3>Channels</h3></div><div class="card-b">
      ${['email','linkedin','sms','voice'].map(ch=>{const k=chanKey(c,ch);return `<div class="row-sw"><div style="display:flex;align-items:center;gap:9px">${chIcon(ch)}<b style="font-size:12.5px">${chName(ch)}</b></div><button class="sw" role="switch" aria-checked="${!!(c.channel_config||{})[k]?.enabled}" data-cchan="${k}" data-camp="${c.id}"></button></div>`}).join('')}
      </div></section>
    <section class="card"><div class="card-h"><h3>Daily limits</h3></div><div class="card-b">
      ${['email','linkedin','sms','voice'].map(ch=>`<div class="field" style="margin-bottom:10px"><label>${chName(ch)} per day</label><input type="number" placeholder="No limit set" style="max-width:140px"></div>`).join('')}
      </div></section>
  </div></div>`;
}

/* ================= PROMPTS ================= */
function promptsBody(){
  const opts={icp:'ICP Fitment',research:'Research &amp; Enrichment',strategy:'Outreach Strategy',personalisation:'Personalisation',conversation:'Conversation',voice:'Voice SDR',follow:'Follow-up'};
  const rows=S.pv[S.campId+':'+S.promptSel];
  const list=(rows||[]).map(v=>({id:v.id,n:v.version,active:v.is_active,by:v.changed_by||'unknown',at:fmtDateTime(v.changed_at),content:v.content}));
  const active=list.find(v=>v.active);
  const shown=list.find(v=>v.n===S.promptView)||active;
  return `<div class="grid g2" style="align-items:start"><div>
    <select style="width:100%;margin-bottom:14px" data-act="psel">${Object.entries(opts).map(([k,l])=>`<option value="${k}" ${S.promptSel===k?'selected':''}>${l}</option>`).join('')}</select>
    ${!rows?'<div class="empty">Loading…</div>':list.length?list.map(v=>`<div class="card" style="margin-bottom:10px;padding:14px 16px;cursor:pointer" data-pview="${v.n}">
      <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:13px">Version ${v.n}</b>${v.active?'<span class="pill live">Active</span>':'<span class="pill">Archived</span>'}</div>
      <div class="mute" style="font-size:11.5px;margin-top:4px">${esc(v.by)} · ${v.at}</div></div>`).join(''):'<div class="empty">No versions saved yet for this agent.</div>'}
    <button class="btn primary sm" data-act="new-prompt-version" style="width:100%;margin-top:6px">${ic('plus',13)} Save new version</button>
  </div>
  <section class="card"><div class="card-h"><h3>${shown?`Version ${shown.n} · ${shown.active?'active':'not active'}`:'No active version'}</h3>${shown&&!shown.active?`<button class="btn sm accent" data-act="activate-prompt" data-id="${shown.id}">Activate this version</button>`:''}</div>
    <div class="card-b"><textarea style="width:100%;min-height:220px" readonly>${esc(shown?shown.content:'')}</textarea>
    <p class="mute" style="font-size:11px;margin-top:10px">This is campaign-specific guidance appended to the agent's core instructions. It's what answers "why did the agent behave this way" — every activity records which version was active when it ran.</p></div>
  </section></div>`;
}

/* ================= PROSPECTS ================= */
function prosTable(list,inCamp){
  return `<section class="card"><div class="scroll"><table class="tbl"><thead><tr><th>Prospect</th><th>Company</th><th>Role</th><th>ICP score</th><th>Stage</th><th>Last activity</th>${inCamp?'':'<th>Campaign</th>'}<th>Channel</th><th>AI status</th></tr></thead><tbody>
   ${list.length?'':`<tr><td colspan="9" class="empty">No prospects yet.</td></tr>`}
   ${list.map(p=>`<tr class="row" data-pro="${p.id}"><td style="display:flex;align-items:center;gap:9px"><span class="avatar" style="background:${avatarColor(p.name)}">${initials(p.name)}</span><b>${esc(p.name)}</b>${liLink(p)}</td>
   <td>${esc(p.co)}</td><td>${esc(p.role)}</td><td class="num">${p.score}</td><td>${stagePill(p.stage)}</td><td class="mute">${p.last}</td>
   ${inCamp?'':`<td>${esc(camp(p.camp)?.name)}</td>`}<td style="display:flex;align-items:center;gap:6px">${chIcon(p.ch)}${chName(p.ch)}</td>
   <td><span class="pill ${p.ai==='active'?'live':p.ai==='rejected'?'paused':''}">${AI_L[p.ai]}</span></td></tr>`).join('')}
  </tbody></table></div></section>`;
}
function prospectsPage(){return shell(`<h1 class="page-t" style="margin-bottom:18px">Prospects</h1>${prosTable(PROS,false)}`)}
// The four steps of Qualify & draft, and whether this prospect already has each (mirrors orchestrator/qualifyAndDraft.js; the
// confirmation dialog asks the backend for the authoritative plan, this only draws the checklist).
function qdSteps(p){
  const x=p.raw,ctx=x.context_json||{};
  return [['Research',!!ctx.research],['ICP scoring',x.icp_score!=null],['Strategy',!!ctx.strategy],['Personalisation',!!(ctx.email_subject&&ctx.email_body)]];
}
function qdCard(p){
  const steps=qdSteps(p),working=S.working&&S.working.id===p.id&&S.working.kind==='qd';
  const before=['discovered','researched','qualified'].includes(p.stage);
  const note=p.stage==='rejected'?'Rejected by ICP scoring, so nothing more will be run.'
    :!before?'Already in outreach; this is for prospects before outreach starts.'
    :steps.every(s=>s[1])?'Everything is already done for this prospect.'
    :'Runs only the steps still missing. It calls real DronaHQ agents and spends credits, and never contacts the prospect.';
  return `<section class="card"><div class="card-h"><h3>Outreach preparation</h3><span class="mute" style="font-size:11px">Research → ICP → Strategy → Email</span></div><div class="card-b">
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${steps.map(([l,d])=>`<span class="pill ${d?'done':''}">${d?'✓ ':''}${l}</span>`).join('')}</div>
    <button class="btn warn" data-act="qd-open" data-id="${p.id}" ${S.working||!before||p.stage==='rejected'||steps.every(s=>s[1])?'disabled':''}>${working?'Working…':'Qualify &amp; draft outreach'}</button>
    <p class="mute" style="font-size:11.5px;margin-top:10px">${note}</p></div></section>`;
}
function prospectDetail(){
  const p=pro(S.pid); if(!p) return prospectsPage();
  const c=camp(p.camp);
  return shell(`<button class="btn ghost sm" data-act="back-pros" style="margin-bottom:10px">← All prospects</button>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px">
    <div style="display:flex;align-items:center;gap:12px"><span class="avatar" style="background:${avatarColor(p.name)};width:40px;height:40px;font-size:14px">${initials(p.name)}</span>
    <div><h1 class="page-t" style="font-size:20px;display:flex;align-items:center;gap:8px">${esc(p.name)}${liLink(p)}</h1><p class="mute" style="font-size:12px">${esc(p.role)}, ${esc(p.co)} · ${esc(c?.name)}</p></div>${stagePill(p.stage)}</div>
    <div class="card kpi" style="padding:9px 16px"><div style="display:flex;align-items:baseline;gap:8px"><span class="serif" style="font-size:22px;font-weight:600">${p.score}</span><span class="mute" style="font-size:11px">ICP score</span></div></div>
  </div>
  <div class="grid g2">
    <div style="display:flex;flex-direction:column;gap:14px">
      ${qdCard(p)}
      <section class="card"><div class="card-h"><h3>Research summary</h3><span class="mute" style="font-size:11px">Research &amp; Enrichment agent</span></div>
        <div class="card-b">${p.raw.context_json?.research?`<div style="font-size:12.5px;line-height:1.55">${md(p.raw.context_json.research)}</div>`:`<div class="mute" style="font-size:12.5px">${esc(p.co)} has not been researched yet.</div>`}</div></section>
      <section class="card"><div class="card-h"><h3>ICP reasoning</h3></div><div class="card-b ${p.raw.icp_reasoning?'':'mute'}" style="font-size:12.5px;line-height:1.55">${md(p.raw.icp_reasoning||'Not scored yet.')}</div></section>
      ${(()=>{const ctx=p.raw.context_json||{},st=ctx.strategy;return `<section class="card"><div class="card-h"><h3>Outreach strategy</h3><span class="mute" style="font-size:11px">Outreach Strategy agent</span></div>
        <div class="card-b">${st?`<dl class="kv"><dt>Next channel</dt><dd>${mdInline(st.next_channel)}</dd><dt>Contact now</dt><dd>${mdInline(st.contact_now)}</dd><dt>Timing</dt><dd>${mdInline(st.timing)}</dd><dt>Reasoning</dt><dd>${md(st.reasoning)}</dd></dl>`:'<div class="mute" style="font-size:12.5px">No strategy decided yet.</div>'}</div></section>
      <section class="card"><div class="card-h"><h3>Drafted email</h3><span class="mute" style="font-size:11px">Personalisation agent</span></div>
        <div class="card-b">${ctx.email_subject&&ctx.email_body?`<div style="font-size:12.5px"><b>${mdInline(ctx.email_subject)}</b><div style="margin-top:8px;line-height:1.55">${md(ctx.email_body)}</div>${ctx.email_snippets_used?`<div class="mute" style="font-size:11px;margin-top:10px">Snippets used: ${esc(ctx.email_snippets_used)}</div>`:''}</div>`:'<div class="mute" style="font-size:12.5px">No email drafted yet.</div>'}</div></section>
      ${ctx.voice_call?`<section class="card"><div class="card-h"><h3>Voice call (simulated)</h3><span class="mute" style="font-size:11px">Voice SDR agent${ctx.voice_call.outcome?' · '+esc(String(ctx.voice_call.outcome).replace(/[*_]/g,'')):''}</span></div>
        <div class="card-b"><div style="font-size:12.5px;line-height:1.55">${md(ctx.voice_call.transcript)}</div>${ctx.voice_call.reasoning?`<div class="mute" style="font-size:11.5px;margin-top:10px">${mdInline(ctx.voice_call.reasoning)}</div>`:''}</div></section>`:''}`})()}
    </div>
    <section class="card"><div class="card-h"><h3>Conversation timeline</h3><span class="mute" style="font-size:11px">One thread across channels</span></div>
      <div class="card-b">${CONVOS.filter(v=>v.cp===p.id).map(v=>`<div style="padding:10px 0;border-bottom:1px solid var(--line2)"><div style="display:flex;justify-content:space-between"><b style="font-size:12px">${chName(v.ch)}</b><span class="mute" style="font-size:11px">${v.time}</span></div><div style="font-size:12.5px;margin-top:3px;line-height:1.5">${md(v.msg)}</div></div>`).join('')||'<div class="empty" style="padding:16px 0">No replies yet.</div>'}</div></section>
  </div>`);
}

/* ================= CONVERSATIONS ================= */
function convList(list){
  return `<section class="card">${list.map(v=>`<div style="display:grid;grid-template-columns:180px 1fr auto auto;gap:14px;align-items:center;padding:13px 18px;border-bottom:1px solid var(--line2)">
    <div><b style="font-size:12.5px">${esc(v.who)}</b><div class="mute" style="font-size:11px">${esc(v.co)} · ${chName(v.ch)}</div></div>
    <div style="font-size:12.5px;line-height:1.5">${md(v.msg)}</div><span class="tag ${INTENT_C[v.intent]}">${v.intent}</span><span class="mute" style="font-size:11px">${v.time}</span></div>`).join('')||'<div class="empty">No conversations.</div>'}</section>`;
}
function conversationsPage(){
  const tabs=[['all','All'],['positive','Positive'],['escalated','Escalated'],['not-now','Not now'],['unsubscribe','Unsubscribe']];
  const list=CONVOS.filter(v=>S.convTab==='all'||v.intent===S.convTab);
  return shell(`<h1 class="page-t" style="margin-bottom:14px">Conversations</h1>
  <div class="tabs">${tabs.map(([k,l])=>`<button aria-selected="${S.convTab===k}" data-ctabv="${k}">${l}</button>`).join('')}</div>${convList(list)}`);
}

/* ================= AGENTS ================= */
// Discovery is not one of the 7 DronaHQ agents: it searches the web (Tavily) and has an LLM (Groq) pick out named people. Its numbers
// come from its real activity rows and from prospects whose source is 'discovery'; nothing here is a placeholder.
function discoveryStats(){
  const runs=CAMPAIGNS.flatMap(c=>(S.acts[c.id]||[]).filter(a=>a.agent_type==='discovery')).sort((x,y)=>new Date(y.created_at)-new Date(x.created_at));
  const searches=runs.reduce((n,r)=>n+String(r.input_summary||'').split('\n').filter(l=>l.startsWith('- ')).length,0);
  const found=CAMPAIGNS.reduce((n,c)=>n+(S.cps[c.id]||[]).filter(cp=>cp.prospect&&cp.prospect.source==='discovery').length,0);
  const cost=runs.reduce((n,r)=>n+(Number(r.cost)||0),0);
  return {runs,searches,found,cost,last:runs[0]||null};
}
function discoveryCard(){
  const st=discoveryStats(),int=(S.health&&S.health.integrations)||{};
  const configured=int.groq&&int.groq.connected&&int.tavily&&int.tavily.connected;
  const pill=configured?'<span class="pill live"><span class="dot"></span>Ready</span>':'<span class="pill paused">Not configured</span>';
  const lastLine=st.last?String(st.last.output_summary||'').split('\n').pop().slice(0,90):'';
  const task=!configured?'Needs GROQ_API_KEY and TAVILY_API_KEY in .env'
    :st.last?(st.last.status==='failed'?'Last run failed: '+esc(String(st.last.output_summary||'').split('\n')[0].slice(0,90)):'Last run '+esc(ago(st.last.created_at))+': '+mdInline(lastLine))
    :'Ready. Not run yet: use "Discover prospects" on a campaign\'s Prospects tab';
  const stat=(v,l)=>`<div><div class="serif" style="font-size:16px;font-weight:600">${v}</div><div class="mute" style="font-size:10.5px">${l}</div></div>`;
  return `<section class="card" style="padding:17px;border-style:dashed" data-agent-card="discovery">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="display:flex;gap:10px;align-items:center"><div style="width:30px;height:30px;border-radius:9px;background:var(--bg-elev2);display:grid;place-items:center">${ic('search',15)}</div><b style="font-size:13.5px">Discovery</b></div>${pill}</div>
    <p style="margin-bottom:8px"><span class="pill" style="border:1px solid var(--line2)">Runs on Groq + Tavily · not a DronaHQ agent</span></p>
    <p class="mute" style="font-size:11.5px;margin-bottom:13px">${task}</p>
    <div class="grid g3" style="gap:10px;margin-bottom:13px">${stat(st.searches,'Searches run')}${stat(st.found,'Prospects found')}${stat('$'+st.cost.toFixed(2),'Est. cost (all runs)')}</div>
    <div style="display:flex;gap:7px"><button class="btn sm" style="flex:1" data-act="agent-logs" data-id="discovery">Logs</button><button class="btn sm" style="flex:1" data-nav="campaigns">Run from a campaign</button></div>
  </section>`;
}
// The real numbers for one agent from GET /agents/stats: { processed, success_rate, errors, cost_today, last_activity, ... }.
// null while they load or if the request failed, so the card shows a dash rather than any number it can't back up.
const agentStat=id=>(S.agentStats&&S.agentStats.agents&&S.agentStats.agents[id])||null;
// 100% only when every activity succeeded; otherwise rounded down so 199 of 200 never reads as 100%.
const pctOf=r=>r==null?'—':r>=1?'100%':(Math.floor(r*1000)/10)+'%';
// The agent's newest activity, from the recent activities already loaded per campaign: "Scored ICP fit · Priya Menon, CIO".
function latestActivityLine(type){
  let best=null,bc=null;
  for(const c of CAMPAIGNS)for(const a of S.acts[c.id]||[])if(a.agent_type===type&&(!best||a.created_at>best.created_at)){best=a;bc=c}
  return best?[actTitle(best),actWho(best,bc)].filter(Boolean).join(' · '):null;
}
function agentStatCell(v,label,style=''){return `<div style="${style}"><div class="serif" style="font-size:16px;font-weight:600">${v}</div><div class="mute" style="font-size:10.5px">${label}</div></div>`}
function agentStatsNote(){return S.agentStatsErr&&!S.agentStats?`<p class="mute" style="font-size:12px;margin-bottom:12px">Could not load agent stats (${esc(S.agentStatsErr)}). Numbers are hidden rather than guessed.</p>`:''}
function agentsPage(){
  return shell(`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px"><h1 class="page-t">Agents</h1><span class="mute" style="font-size:12px">Shared across all campaigns · 7 agents configured in DronaHQ, plus Discovery on Groq + Tavily</span></div>
  ${agentStatsNote()}<div class="grid gauto">${AGENTS.map(a=>{const st=agentStat(a.id),line=latestActivityLine(a.id);return `<section class="card" style="padding:17px" data-agent-card="${a.id}">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="display:flex;gap:10px;align-items:center"><div style="width:30px;height:30px;border-radius:9px;background:var(--bg-elev2);display:grid;place-items:center">${ic(a.icon,15)}</div><b style="font-size:13.5px">${a.name}</b></div><span class="pill live"><span class="dot pulse-true"></span>Live</span></div>
    <p class="mute" style="font-size:11.5px;margin-bottom:13px">${line?esc(line):'No activity yet'}</p>
    <div class="grid g3" style="gap:10px;margin-bottom:10px">
      ${agentStatCell(st?st.processed:'…','Processed')}
      ${agentStatCell(st?pctOf(st.success_rate):'…','Success rate')}
      ${agentStatCell(st?money(st.cost_today):'…','Cost today (est.)')}
    </div>
    <div class="grid g3" style="gap:10px;margin-bottom:13px">
      ${agentStatCell(st?`<span${st.errors?' style="color:var(--red)"':''}>${st.errors}</span>`:'…','Errors')}
      ${agentStatCell(st?(st.last_activity?ago(st.last_activity):'—'):'…','Last activity','grid-column:span 2')}
    </div>
    <div style="display:flex;gap:7px"><button class="btn sm" style="flex:1" data-act="agent-logs" data-id="${a.id}">Logs</button><button class="btn sm" style="flex:1" data-nav="campaigns">Configure</button></div>
  </section>`}).join('')}${discoveryCard()}</div>`);
}

/* ================= TASKS ================= */
function tasksPage(){
  return shell(`<h1 class="page-t" style="margin-bottom:6px">Needs your attention</h1><p class="mute" style="margin-bottom:18px">${TASKS.length} items waiting. Agents stop and ask when a rule tells them to.</p>
  <div class="grid gauto" style="grid-template-columns:1fr">${TASKS.map(taskCard).join('')}</div>`);
}
function taskCard(t){
  if(t.cols){return `<article class="card" style="padding:18px"><span class="tag ${t.tagc}">${t.tag}</span>
    <div style="margin-top:10px;margin-bottom:14px"><b style="font-size:14px">${esc(t.who)}</b><div class="mute" style="font-size:11.5px">${esc(t.sub)}</div></div>
    <div class="grid g2">${t.cols.map(([n,d,x])=>`<div class="card" style="background:var(--bg);padding:13px"><div style="display:flex;justify-content:space-between"><b style="font-size:12.5px">${esc(n)}</b><span class="mute" style="font-size:11px">${x}</span></div><p class="mute" style="font-size:11.5px;margin-top:5px">${esc(d)}</p></div>`).join('')}</div>
    <div style="display:flex;gap:8px;margin-top:16px">${t.btns.map(([l,c])=>`<button class="btn ${c}" data-task="${t.id}" data-do="${l}">${l}</button>`).join('')}</div></article>`}
  return `<article class="card" style="padding:18px"><span class="tag ${t.tagc}">${t.tag}</span>
   <div style="margin:10px 0 14px"><b style="font-size:14px">${esc(t.who)}</b><div class="mute" style="font-size:11.5px">${esc(t.sub)}</div></div>
   <div class="grid g3">${[['What happened',t.body.what],['Recommendation',t.body.rec],['Why',t.body.why]].map(([h,x])=>`<div><h4 style="font-size:10.5px;color:var(--mute);margin-bottom:5px">${h}</h4><div style="font-size:12px;line-height:1.5">${md(x)}</div></div>`).join('')}</div>
   <div style="display:flex;gap:8px;margin-top:16px">${t.btns.map(([l,c])=>`<button class="btn ${c}" data-task="${t.id}" data-do="${l}">${l}</button>`).join('')}</div></article>`;
}

/* ================= ANALYTICS ================= */
function analyticsPage(){
  const sent=dispatches(CAMPAIGNS.map(c=>c.id));
  const perDay=dayBuckets(sent,a=>a.created_at);
  const byChannel=['voice','phone','sms','linkedin','email'].map(ch=>[chName(ch),sent.filter(a=>a.channel===ch).length]).filter(([,n],i)=>n>0||i!==1);
  return shell(`<h1 class="page-t" style="margin-bottom:18px">Analytics</h1>
  <div class="grid g3" style="margin-bottom:14px">${CAMPAIGNS.filter(c=>c.status!=='draft').map(c=>`<section class="card kpi"><div class="mute" style="font-size:11.5px;margin-bottom:8px">${esc(c.name)}</div><div class="mute" style="font-size:11px">Contact → meeting</div><div class="serif" style="font-size:24px;font-weight:600;margin-top:4px">${c.conv}</div></section>`).join('')}</div>
  ${costCards(globalCost())}
  <div class="grid g2">
    <section class="card"><div class="card-h"><h3>Contacts per day</h3></div><div class="card-b">${sparkChart(perDay.pts,perDay.labels)}</div></section>
    <section class="card"><div class="card-h"><h3>Channel performance</h3></div><div class="card-b">${barChart(byChannel)}</div></section>
  </div>`);
}
// Cost per prospect / qualified lead / conversation, from GET /campaigns/:id/cost-report (estimates)
function costCards(g){
  const cell=(l,v)=>`<section class="card kpi"><div class="l">${l}</div><div class="v">${g?usd(v):'…'}</div></section>`;
  return `<div class="grid g3" style="margin-bottom:14px">${cell('Cost per prospect (est.)',g&&g.per_prospect)}${cell('Cost per qualified lead (est.)',g&&g.per_qualified)}${cell('Cost per conversation (est.)',g&&g.per_conv)}</div>`;
}
function analyticsForCamp(c){
  const r=S.costs[c.id];
  const perDay=dayBuckets(S.cps[c.id]||[],p=>p.created_at);
  return `<div class="grid g3" style="margin-bottom:14px">
    <section class="card kpi"><div class="l">Conversion</div><div class="v">${c.conv}</div></section>
    <section class="card kpi"><div class="l">Meetings</div><div class="v">${c.meet}</div></section>
    <section class="card kpi"><div class="l">Opportunities</div><div class="v">${c.opp}</div></section>
  </div>${costCards(r&&{per_prospect:r.cost_per_prospect,per_qualified:r.cost_per_qualified_lead,per_conv:r.cost_per_conversation})}
  <section class="card"><div class="card-h"><h3>Prospects added, last 12 days</h3></div><div class="card-b">${sparkChart(perDay.pts,perDay.labels)}</div></section>`;
}

/* ================= INTEGRATIONS ================= */
function integrationsPage(){
  // Gmail, Groq and Tavily are connected only if the backend says so (keys present; Gmail also needs its login accepted).
  const live=(S.health&&S.health.integrations)||{};
  const on=k=>!!(live[k]&&live[k].connected);
  const items=[
   ['DronaHQ Agentic Platform','All 7 agents — reasoning, RAG, guardrails, evals',true],
   ['Supabase','Campaigns, prospects, activities, everything this app reads',true],
   ['Web Search (via DronaHQ)','Live enrichment for the Research agent',true],
   ['Gmail','Real email sending',on('gmail'),live.gmail&&live.gmail.detail],
   ['Groq','Reasoning for prospect discovery',on('groq'),live.groq&&live.groq.detail],
   ['Tavily','Search for prospect discovery',on('tavily'),live.tavily&&live.tavily.detail],
   ['Twilio SMS &amp; Voice','SMS delivery and outbound calls',false],
   ['LinkedIn automation','Connection requests and messages',false],
   ['Apollo','Lead discovery and enrichment',false],
   ['Google Calendar','Meeting booking',false],
  ];
  return shell(`<h1 class="page-t" style="margin-bottom:6px">Integrations</h1><p class="mute" style="margin-bottom:20px">Credentials live here once and are shared by every campaign.</p>
  <div class="grid gauto">${items.map(([n,d,ok,detail])=>`<section class="card" style="padding:17px"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px"><b style="font-size:13px">${n}</b><span class="pill ${ok?'live':''}" ${detail?`title="${esc(detail)}"`:''}>${ok?'Connected':'Not connected'}</span></div><p class="mute" style="font-size:11.5px;margin-bottom:14px">${d}</p><button class="btn sm">Manage</button></section>`).join('')}</div>`);
}

/* ================= KNOWLEDGE ================= */
function knowledgePage(){
  return shell(`<h1 class="page-t" style="margin-bottom:18px">Knowledge base</h1>
  <section class="card"><div class="scroll"><table class="tbl"><thead><tr><th>Document</th><th>Type</th><th>Used by</th></tr></thead><tbody>
  ${KB.map(k=>`<tr><td><b>${esc(k.name)}</b></td><td class="mute">${k.type}</td><td>${k.used.map(u=>`<span class="pill" style="margin-right:5px">${esc(u)}</span>`).join('')}</td></tr>`).join('')}
  </tbody></table></div></section>`);
}

/* ================= SETTINGS ================= */
// Working hours as stored in reps.working_hours (free-form jsonb). Understands { start, end, timezone, days } and a
// per-day map like { mon: "9-17" }; anything else is shown compactly rather than hidden.
function fmtHours(h){
  if(!h||typeof h!=='object'||Array.isArray(h)||!Object.keys(h).length)return 'Not set';
  const tz=h.timezone||h.tz;
  if(h.start&&h.end){
    const days=Array.isArray(h.days)&&h.days.length?`${h.days.join(', ')} `:'';
    return `${days}${h.start}–${h.end}${tz?' '+tz:''}`;
  }
  const parts=Object.entries(h).filter(([k])=>k!=='timezone'&&k!=='tz').map(([k,v])=>{
    const val=v&&typeof v==='object'?`${v.start??''}–${v.end??''}`:String(v);
    return `${k.slice(0,1).toUpperCase()+k.slice(1,3)} ${val}`;
  });
  return parts.join(', ')+(tz?` (${tz})`:'');
}
const GCHAN=[['linkedin','LinkedIn'],['email','Email'],['sms','SMS'],['voice','Voice']];
const chanPaused=ch=>!!((S.gchan||{})[ch]&&S.gchan[ch].enabled===false);
function settingsPage(){
  const suppN=S.guard?S.guard.suppression_count:SUPPRESSION.length;
  return shell(`<h1 class="page-t" style="margin-bottom:18px">Settings</h1>
  <div class="grid g2"><div style="display:flex;flex-direction:column;gap:14px">
    <section class="card"><div class="card-h"><h3>Global pause (kill switch)</h3></div><div class="card-b">
      <p class="mute" style="font-size:12.5px;margin-bottom:12px">Stops every autonomous external action across the entire platform. Existing data is kept.</p>
      <button class="btn ${S.killed?'':'danger'}" data-act="kill">${S.killed?'Resume all campaigns':'Pause everything now'}</button></div></section>
    <section class="card"><div class="card-h"><h3>Autonomous mode</h3><span class="pill ${S.auto?'live':''}">${S.auto?'On':'Off'}</span></div><div class="card-b">
      <div class="row-sw" style="padding-top:0;border-bottom:0"><div style="max-width:540px"><b style="font-size:12.5px">Run each prospect's next step automatically</b>
        <p class="mute" style="font-size:12px;margin-top:4px">When on, the system decides and runs each prospect's next step on its own instead of waiting for a manual trigger.</p></div>
        <button class="sw" role="switch" aria-checked="${S.auto}" aria-label="Autonomous mode" data-act="auto-toggle" ${S.autoMissing?'disabled':''}></button></div>
      ${S.autoMissing?`<p style="font-size:12px;color:var(--amber);margin-top:8px">Needs a one-time database update before it can be used: run db/schema.sql in the Supabase SQL editor (it is safe to re-run).</p>`:''}
    </div></section>
    <section class="card"><div class="card-h"><h3>Channel pause</h3></div><div class="card-b">
      <p class="mute" style="font-size:12.5px;margin-bottom:6px">Pause one channel for every campaign at once. This sits on top of each campaign's own channel switches: a send goes out only if both allow it. On = running, off = paused.</p>
      ${S.gchanMissing?`<p style="font-size:12px;color:var(--amber);margin:8px 0">Needs a one-time database update before it can be used: run db/schema.sql in the Supabase SQL editor (it is safe to re-run).</p>`:''}
      ${GCHAN.map(([ch,label])=>`<div class="row-sw"><div style="display:flex;align-items:center;gap:9px">${chIcon(ch)}<b style="font-size:12.5px">${label}</b>${chanPaused(ch)?'<span class="pill paused">Paused for all campaigns</span>':''}</div><button class="sw" role="switch" aria-checked="${!chanPaused(ch)}" aria-label="${label} ${chanPaused(ch)?'paused':'running'}" data-gchan="${ch}" ${S.gchanMissing?'disabled':''}></button></div>`).join('')}
    </div></section>
    <section class="card"><div class="card-h"><h3>Reps</h3></div>
      ${REPS.length?`<div class="scroll"><table class="tbl"><thead><tr><th>Rep</th><th>Campaigns</th><th>Hours</th><th></th></tr></thead><tbody>
      ${REPS.map(r=>{const camps=S.campReps.filter(x=>x.rep_id===r.id).map(x=>camp(x.campaign_id)?.name).filter(Boolean);
        return `<tr><td><div style="display:flex;gap:10px;align-items:center"><span class="avatar" style="background:${avatarColor(r.name)}">${initials(r.name)}</span><div><b style="font-size:12.5px">${esc(r.name)}</b><div class="mute" style="font-size:11px">${esc(r.identity_for_outreach||r.email)}</div></div></div></td>
        <td class="mute">${esc(camps.join(', ')||'No campaigns')}</td><td class="${r.working_hours&&Object.keys(r.working_hours).length?'':'mute'}">${esc(fmtHours(r.working_hours))}</td>
        <td style="text-align:right">${r.active?`<button class="btn sm" data-act="rep-offboard" data-id="${r.id}">Offboard</button>`:`<button class="btn sm" data-act="rep-toggle" data-id="${r.id}" data-active="0">Reactivate</button>`}</td></tr>`}).join('')}
      </tbody></table></div>`:'<div class="card-b"><div class="empty" style="padding:14px 0">No reps yet.</div></div>'}
    </section>
  </div><div style="display:flex;flex-direction:column;gap:14px">
    <section class="card"><div class="card-h"><h3>Global suppression list</h3></div><div class="card-b">
      ${SUPPRESSION.map(s=>`<div class="row-sw"><div><b style="font-size:12.5px">${esc(s.value)}</b><div class="mute" style="font-size:11px">${esc(s.reason||'No reason recorded')}</div></div><span class="pill">${esc(s.scope[0].toUpperCase()+s.scope.slice(1))}</span></div>`).join('')||'<div class="empty" style="padding:14px 0">Nothing suppressed yet.</div>'}
      <div class="field" style="margin-top:14px"><label>Add to suppression list</label><input id="supp" placeholder="email or domain"></div>
      <button class="btn primary sm" data-act="supp-add">Add</button></div></section>
    <section class="card"><div class="card-h"><h3>Global guardrails</h3></div><div class="card-b">
      <div class="row-sw"><div><b style="font-size:12.5px">Suppression list</b><div class="mute" style="font-size:11px">${suppN} address${suppN===1?'':'es'}, checked before every send</div></div><span class="serif" style="font-size:20px;font-weight:600">${suppN}</span></div>
      <div class="row-sw"><div><b style="font-size:12.5px">Max touches per prospect</b><div class="mute" style="font-size:11px">${S.guard?`Successful dispatches to one prospect in one campaign, per rolling ${S.guard.window_days} days. Set in code (orchestrator/conflict.js), so read-only here.`:'Loading…'}</div></div><span class="serif" style="font-size:20px;font-weight:600">${S.guard?S.guard.max_touches_per_prospect:'…'}</span></div>
    </div></section>
  </div></div>`);
}
function helpPage(){return shell(`<h1 class="page-t" style="margin-bottom:14px">Help &amp; support</h1><section class="card card-b mute">Reach the team in the DronaHQ Discord, or check the docs linked from Integrations.</section>`)}
// Everything here comes from the signed-in session (GET /auth/me): the profile of whoever is actually logged in.
function accountPage(){
  const u=S.user;
  return shell(`<h1 class="page-t" style="margin-bottom:14px">Account</h1>
  <section class="card card-b" style="max-width:560px">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px"><span class="avatar" style="background:${avatarColor(u.display_name)};width:44px;height:44px;font-size:15px">${initials(u.display_name)}</span><div><b style="font-size:15px">${esc(u.display_name)}</b><div class="mute" style="font-size:12px">${esc(u.role)}</div></div></div>
    <div class="kv"><dt>Signed in as</dt><dd>${esc(u.display_name)}</dd><dt>Email</dt><dd>${esc(u.email)}</dd><dt>Role</dt><dd>${esc(u.role)}</dd><dt>Team member since</dt><dd>${fmtDate(u.member_since)}</dd></div>
    <div style="margin-top:20px"><button class="btn" data-act="logout">${ic('logout',14)} Sign out</button></div>
  </section>`);
}

/* ================= MODAL / DRAWER ================= */
function modal(){
  const m=S.modal; if(!m) return '';
  if(m.t==='kill') return `<div class="overlay"><div class="modal"><h2>${S.killed?'Resume all campaigns?':'Stop all autonomous actions?'}</h2>
    <p class="mute" style="font-size:13px">${S.killed?'Every live campaign resumes where it left off.':'This stops every campaign from contacting anyone. Data and conversations are kept, and you can resume at any time.'}</p>
    <div class="stoplist"><div><span>Live campaigns</span><span>${CAMPAIGNS.filter(c=>c.status==='live').length} affected</span></div><div><span>Agents in progress</span><span>Finish current step, then stop</span></div></div>
    <div class="modal-f"><button class="btn" data-act="close-modal">Cancel</button><button class="btn danger" data-act="kill-confirm">${S.killed?'Resume everything':'Stop everything'}</button></div></div></div>`;
  if(m.t==='pause') return `<div class="overlay"><div class="modal"><h2>Pause ${esc(camp(m.id)?.name)}?</h2><p class="mute" style="font-size:13px">Autonomous execution stops immediately. Other campaigns are unaffected. Prospect data is kept.</p>
    <div class="modal-f"><button class="btn" data-act="close-modal">Cancel</button><button class="btn danger" data-act="pause-confirm" data-id="${m.id}">Pause campaign</button></div></div></div>`;
  if(m.t==='dq') return `<div class="overlay"><div class="modal"><h2>Discover &amp; qualify?</h2>
    <p style="font-size:13px;margin-bottom:10px"><b>This will call the real DronaHQ agents and spend credits.</b></p>
    <p class="mute" style="font-size:13px">It finds new prospects for <b>${esc(camp(m.id)?.name||'this campaign')}</b>, then runs the Research agent and the ICP agent on each one, so up to 5 prospects means up to 10 agent runs. It never contacts anyone. Use <b>Discover prospects</b> instead if you only want to add prospects without spending credits.</p>
    <div class="modal-f"><button class="btn" data-act="close-modal">Cancel</button><button class="btn warn" data-act="dq-confirm" data-id="${m.id}">Yes, spend credits</button></div></div></div>`;
  if(m.t==='qd'){
    const names=l=>l.map(s=>s.label).join(', ');
    const sure=m.plan.steps.filter(s=>!s.conditional),maybe=m.plan.steps.filter(s=>s.conditional);
    const already=m.plan.done.map(k=>({research:'Research',icp:'ICP scoring',strategy:'Strategy',personalisation:'Personalisation'}[k])).join(', ');
    return `<div class="overlay"><div class="modal"><h2>Qualify &amp; draft outreach?</h2>
    <p style="font-size:13px;margin-bottom:10px"><b>This will call real DronaHQ agents and spend credits.</b></p>
    <p style="font-size:13px;margin-bottom:8px">This will run: <b>${esc(sure.length?names(sure):'nothing yet')}</b>${maybe.length?`. If the prospect qualifies, it will also run: <b>${esc(names(maybe))}</b>`:''}.</p>
    ${already?`<p class="mute" style="font-size:13px;margin-bottom:8px">Already done, so not run again: ${esc(already)}.</p>`:''}
    <p class="mute" style="font-size:13px">If ICP scoring rejects the prospect, it stops there. It prepares an email draft; it never sends anything.</p>
    <div class="modal-f"><button class="btn" data-act="close-modal">Cancel</button><button class="btn warn" data-act="qd-confirm" data-id="${m.id}">Yes, spend credits</button></div></div></div>`;
  }
  if(m.t==='qdres'){
    const r=m.out,label={research:'Research',icp:'ICP scoring',strategy:'Strategy',personalisation:'Personalisation'};
    const list=a=>(a||[]).map(k=>label[k]||k).join(', ');
    return `<div class="overlay"><div class="modal"><h2>${esc(r.head)}</h2>
    <p class="mute" style="font-size:13px">${esc(r.text)}</p>
    <div class="stoplist">
      <div><span>Ran</span><span>${esc(list(r.steps_run)||'nothing')}</span></div>
      ${r.steps_skipped&&r.steps_skipped.length?`<div><span>Already done, not run again</span><span class="mute">${esc(list(r.steps_skipped))}</span></div>`:''}
      ${r.email?`<div><span>Email subject</span><span>${esc(r.email.subject)}</span></div>`:''}
    </div>
    <div class="modal-f"><button class="btn primary" data-act="close-modal">Close</button></div></div></div>`;
  }
  if(m.t==='del'){
    const c=camp(m.id); if(!c) return '';
    const ok=m.typed===m.name;
    return `<div class="overlay"><div class="modal"><h2>Delete ${esc(m.name)}?</h2>
    <p style="font-size:13px;margin-bottom:10px"><b>This is permanent and cannot be undone.</b></p>
    <p class="mute" style="font-size:13px;margin-bottom:12px">This deletes the campaign and everything that belongs to it: its ${c.pros} prospect link${c.pros===1?'':'s'}, its activity log, prompt versions, rep assignments, approvals and meetings.${c.status==='live'?' The campaign is live, so it stops immediately.':''} The prospects themselves are not deleted.</p>
    <div class="field"><label>Type <b>${esc(m.name)}</b> to confirm</label><input id="dn" autocomplete="off" spellcheck="false" value="${esc(m.typed||'')}"></div>
    <div class="modal-f"><button class="btn" data-act="close-modal">Cancel</button><button class="btn danger" data-act="del-confirm" data-id="${m.id}" ${ok?'':'disabled'}>Delete this campaign</button></div></div></div>`;
  }
  if(m.t==='dqres'){const r=m.res,sm=r.summary;
    return `<div class="overlay"><div class="modal"><h2>Discover &amp; qualify: done</h2>
    <p class="mute" style="font-size:13px">${sm.discovered} new prospect${sm.discovered===1?'':'s'}: ${sm.qualified} qualified, ${sm.rejected} rejected${sm.failed?`, ${sm.failed} failed`:''}${sm.blocked?`, ${sm.blocked} blocked`:''}${sm.skipped?`, ${sm.skipped} skipped`:''}.${sm.stopped_reason?` Stopped: ${esc(String(sm.stopped_reason).replace(/_/g,' '))}.`:''}</p>
    ${r.results.length?`<div class="stoplist">${r.results.map(x=>`<div><span>${esc(x.name)} <span class="mute">· ${esc(x.company||'')}</span></span><span class="${x.status==='failed'||x.status==='blocked'?'':'mute'}">${esc(x.status)}${x.icp_score!=null?` (${x.icp_score})`:''}${x.error?`: ${esc(String(x.error).slice(0,60))}`:x.reason?`: ${esc(String(x.reason).replace(/_/g,' '))}`:''}</span></div>`).join('')}</div>`:''}
    <div class="modal-f"><button class="btn primary" data-act="close-modal">Close</button></div></div></div>`;}
  if(m.t==='auto-on') return `<div class="overlay"><div class="modal"><h2>Turn on autonomous mode?</h2>
    <p class="mute" style="font-size:13px">The system will decide and run each prospect's next step on its own, including real DronaHQ agent runs that spend credits and email dispatches (redirected to the test inbox). Nothing runs until something calls <b>POST /run-cycle</b>; this only allows it. You can turn it off again at any time.</p>
    <div class="modal-f"><button class="btn" data-act="close-modal">Cancel</button><button class="btn warn" data-act="auto-confirm">Turn on</button></div></div></div>`;
  if(m.t==='offboard'){
    const im=m.impact,n=im.campaigns.length,orphan=im.campaigns.filter(c=>c.left_without_rep).length;
    return `<div class="overlay"><div class="modal"><h2>Offboard ${esc(im.rep.name)}?</h2>
    <p class="mute" style="font-size:13px">${n?`Linked to ${n} campaign${n===1?'':'s'}:`:'Not linked to any campaign.'}${im.assigned_prospect_count?` ${im.assigned_prospect_count} prospect${im.assigned_prospect_count===1?' is':'s are'} assigned to them.`:''}</p>
    ${n?`<div class="stoplist">${im.campaigns.map(c=>`<div><span>${esc(c.name)} <span class="mute">· ${esc(c.status)}</span></span>${c.left_without_rep?'<span class="tag amber">No other active rep</span>':'<span class="mute">Other reps remain</span>'}</div>`).join('')}</div>`:''}
    <div class="field"><label>Assign a replacement rep</label><select id="repl"><option value="">No replacement</option>${im.replacement_candidates.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
    <p class="mute" style="font-size:11.5px">${im.replacement_candidates.length
      ?'With a replacement, these campaigns and the prospects assigned to them move to that rep. Without one, the campaign links stay, and a campaign with no other active rep sends without a sender identity.'
      :'There is no other active rep to hand over to. Add one first if these campaigns need a sender.'}</p>
    <div class="modal-f"><button class="btn" data-act="close-modal">Cancel</button><button class="btn danger" data-act="offboard-confirm" data-id="${im.rep.id}">Offboard</button></div></div></div>`;
  }
  if(m.t==='prompt') return `<div class="overlay"><div class="modal"><h2>Save new prompt version</h2><p class="mute" style="font-size:13px;margin-bottom:14px">Saved as the next version for this campaign and agent. It doesn't take effect until you activate it.</p>
    <div class="field"><label>Guidance</label><textarea id="pc" style="min-height:140px" placeholder="Campaign-specific guidance appended to the agent's instructions"></textarea></div>
    <div class="field"><label>Your name</label><input id="pb" placeholder="Who is making this change?"></div>
    <div class="modal-f"><button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="prompt-confirm">Save version</button></div></div></div>`;
  if(m.t==='new') return `<div class="overlay"><div class="modal"><h2>Create campaign</h2><p class="mute" style="font-size:13px;margin-bottom:14px">Starts as a draft. Nothing sends until you launch it.</p>
    <div class="field"><label>Name</label><input id="nn" placeholder="e.g. EU fintech CFOs"></div>
    <div class="field"><label>Ideal customer</label><input id="ni" placeholder="Who are you trying to reach?"></div>
    <div class="modal-f"><button class="btn" data-act="close-modal">Cancel</button><button class="btn primary" data-act="new-confirm">Create draft</button></div></div></div>`;
  return '';
}
function drawer(){
  if(!S.drawer) return '';
  const a=agent(S.drawer.id);
  const runs=CAMPAIGNS.flatMap(c=>(S.acts[c.id]||[]).filter(x=>x.agent_type===S.drawer.id)).sort((x,y)=>new Date(y.created_at)-new Date(x.created_at)).slice(0,10);
  return `<aside class="drawer"><div class="drawer-h"><b>${a?.name} — recent runs</b><button class="icon-btn" data-act="close-drawer">${ic('x',16)}</button></div>
  <div class="drawer-b"><div class="sec"><h4>Recent runs</h4>${runs.map(r=>`<div style="padding:8px 0;border-bottom:1px solid var(--line2)"><div style="font-size:12.5px;font-weight:600">${esc(actTitle(r))}</div><div class="mute" style="font-size:11px">${esc(camp(r.campaign_id)?.name||'')} · ${ago(r.created_at)}${r.prospect?' · '+esc(r.prospect.name):''}</div></div>`).join('')||'<p class="mute" style="font-size:12.5px">No runs recorded yet.</p>'}</div></div></aside>`;
}

/* ================= RENDER ================= */
function body(){
  switch(S.page){
    case 'overview': return overview();
    case 'campaigns': return S.campId?campDetail():campaignsPage();
    case 'prospects': return S.pid?prospectDetail():prospectsPage();
    case 'conversations': return conversationsPage();
    case 'agents': return agentsPage();
    case 'tasks': return tasksPage();
    case 'analytics': return analyticsPage();
    case 'integrations': return integrationsPage();
    case 'knowledge': return knowledgePage();
    case 'settings': return settingsPage();
    case 'help': return helpPage();
    case 'account': return accountPage();
  }
}
function render(){
  // Keep whatever the user has typed (and focus) across a re-render.
  const typed={};document.querySelectorAll('#root input[id],#root textarea[id],#root select[id]').forEach(el=>{typed[el.id]=el.value});
  const focusId=document.activeElement&&document.activeElement.id;
  const y=window.scrollY;
  // The app itself (sidebar, pages, data) only ever renders for a signed-in user; everyone else gets the login page or a plain screen.
  // If drawing throws, the old page would stay on screen with live-looking buttons that do nothing (and the caller, e.g. go(), would
  // abort). So: rebuild the derived numbers and retry once, and if that fails too, say so on screen with a Reload button.
  const draw=()=>!S.authChecked?plainScreen('<div class="empty">Loading…</div>')
    :S.user?(S.ready?body():bootScreen())
    :S.loadError?plainScreen(`<div class="empty"><p style="margin-bottom:12px">Couldn't reach the backend.</p><p class="mute" style="margin-bottom:16px">${esc(S.loadError)}</p><button class="btn primary" data-act="retry">Retry</button></div>`)
    :loginPage();
  let html;
  try{html=draw()}catch(e){
    console.error('render failed; rebuilding and retrying',e);
    try{rebuildAll();html=draw()}catch(e2){
      console.error('render failed again',e2);
      html=plainScreen('<div class="empty"><p style="margin-bottom:12px">Something went wrong drawing this page.</p><p class="mute" style="margin-bottom:16px">'+esc(e2.message)+'</p><button class="btn primary" data-act="retry">Reload data</button></div>');
    }
  }
  document.getElementById('root').innerHTML=html;
  for(const [id,v] of Object.entries(typed)){const el=document.getElementById(id);if(el)el.value=v}
  if(focusId)document.getElementById(focusId)?.focus();
  else if(S.authChecked&&!S.user&&!S.loadError)(document.getElementById('login-email')?.value?document.getElementById('login-password'):document.getElementById('login-email'))?.focus();
  window.scrollTo(0,y);
}
function go(p){S.page=p;S.campId=null;S.pid=null;render();refreshFor(p)}

/* ================= EVENTS ================= */
// Runs an async action once at a time; any failure is shown as a toast with the backend's message.
async function act(fn){
  if(S.busy)return;S.busy=true;
  // After a failure, redraw: an action may already have changed state (e.g. closed its dialog) before it threw, and the screen must match.
  try{await fn()}catch(e){toast(e.message||'Something went wrong');render()}finally{S.busy=false}
}
// Plain-language result of Qualify & draft, from the 200 body or from the error a stop/failure carries (err.body has the partial progress).
const QD_WHY={kill_switch_on:'The global kill switch is on.',campaign_not_live:'The campaign is not live.',agent_paused:'An agent needed for the next step is paused for this campaign.',
  suppressed:"This prospect's email is on the suppression list.",pending_approval:'A human approval is pending for this prospect (see Tasks), so it is on hold until someone decides.',
  approval_rejected:'A reviewer rejected outreach to this prospect.',active_in_other_campaign:'This prospect is active in another live campaign.'};
function qdOutcome(res,err){
  const b=res||(err&&err.body)||{},base={steps_run:b.steps_run||[],steps_skipped:b.steps_skipped||[],email:b.email||null};
  if(res){
    if(res.stopped==='rejected')return {...base,head:'Rejected by ICP',text:`Score ${res.icp?res.icp.score:'?'}. It stopped there, so no strategy was decided and no email was drafted.`};
    if(res.stopped==='not_qualified')return {...base,head:'Not qualified',text:'This prospect is not in a qualified state, so nothing was run.'};
    if(!res.steps_run.length)return {...base,head:'Nothing to run',text:'Everything already exists for this prospect.'};
    return {...base,head:'Outreach drafted',text:'The steps below were run and saved on the prospect. Nothing was sent.'};
  }
  const done=base.steps_run.length?' What finished before that is saved.':'';
  if(b.blocked)return {...base,head:'Stopped',text:(QD_WHY[b.reason]||`Blocked: ${b.reason}.`)+done};
  return {...base,head:'A step failed',text:`${b.failed_step?`The ${b.failed_step} step failed: `:''}${err?err.message:'Something went wrong'}.${done} Running it again only repeats the steps that are still missing.`};
}
async function setStatus(id,status,msg){setCampaign(await api('PATCH',`/campaigns/${id}/status`,{status}));toast(msg);render()}
document.addEventListener('click',e=>{
  if(e.target.closest('a[href]'))return; // real links (e.g. a prospect's LinkedIn) must not also trigger the row they sit in
  const t=e.target.closest('[data-nav],[data-act],[data-open-camp],[data-pause-camp],[data-resume-camp],[data-launch],[data-filter],[data-ctab],[data-ctabv],[data-pro],[data-cagent],[data-cchan],[data-gchan],[data-pview],[data-task],[data-psel]');
  if(!t||t.disabled) return; const d=t.dataset;
  if(d.gchan)return act(async()=>{
    // { channel: false } pauses it, { channel: true } resumes it; the backend merges, so other channels are untouched.
    const wasPaused=chanPaused(d.gchan);
    S.gchan=(await api('PATCH','/global-settings/channels',{[d.gchan]:wasPaused})).channels;
    toast(`${chName(d.gchan)} ${wasPaused?'resumed':'paused'} for all campaigns`);render();
  });
  if(d.nav) return go(d.nav);
  if(d.openCamp){S.page='campaigns';S.campId=d.openCamp;S.campTab='Overview';render();return refreshCamp(d.openCamp,'Overview')}
  if(d.pauseCamp){S.modal={t:'pause',id:d.pauseCamp};return render()}
  if(d.resumeCamp)return act(()=>setStatus(d.resumeCamp,'live',camp(d.resumeCamp).name+' resumed'));
  if(d.launch)return act(()=>setStatus(d.launch,'live',camp(d.launch).name+' launched'));
  if(d.filter){S.campFilter=d.filter;return render()}
  if(d.ctab){S.campTab=d.ctab;if(d.ctab==='Prompts')S.promptView=null;render();return refreshCamp(S.campId,d.ctab)}
  if(d.ctabv){S.convTab=d.ctabv;return render()}
  if(d.pro){S.page='prospects';S.pid=d.pro;return render()}
  if(d.cagent)return act(async()=>{
    const c=camp(d.camp),wasPaused=c.enabled_agents?.[d.cagent]===false;
    // The backend merges enabled_agents, so only this agent changes.
    setCampaign(await api('PATCH',`/campaigns/${c.id}`,{enabled_agents:{[d.cagent]:wasPaused}}));
    toast(`${agent(d.cagent).name} ${wasPaused?'resumed':'paused'} for ${c.name}`);render();
  });
  if(d.cchan)return act(async()=>{
    const c=camp(d.camp),k=d.cchan,cc=c.channel_config||{},on=!cc[k]?.enabled;
    setCampaign(await api('PATCH',`/campaigns/${c.id}`,{channel_config:{...cc,[k]:{...(cc[k]||{}),enabled:on}}}));
    toast(chName(k)+(on?' enabled':' disabled')+' for '+c.name);render();
  });
  if(d.pview){S.promptView=+d.pview;return render()}
  if(d.psel){/* select handled on change */}
  if(d.task)return act(async()=>{
    const tk=TASKS.find(x=>x.id===d.task);if(!tk)return;
    await api('PATCH',`/approvals/${tk.id}`,{status:d.do==='Approve'?'approved':'rejected',resolved_by:'dashboard'});
    TASKS=TASKS.filter(x=>x.id!==tk.id);rebuildAll();
    toast(`${d.do==='Approve'?'Approved':'Rejected'}: ${tk.who}`);render();
  });
  const a=d.act;
  if(a==='theme'){const cur=document.documentElement.dataset.theme||'dark';const next=cur==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('sdr-theme',next)}catch(_){}return render()}
  if(a==='retry')return boot();
  if(a==='logout')return act(async()=>{
    try{await api('POST','/auth/logout')}catch(_){}
    try{sessionStorage.setItem('sdr-notice','You have been signed out.')}catch(_){}
    S.user=null;location.reload(); // a fresh page: nothing from this session is left in memory
  });
  if(a==='discover')return act(async()=>{
    S.working={id:d.id,kind:'discover'};render();
    try{
      const r=await api('POST',`/campaigns/${d.id}/discover`,{});
      await loadCampData(d.id);rebuildAll();
      const n=r.created.length,sk=r.skipped.length;
      toast(n?`Discovered ${n} new prospect${n===1?'':'s'}${sk?` (${sk} skipped as duplicates)`:''}`:(r.found?'Nothing new: everyone found was already here':'No suitable prospects found this time'));
    }finally{S.working=null;render()}
  });
  if(a==='dq-open'){S.modal={t:'dq',id:d.id};return render()}
  // Qualify & draft can take minutes (up to four agent calls), so it does not hold act()'s shared lock: the kill switch stays usable
  // while it runs, and the backend re-checks the gates before every step. S.working alone stops a second click.
  if(a==='qd-open'){
    if(S.working)return;
    return (async()=>{
      try{
        const plan=await api('GET',`/campaign-prospects/${d.id}/qualify-and-draft`); // what THIS prospect still needs, from the backend
        if(!plan.steps.length)return toast(plan.stopped==='rejected'?'Already rejected by ICP: nothing to run':plan.stopped?'Nothing to run for this prospect':'Everything is already done for this prospect');
        S.modal={t:'qd',id:d.id,plan};render();
      }catch(e){toast(e.message)}
    })();
  }
  if(a==='qd-confirm'){
    if(S.working)return;
    const cpId=d.id,p=pro(cpId);
    S.modal=null;S.working={id:cpId,kind:'qd'};render();
    return (async()=>{
      let res=null,err=null;
      try{res=await api('POST',`/campaign-prospects/${cpId}/qualify-and-draft`,{})}catch(e){err=e}
      // Whatever finished before a stop or failure is already saved, so reload either way.
      try{if(p)await Promise.all([loadCampData(p.camp),loadApprovals(),loadSpend()]);rebuildAll()}catch(_){}
      S.working=null;S.modal={t:'qdres',out:qdOutcome(res,err)};render();
    })();
  }
  if(a==='del-open'){const c=camp(d.id);if(!c)return;S.modal={t:'del',id:c.id,name:c.name,typed:''};return render()}
  if(a==='del-confirm')return act(async()=>{
    const c=camp(d.id);
    if(!c||!S.modal||S.modal.t!=='del'||S.modal.typed!==c.name)return; // the backend checks the name again; this only stops a stray click
    const r=await api('DELETE',`/campaigns/${c.id}`,{confirm_name:S.modal.typed});
    CAMPAIGNS=CAMPAIGNS.filter(x=>x.id!==c.id);delete S.cps[c.id];delete S.acts[c.id];delete S.costs[c.id];
    S.modal=null;S.campId=null;S.page='campaigns';
    try{await loadApprovals()}catch(_){}
    rebuildAll();toast(`Deleted ${r.campaign.name}`);render();
  });
  if(a==='dq-confirm')return act(async()=>{
    S.modal=null;S.working={id:d.id,kind:'dq'};render();
    try{
      // The only place discover-and-qualify is ever called: an explicit click, after the confirmation dialog.
      const r=await api('POST',`/campaigns/${d.id}/discover-and-qualify`,{confirm_spend:true});
      await Promise.all([loadCampData(d.id),loadApprovals(),loadSpend()]);rebuildAll();
      S.working=null;S.modal={t:'dqres',res:r};render();
    }finally{if(S.working){S.working=null;render()}}
  });
  if(a==='auto-toggle'){
    if(S.autoMissing)return;
    if(!S.auto){S.modal={t:'auto-on'};return render()}   // turning ON always asks first
    return act(async()=>{S.auto=!!(await api('PATCH','/global-settings/autonomous-mode',{autonomous_mode:false})).autonomous_mode;toast('Autonomous mode is off');render()});
  }
  if(a==='auto-confirm')return act(async()=>{
    S.modal=null;
    S.auto=!!(await api('PATCH','/global-settings/autonomous-mode',{autonomous_mode:true,confirm:true})).autonomous_mode;
    toast('Autonomous mode is on');render();
  });
  if(a==='collapse'){S.collapsed=!S.collapsed;try{localStorage.setItem('sdr-collapsed',S.collapsed?'1':'0')}catch(_){}return render()}
  if(a==='kill'){S.modal={t:'kill'};return render()}
  if(a==='kill-confirm')return act(async()=>{
    const r=await api('PATCH','/global-settings/kill-switch',{kill_switch_on:!S.killed});
    S.killed=!!r.kill_switch_on;S.modal=null;rebuildAll();toast(S.killed?'Kill switch activated':'System resumed');render();
  });
  if(a==='pause-confirm')return act(async()=>{S.modal=null;await setStatus(d.id,'paused',camp(d.id).name+' paused')});
  if(a==='close-modal'){S.modal=null;return render()}
  if(a==='close-drawer'){S.drawer=null;return render()}
  if(a==='new-camp'){S.modal={t:'new'};return render()}
  if(a==='new-confirm')return act(async()=>{
    const name=document.getElementById('nn').value.trim();
    if(!name)return toast('Give the campaign a name');
    const description=document.getElementById('ni').value.trim();
    setCampaign(await api('POST','/campaigns',{name,description:description||undefined,status:'draft'}));
    S.modal=null;toast('Draft created');render();
  });
  if(a==='dup')return act(async()=>{
    const c=camp(d.id);
    setCampaign(await api('POST','/campaigns',{name:c.name+' (copy)',description:c.description||undefined,owner:c.owner||undefined,status:'draft',
      icp_json:c.icp_json,channel_config:c.channel_config,daily_limits:c.daily_limits,sample_profiles:c.sample_profiles}));
    toast('Duplicated as a draft: '+c.name+' (copy)');render();
  });
  if(a==='back-camps'){S.campId=null;return render()}
  if(a==='back-pros'){S.pid=null;return render()}
  if(a==='agent-logs'){S.drawer={id:d.id};return render()}
  if(a==='new-prompt-version'){S.modal={t:'prompt'};return render()}
  if(a==='prompt-confirm')return act(async()=>{
    const content=document.getElementById('pc').value.trim(),changed_by=document.getElementById('pb').value.trim();
    if(!content||!changed_by)return toast('Guidance and your name are both required');
    const v=await api('POST',`/campaigns/${S.campId}/prompt-versions`,{agent_type:S.promptSel,content,changed_by});
    await loadPrompts(S.campId,S.promptSel);
    S.modal=null;S.promptView=v.version;toast(`Saved version ${v.version}. Activate it to use it.`);render();
  });
  if(a==='activate-prompt')return act(async()=>{
    const v=await api('PATCH',`/campaigns/${S.campId}/prompt-versions/${d.id}/activate`);
    await loadPrompts(S.campId,S.promptSel);
    S.promptView=v.version;toast(`Version ${v.version} is now active`);render();
  });
  if(a==='rep-toggle')return act(async()=>{ // reactivate
    const r=await api('PATCH',`/reps/${d.id}`,{active:true});
    await loadReps();toast(`${r.name} reactivated`);render();
  });
  if(a==='rep-offboard')return act(async()=>{ // show what it would affect first
    S.modal={t:'offboard',impact:await api('GET',`/reps/${d.id}/impact`)};render();
  });
  if(a==='offboard-confirm')return act(async()=>{
    const repl=document.getElementById('repl').value;
    const r=await api('POST',`/reps/${d.id}/offboard`,repl?{replacement_rep_id:repl}:{});
    S.modal=null;
    await Promise.all([loadReps(),loadCampReps(),...CAMPAIGNS.map(c=>loadCampData(c.id))]);rebuildAll();
    const n=r.affected_campaigns.length,orph=r.affected_campaigns.filter(c=>c.left_without_rep).length;
    toast(r.replacement?`${r.rep.name} offboarded. ${n} campaign${n===1?'':'s'} and ${r.prospects_reassigned} prospect${r.prospects_reassigned===1?'':'s'} moved to ${r.replacement.name}`
      :`${r.rep.name} offboarded${orph?`. ${orph} campaign${orph===1?'':'s'} left with no active rep`:''}`);
    render();
  });
  if(a==='supp-add')return act(async()=>{
    const el=document.getElementById('supp'),value=el.value.trim();
    if(!value)return toast('Enter an email or domain');
    await api('POST','/suppression-list',{value,reason:'Added from dashboard',scope:'global'});
    await loadSuppression();el.value='';toast(`${value.toLowerCase()} added to the suppression list`);render();
  });
});
document.addEventListener('submit',e=>{
  if(e.target.id==='login-form'){e.preventDefault();doLogin()}
});
// Delete dialog: the confirm button unlocks only when the typed text equals the campaign name exactly. Updated in place (no re-render,
// so focus and caret stay put); the typed text lives in S.modal so a redraw keeps the button in step with the box.
document.addEventListener('input',e=>{
  if(e.target.id!=='dn'||!S.modal||S.modal.t!=='del')return;
  S.modal.typed=e.target.value;
  const b=document.querySelector('[data-act="del-confirm"]');if(b)b.disabled=S.modal.typed!==S.modal.name;
});
document.addEventListener('change',e=>{
  if(e.target.dataset.act==='psel'){S.promptSel=e.target.value;S.promptView=null;render();refreshCamp(S.campId,'Prompts')}
});
// Sidebar health and spend refresh every 30s, redrawing only if they changed.
setInterval(async()=>{
  if(document.hidden||!S.ready||S.busy)return;
  const before=JSON.stringify([S.health,S.spend]);
  await Promise.all([loadHealth(),loadSpend()]);
  if(JSON.stringify([S.health,S.spend])!==before)render();
},30000);
// Live feed: quietly re-poll the overview, the Prospects page and the open campaign every 15s and redraw only if something changed.
const sig=()=>S.killed+'|'+TASKS.length+'|'+Object.values(S.acts).map(a=>a[0]?.id).join()+'|'+Object.values(S.cps).map(a=>a.map(c=>c.updated_at).join()).join();
setInterval(async()=>{
  if(document.hidden||!S.ready||S.busy)return;
  const onCamp=S.page==='campaigns'&&S.campId&&['Overview','Prospects','Activity'].includes(S.campTab);
  const wholeList=S.page==='overview'||S.page==='prospects'; // both show every campaign's prospects
  if(!wholeList&&!onCamp)return;
  const before=sig(),page=S.page;
  try{
    if(wholeList)await Promise.all([loadKill(),loadApprovals(),...CAMPAIGNS.map(c=>loadCampData(c.id))]);
    else await Promise.all([loadKill(),loadCampData(S.campId)]);
    if(S.page!==page||sig()===before)return;
    rebuildAll();render();
  }catch(_){/* transient; the next tick retries */}
},15000);
try{document.documentElement.dataset.theme=localStorage.getItem('sdr-theme')||'dark'}catch(_){document.documentElement.dataset.theme='dark'}
boot();
