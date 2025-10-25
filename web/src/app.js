async function loadJSON(p){const r=await fetch(p);return r.json();}
const state={rooms:[],blocks:[],seasons:[],policy:null, member:null, otpOk:false};

function between(d, a,b){return d>=a && d<=b;}
function fmtISO(d){return new Date(d).toISOString().slice(0,10)}
function dayClass(dateISO){
  const d=new Date(dateISO); const dow=d.getUTCDay(); // 0 Sun .. 6 Sat
  let cls="";
  if(dow===5||dow===6) cls="weekend"; // Fri/Sat light yellow
  for(const s of state.seasons){
    if(between(d, new Date(s.from), new Date(s.to))){
      if(s.tag==='special') cls='special'; else cls='season';
    }
  }
  return cls;
}
function countAvailable(filters){
  let list = state.rooms.slice();
  if(filters.wc) list = list.filter(r=>r.wheelchair);
  if(filters.pet) list = list.filter(r=>r.pet);
  if(filters.ac) list = list.filter(r=>r.ac);
  if(filters.single) list = list.filter(r=>r.type==='single');
  if(filters.quad) list = list.filter(r=>r.type==='quad');
  const byBlock={};
  for(const r of list){ byBlock[r.block]=(byBlock[r.block]||0)+1; }
  return byBlock;
}

function renderCalendar(){
  const cal=document.getElementById('calendar'); cal.innerHTML='';
  const start=new Date(Date.UTC(2025,9,1)); // Oct 2025
  const end=new Date(Date.UTC(2026,2,31)); // Mar 2026
  let cur=new Date(start);
  let month=-1, wrap;
  while(cur<=end){
    if(cur.getUTCMonth()!=month){
      month = cur.getUTCMonth();
      wrap = document.createElement('div'); wrap.className='month';
      const h=document.createElement('h3');
      h.textContent=cur.toLocaleString('en-IN',{month:'long',year:'numeric', timeZone:'UTC'});
      wrap.appendChild(h);
      const grid=document.createElement('div'); grid.className='grid';
      wrap.appendChild(grid);
      cal.appendChild(wrap);
    }
    const grid=wrap.querySelector('.grid');
    const cell=document.createElement('div'); cell.className='day '+dayClass(fmtISO(cur));
    const num=document.createElement('div'); num.textContent=cur.getUTCDate();
    const free=document.createElement('div'); free.className='free'; free.textContent='Free: —';
    cell.appendChild(num); cell.appendChild(free);
    grid.appendChild(cell);
    cur.setUTCDate(cur.getUTCDate()+1);
  }
}

function applyBanner(){ document.getElementById('banner').textContent = state.policy.messages.banner; }

function recompute(){
  const filters={
    wc: document.getElementById('f_wc').checked,
    pet: document.getElementById('f_pet').checked,
    ac: document.getElementById('f_ac').checked,
    single: document.getElementById('f_single').checked,
    quad: document.getElementById('f_quad').checked,
  };
  const counts = countAvailable(filters);
  const avail = document.getElementById('avail'); avail.innerHTML='<h4>Block-wise availability</h4>';
  state.blocks.forEach(b=>{
    const n = counts[b.code]||0;
    const span=document.createElement('span');
    span.className='block-chip'+(n? '':' disabled');
    span.textContent=`${b.code} (${n} room(s))`;
    avail.appendChild(span);
  });
  document.querySelectorAll('.day .free').forEach(el=>{ el.textContent = 'Free: '+(Object.values(counts).reduce((a,b)=>a+b,0) || '0'); });
  const totalOcc =
    (+document.getElementById('p_mem').value||0)+
    (+document.getElementById('p_sen').value||0)+
    (+document.getElementById('p_c10').value||0)+
    (+document.getElementById('p_c21').value||0)+
    (+document.getElementById('p_ta').value||0)+
    (+document.getElementById('p_tc').value||0);
  const inD=document.getElementById('inDate').value, outD=document.getElementById('outDate').value;
  const utc = (inD && outD)? `${new Date(inD).toISOString().slice(0,10)} → ${new Date(outD).toISOString().slice(0,10)}` : '';
  const s = document.getElementById('summary');
  s.innerHTML = `<div><strong>Dates:</strong> ${inD||''} to ${outD||''} <span style="font-size:12px;color:#666">UTC: ${utc}</span></div>
  <div><strong>Total occupants:</strong> ${totalOcc}</div>
  <div style="font-size:12px;color:#666">The Club will try to give the rooms and types you selected but may change the same as per availability at the time of booking.</div>`;
  document.getElementById('utcSpan').textContent = utc;
}

async function main(){
  [state.rooms, state.blocks, state.seasons, state.policy] = await Promise.all([
    loadJSON('./data/rooms.json'),
    loadJSON('./data/blocks.json'),
    loadJSON('./data/seasons.json'),
    loadJSON('./data/policy.json')
  ]);
  applyBanner(); renderCalendar();
  // OTP gate
  document.getElementById('sendOtp').onclick=()=>{
    const mem=document.getElementById('memNo').value.trim();
    if(!mem){document.getElementById('otpMsg').textContent='Enter membership #';return;}
    if(mem.endsWith('2')){ document.getElementById('otpMsg').textContent='We couldn’t send the OTP because your account shows outstanding dues. Please contact the office.'; return; }
    document.getElementById('otpMsg').textContent='OTP sent. (Demo: use 123456)'; document.getElementById('otpEnter').style.display='block';
  };
  document.getElementById('verifyOtp').onclick=()=>{
    if(document.getElementById('otpVal').value.trim()==='123456'){
      document.getElementById('otpGate').style.display='none';
      const mn=document.getElementById('memberName'); mn.style.display='block'; mn.textContent='Member: Demo User';
      document.getElementById('controls').style.display='block';
    } else { document.getElementById('otpMsg').textContent='Wrong OTP'; }
  };
  ['inDate','outDate','p_mem','p_sen','p_c10','p_c21','p_ta','p_tc','f_wc','f_pet','f_ac','f_single','f_quad']
    .forEach(id=>document.getElementById(id).addEventListener('input',recompute));
  recompute();
}
main();