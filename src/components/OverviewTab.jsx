import { useState } from 'react';
import { getCurWk, daysTo } from '../utils.js';
import Heatmap from './Heatmap.jsx';

// CSS variables used throughout

export default function OverviewTab({ plan, completions }) {
  const [hovWk, setHovWk] = useState(null);

  if (!plan) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',padding:32,textAlign:'center'}}>
      <div style={{fontSize:14,color:'var(--muted)',lineHeight:1.7}}>Load a plan to see the overview.</div>
    </div>
  );

  const curWk = getCurWk(plan);
  const totalS = plan.weeks.reduce((a,w)=>a+w.sessions.length,0);
  const doneS = Object.values(completions).filter(c=>c?.done).length;
  // Calculate hours from targets.hrs if set, otherwise sum session target minutes
  function calcWeekHrs(w) {
    if (w.targets?.hrs) return w.targets.hrs;
    const runTypes = ['easy','long','b2b','speed','vest','race'];
    let mins = 0;
    w.sessions.forEach(s => {
      if (!runTypes.includes(s.type)) return;
      const m = (s.target||'').match(/^~?(\d+)min/);
      if (m) mins += parseInt(m[1]);
    });
    return Math.round((mins / 60) * 10) / 10;
  }
  const totalHrs = plan.weeks.reduce((a,w)=>a+calcWeekHrs(w),0);
  const start = new Date(plan.meta.startDate);
  const races = plan.meta.races || [];

  // Build km data
  const wkData = plan.weeks.map((w,idx) => {
    // Calculate km from actual session minutes (mid-range pace estimate)
    let runMins = 0;
    const raceKm = w.sessions.filter(s=>s.type==='race').reduce((a,s)=>a+(s.km||0),0);
    w.sessions.forEach(s => {
      if (s.isGym || s.type === 'vest' || s.type === 'race') return;
      const m = (s.target||'').match(/^~?(\d+)min/);
      if (m) runMins += parseInt(m[1]);
    });
    const km = Math.round(runMins / 60 * 9.5) + raceKm;
    const ws = new Date(start.getTime()+idx*7*86400000);
    return {
      wk:w.week, km, hasRace:w.sessions.some(s=>s.type==='race'),
      hasAet:w.sessions.some(s=>s.name?.includes('AeT Retest')),
      phase:w.phase||'', hrs:calcWeekHrs(w), isCur:idx===curWk,
      date:ws.toLocaleDateString('en-AU',{day:'numeric',month:'short'}),
    };
  });

  const maxKm = Math.max(...wkData.map(d=>d.km),50);
  const n = wkData.length;

  // SVG chart dimensions
  const W = 800, H = 200;
  const PAD = {l:36,r:16,t:24,b:40};
  const CW = W-PAD.l-PAD.r, CH = H-PAD.t-PAD.b;
  const sx = i => PAD.l+(i/(n-1))*CW;
  const sy = km => PAD.t+CH-(km/(maxKm*1.08))*CH;

  const getPhColor = ph => {
    if(ph.includes('Phase 1'))return'rgba(59,130,246,0.12)';
    if(ph.includes('Phase 2'))return'rgba(139,92,246,0.13)';
    if(ph.includes('Phase 3')||ph.includes('SCC'))return'rgba(6,182,212,0.12)';
    if(ph.includes('Phase 4')||ph.includes('GPT'))return'rgba(245,158,11,0.11)';
    return'rgba(255,255,255,0.03)';
  };

  // Phase bands
  let bands='',curPh=null,phS=0;
  wkData.forEach((d,i)=>{
    const c=getPhColor(d.phase);
    if(c!==curPh){
      if(curPh!==null){
        const x1=phS===0?PAD.l:sx(phS)-CW/(2*(n-1));
        const x2=i<n?sx(i-1)+CW/(2*(n-1)):PAD.l+CW;
        if(x2>x1)bands+=`<rect x="${x1}" y="${PAD.t}" width="${x2-x1}" height="${CH}" fill="${curPh}" rx="2"/>`;
      }
      curPh=c;phS=i;
    }
    if(i===n-1){
      const x1=phS===0?PAD.l:sx(phS)-CW/(2*(n-1));
      const x2=PAD.l+CW;
      if(x2>x1)bands+=`<rect x="${x1}" y="${PAD.t}" width="${x2-x1}" height="${CH}" fill="${curPh}" rx="2"/>`;
    }
  });

  const linePts=wkData.map((d,i)=>`${sx(i)},${sy(d.km)}`).join(' ');
  const areaPts=`${PAD.l},${PAD.t+CH} ${linePts} ${PAD.l+CW},${PAD.t+CH}`;

  let grid='';
  [0,50,100,150].filter(k=>k<=maxKm*1.08).forEach(km=>{
    const gy=sy(km);
    grid+=`<line x1="${PAD.l}" y1="${gy}" x2="${PAD.l+CW}" y2="${gy}" stroke="var(--border)" stroke-width="1"/>`;
    grid+=`<text x="${PAD.l-4}" y="${gy+4}" text-anchor="end" font-family="Exo 2, sans-serif" font-size="9" fill="var(--muted)">${km}</text>`;
  });

  let xlabels='';
  wkData.forEach((d,i)=>{
    if(i%4===0||d.hasRace)xlabels+=`<text x="${sx(i)}" y="${PAD.t+CH+14}" text-anchor="middle" font-family="Exo 2, sans-serif" font-size="8.5" fill="rgba(244,244,242,${d.hasRace?'0.6':'0.25'})">${d.date}</text>`;
    xlabels+=`<text x="${sx(i)}" y="${PAD.t+CH+26}" text-anchor="middle" font-family="Exo 2, sans-serif" font-size="7.5" fill="var(--muted)">${d.wk}</text>`;
  });

  let rlines='';
  wkData.forEach((d,i)=>{
    if(d.hasRace)rlines+=`<line x1="${sx(i)}" y1="${sy(d.km)}" x2="${sx(i)}" y2="${PAD.t+CH}" stroke="#EF4444" stroke-width="1" stroke-dasharray="3,3" opacity="0.4"/>`;
  });

  const hitW = Math.max(8, CW/(n*1.2));
  let hits='',pts='';
  wkData.forEach((d,i)=>{
    hits+=`<rect x="${sx(i)-hitW/2}" y="${PAD.t}" width="${hitW}" height="${CH}" fill="transparent" class="vch" data-i="${i}" style="cursor:pointer"/>`;
    const cx=sx(i),cy=sy(d.km);
    if(d.hasRace){
      const sz=6;
      pts+=`<polygon points="${cx},${cy-sz} ${cx+sz},${cy} ${cx},${cy+sz} ${cx-sz},${cy}" fill="#EF4444" id="vp${i}"/>`;
      pts+=`<text x="${cx}" y="${cy-sz-4}" text-anchor="middle" font-family="Exo 2, sans-serif" font-size="8.5" fill="#EF4444" font-weight="600">${d.km}</text>`;
    } else if(d.hasAet){
      const sz=5;
      pts+=`<polygon points="${cx},${cy-sz} ${cx+sz},${cy} ${cx},${cy+sz} ${cx-sz},${cy}" fill="#00C46A" id="vp${i}"/>`;
    } else {
      const isC=d.isCur;
      pts+=`<circle cx="${cx}" cy="${cy}" r="${isC?4.5:3}" fill="${isC?'#00C46A':'#0A0A0A'}" stroke="#00C46A" stroke-width="${isC?0:1.5}" id="vp${i}"/>`;
    }
    if(d.km>=maxKm*0.87||d.isCur||i===0)
      pts+=`<text x="${cx}" y="${cy-9}" text-anchor="middle" font-family="Exo 2, sans-serif" font-size="9" fill="${d.isCur?'#00C46A':'rgba(244,244,242,0.5)'}" font-weight="${d.isCur?700:400}">${d.km}</text>`;
  });

  const hd = hovWk !== null ? wkData[hovWk] : null;

  // Phases
  const phases = {};
  plan.weeks.forEach(w=>{
    const ph=(w.phase||'').split('·')[0].trim()||'Other';
    if(!phases[ph])phases[ph]={weeks:0,hrs:0};
    phases[ph].weeks++;phases[ph].hrs+=calcWeekHrs(w);
  });

  return (
    <div style={{padding:'16px 0 24px'}}>
      <div style={{padding:'0 14px'}}>

        {/* Race countdowns — both green */}
        {races.length>=1&&(
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            {races.map((r,i)=>(
              <div key={i} style={{flex:1,background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'12px 13px'}}>
                <div style={{fontFamily:'Archivo Black,sans-serif',fontSize:28,color:'#00C46A',lineHeight:1}}>{daysTo(r.date)}</div>
                <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',letterSpacing:1,marginTop:2}}>DAYS TO GO</div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginTop:4}}>{r.name}</div>
                {r.goal&&<div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'#00C46A',marginTop:2}}>{r.goal}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Block stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
          {[[plan.weeks.length,'WEEKS'],[Math.round(totalHrs),'HRS PLANNED'],[`${doneS}/${totalS}`,'SESSIONS']].map(([v,l],i)=>(
            <div key={i} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:11,padding:'11px 12px'}}>
              <div style={{fontFamily:'Archivo Black,sans-serif',fontSize:24,color:'#00C46A',lineHeight:1}}>{v}</div>
              <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',letterSpacing:.5,marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <Heatmap plan={plan} completions={completions}/>
        <div style={{marginBottom:14}}/>

        {/* Volume chart — SVG line graph */}
        <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'#00C46A',letterSpacing:3,fontWeight:700,marginBottom:8}}>WEEKLY VOLUME</div>
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden',position:'relative',marginBottom:14}}>
          <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
            <div style={{minWidth:520}} onMouseLeave={()=>setHovWk(null)}>
              <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',display:'block'}}
                dangerouslySetInnerHTML={{__html:`
                  ${bands}${grid}
                  <polygon points="${areaPts}" fill="rgba(0,196,106,0.07)" stroke="none"/>
                  <polyline points="${linePts}" fill="none" stroke="rgba(0,196,106,0.3)" stroke-width="2.5" stroke-linejoin="round"/>
                  <polyline points="${linePts}" fill="none" stroke="#00C46A" stroke-width="1.5" stroke-linejoin="round"/>
                  ${rlines}${xlabels}
                  <line id="vhl" x1="0" y1="${PAD.t}" x2="0" y2="${PAD.t+CH}" stroke="rgba(244,244,242,0.15)" stroke-width="1" display="none"/>
                  ${pts}${hits}
                `}}
                onMouseMove={e=>{
                  const svg=e.currentTarget;const rect=svg.getBoundingClientRect();
                  const relX=(e.clientX-rect.left)/rect.width*W;
                  let closest=0,minD=Infinity;
                  wkData.forEach((_,i)=>{const d=Math.abs(sx(i)-relX);if(d<minD){minD=d;closest=i;}});
                  setHovWk(closest);
                  const hl=svg.getElementById('vhl');
                  if(hl){hl.setAttribute('x1',sx(closest));hl.setAttribute('x2',sx(closest));hl.removeAttribute('display');}
                }}
              />
            </div>
          </div>
          {/* Tooltip */}
          {hd&&(
            <div style={{position:'absolute',top:8,right:12,background:'var(--surface)',border:'1.5px solid rgba(0,196,106,0.35)',borderRadius:10,padding:'10px 14px',pointerEvents:'none',minWidth:160}}>
              <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'#00C46A',letterSpacing:2,marginBottom:3}}>WK {hd.wk} · {hd.date}</div>
              <div style={{fontFamily:'Archivo Black,sans-serif',fontSize:22,color:'var(--text)',lineHeight:1}}>{hd.km}<span style={{fontFamily:'Exo 2, sans-serif',fontSize:11,color:'var(--muted)',marginLeft:4}}>km</span></div>
              <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',marginTop:4,letterSpacing:1}}>{hd.phase.split('·').pop().trim().toUpperCase().substring(0,22)}</div>
              {hd.hasRace&&<div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'#EF4444',marginTop:4,fontWeight:700}}>RACE WEEK</div>}
              {hd.hasAet&&<div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'#00C46A',marginTop:4,fontWeight:700}}>AeT RETEST</div>}
            </div>
          )}
          {/* Legend */}
          <div style={{display:'flex',gap:14,padding:'8px 14px',borderTop:`1px solid ${'var(--border)'}`,flexWrap:'wrap'}}>
            {[['#00C46A','Line'],['#EF4444','Race'],['rgba(0,196,106,1)','AeT test']].map(([c,l])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:5}}>
                {l==='AeT test'?<svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,0 10,5 5,10 0,5" fill={c}/></svg>
                  :l==='Race'?<svg width="10" height="10" viewBox="0 0 10 10"><polygon points="5,0 10,5 5,10 0,5" fill={c}/></svg>
                  :<div style={{width:14,height:2,background:c,borderRadius:1}}/>}
                <span style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',letterSpacing:1}}>{l.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AeT retest schedule */}
        {plan.meta.aet_retest_schedule&&<>
          <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'#00C46A',letterSpacing:3,fontWeight:700,marginBottom:8}}>AeT RETEST SCHEDULE</div>
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden',marginBottom:14}}>
            {plan.meta.aet_retest_schedule.map((t,i,arr)=>{
              const ws=new Date(start.getTime()+(t.week-1)*7*86400000);
              const isPast=ws<new Date();
              return(
                <div key={i} style={{display:'flex',alignItems:'center',gap:11,padding:'11px 14px',borderBottom:i<arr.length-1?`1px solid ${'var(--border)'}`:'none'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:isPast?'var(--border)':'var(--green)',flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600}}>Week {t.week} · {ws.toLocaleDateString('en-AU',{day:'numeric',month:'short'})}</div>
                    <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',marginTop:1}}>{t.note}</div>
                  </div>
                  <span style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:isPast?'var(--muted)':'var(--green)',letterSpacing:1}}>{isPast?'DONE':'UPCOMING'}</span>
                </div>
              );
            })}
          </div>
        </>}

        {/* Phase breakdown */}
        <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'#00C46A',letterSpacing:3,fontWeight:700,marginBottom:8}}>PHASE BREAKDOWN</div>
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
          {Object.entries(phases).map(([ph,stats],i,arr)=>(
            <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',borderBottom:i<arr.length-1?`1px solid ${'var(--border)'}`:'none'}}>
              <div style={{fontSize:14,fontWeight:600}}>{ph}</div>
              <div style={{fontFamily:'Exo 2, sans-serif',fontSize:10,color:'var(--muted)',letterSpacing:1}}>{stats.weeks} WKS · {Math.round(stats.hrs)}HRS</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
