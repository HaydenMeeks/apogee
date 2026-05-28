import { useState, useEffect } from 'react';
import { daysTo } from '../utils.js';

export default function Splash({ plan, onEnter }) {
  const [exiting, setExiting] = useState(false);

  const handleEnter = () => {
    setExiting(true);
    setTimeout(onEnter, 700);
  };

  const races = plan?.meta?.races || [];

  return (
    <>
      <style>{`
        @keyframes stageOut {
          0%   { opacity:1; }
          60%  { opacity:1; }
          100% { opacity:0; }
        }
        @keyframes shieldDraw {
          from { stroke-dashoffset: 700; opacity:0; }
          1%   { opacity:1; }
          to   { stroke-dashoffset: -20; }
        }
        @keyframes innerRise {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        @keyframes peakSlam {
          0%   { transform: translateY(-90px) scale(.4) rotate(-12deg); opacity:0; }
          60%  { transform: translateY(0) scale(1.12) rotate(2deg); opacity:1; }
          80%  { transform: translateY(0) scale(.97) rotate(-1deg); opacity:1; }
          100% { transform: translateY(0) scale(1) rotate(0); opacity:1; }
        }
        @keyframes burst {
          0%   { transform:scale(0); opacity:0; }
          20%  { transform:scale(1); opacity:.9; }
          100% { transform:scale(3.2); opacity:0; }
        }
        @keyframes spark {
          0%   { transform:scaleY(0); opacity:0; }
          30%  { transform:scaleY(1); opacity:1; }
          100% { transform:scaleY(1.4); opacity:0; }
        }
        @keyframes shake {
          0%,100%{ transform:translate(0,0); }
          10%{ transform:translate(-2px,1px); }
          20%{ transform:translate(3px,-2px); }
          30%{ transform:translate(-3px,2px); }
          40%{ transform:translate(2px,-1px); }
          60%{ transform:translate(1px,0); }
        }
        @keyframes letterRise {
          from { transform:translateY(40px); opacity:0; }
          to   { transform:translateY(0); opacity:1; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes barGrow {
          from { transform:scaleX(0); }
          to   { transform:scaleX(1); }
        }
        @keyframes btnPulse {
          0%,100% { box-shadow:0 12px 30px rgba(0,196,106,.35),0 0 0 0 rgba(0,196,106,.5); }
          50%     { box-shadow:0 12px 30px rgba(0,196,106,.5),0 0 0 18px rgba(0,196,106,0); }
        }
        @keyframes glowPulse {
          0%,100% { opacity:.5; transform:translate(-50%,-50%) scale(1); }
          50%     { opacity:.75; transform:translate(-50%,-50%) scale(1.08); }
        }
        @keyframes breath {
          0%,100% { transform:scale(1); }
          50%     { transform:scale(1.015); }
        }
        @keyframes gridBreath {
          0%,100%{ opacity:.4; } 50%{ opacity:1; }
        }
        @keyframes exitZoom {
          to { transform:scale(1.6); opacity:0; }
        }
        .splash-badge { animation: breath 4s ease-in-out 4.5s infinite, shake 0.45s cubic-bezier(.36,.07,.19,.97) 2.55s; }
        .outer-shield { stroke-dasharray:700; stroke-dashoffset:700; opacity:0; animation:shieldDraw 1.6s cubic-bezier(.7,0,.2,1) .4s forwards; }
        .inner-clip  { transform-origin:60px 110px; transform:scaleY(0); animation:innerRise .8s cubic-bezier(.6,0,.2,1) 1.7s forwards; }
        .peak-group  { transform-origin:60px 78px; transform:translateY(-90px) scale(.4) rotate(-12deg); opacity:0; animation:peakSlam .55s cubic-bezier(.55,-.4,.3,1.6) 2.4s forwards; }
        .summit-burst { transform-origin:60px 38px; transform:scale(0); opacity:0; animation:burst .9s ease-out 2.6s forwards; }
        .sp { transform-origin:60px 38px; transform:scaleY(0); opacity:0; }
        .sp1 { animation:spark .55s ease-out 2.65s forwards; }
        .sp2 { animation:spark .60s ease-out 2.68s forwards; }
        .sp3 { animation:spark .55s ease-out 2.70s forwards; }
        .sp4 { animation:spark .60s ease-out 2.72s forwards; }
        .sp5 { animation:spark .55s ease-out 2.74s forwards; }
        .letter { display:inline-block; transform:translateY(40px); opacity:0; animation:letterRise .6s cubic-bezier(.34,1.4,.64,1) forwards; }
        .l1{animation-delay:3.00s} .l2{animation-delay:3.06s} .l3{animation-delay:3.12s}
        .l4{animation-delay:3.18s} .l5{animation-delay:3.24s} .l6{animation-delay:3.30s}
        .tag-line { opacity:0; animation:fadeUp .8s ease-out 3.6s forwards; }
        .bar-l { transform-origin:left; transform:scaleX(0); animation:barGrow .5s ease-out 3.7s forwards; }
        .bar-r { transform-origin:right; transform:scaleX(0); animation:barGrow .5s ease-out 3.75s forwards; }
        .cta-wrap { opacity:0; transform:translateY(20px); animation:fadeUp .8s cubic-bezier(.2,.8,.2,1) 4.0s forwards; }
        .enter-btn { animation:btnPulse 2.4s ease-in-out 4.6s infinite; }
        .frame-wrap { animation: ${exiting ? 'exitZoom .7s cubic-bezier(.6,0,.4,1) forwards' : 'none'}; }
      `}</style>

      <div
        onClick={handleEnter}
        style={{
          position:'fixed', inset:0, zIndex:9999,
          background:'radial-gradient(circle at 50% 100%, #0d0d0d 0%, #000 70%)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:'56px 24px 48px', gap:'clamp(28px,5vh,64px)',
          overflow:'hidden', cursor:'pointer',
          animation: exiting ? 'stageOut .7s cubic-bezier(.6,0,.4,1) forwards' : 'none',
        }}
      >
        {/* Grid */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:'linear-gradient(rgba(0,196,106,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,196,106,.06) 1px,transparent 1px)',
          backgroundSize:'56px 56px',
          animation:'gridBreath 5s ease-in-out infinite',
        }}/>
        {/* Glow */}
        <div style={{
          position:'absolute', left:'50%', top:'46%',
          width:'900px', height:'900px', borderRadius:'50%',
          background:'radial-gradient(circle,rgba(0,196,106,.28) 0%,rgba(0,196,106,.05) 40%,transparent 70%)',
          opacity:0, animation:'glowPulse 3s ease-in-out 1.8s infinite',
          transform:'translate(-50%,-50%)',
        }}/>
        {/* Flash */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:'radial-gradient(circle at 50% 46%,#00C46A 0%,transparent 40%)',
          opacity:0, animation:'burst .4s ease-out 2.55s',
        }}/>

        {/* Badge + wordmark */}
        <div className="frame-wrap" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:36, position:'relative', zIndex:2 }}>
          <div className="splash-badge" style={{ width:'clamp(180px,40vw,240px)', height:'auto', filter:'drop-shadow(0 0 0 rgba(0,196,106,0))', position:'relative' }}>
            <svg viewBox="-30 -30 180 184" style={{width:'100%',height:'100%',overflow:'visible'}}>
              <defs>
                <radialGradient id="burstGrad">
                  <stop offset="0%" stopColor="#00C46A" stopOpacity="1"/>
                  <stop offset="60%" stopColor="#00C46A" stopOpacity=".4"/>
                  <stop offset="100%" stopColor="#00C46A" stopOpacity="0"/>
                </radialGradient>
                <clipPath id="innerWipe">
                  <rect className="inner-clip" x="0" y="0" width="120" height="124"/>
                </clipPath>
              </defs>
              <path className="outer-shield"
                d="M 8 26 L 60 4 L 112 26 L 112 76 Q 112 96 60 118 Q 8 96 8 76 Z"
                stroke="#F4F4F2" strokeWidth="5" strokeLinejoin="miter" fill="none"/>
              <g clipPath="url(#innerWipe)">
                <path d="M 60 16 L 100 34 L 100 74 Q 100 88 60 104 Q 20 88 20 74 L 20 34 Z" fill="#00C46A"/>
              </g>
              <circle className="summit-burst" cx="60" cy="38" r="20" fill="url(#burstGrad)"/>
              <g stroke="#00C46A" strokeWidth="2" strokeLinecap="round">
                <line className="sp sp1" x1="60" y1="38" x2="20" y2="0"/>
                <line className="sp sp2" x1="60" y1="38" x2="42" y2="-8"/>
                <line className="sp sp3" x1="60" y1="38" x2="60" y2="-12"/>
                <line className="sp sp4" x1="60" y1="38" x2="78" y2="-8"/>
                <line className="sp sp5" x1="60" y1="38" x2="100" y2="0"/>
              </g>
              <g className="peak-group">
                <path d="M 32 78 L 60 38 L 88 78" stroke="#0A0A0A" strokeWidth="6" strokeLinejoin="miter" strokeLinecap="square" fill="none"/>
                <path d="M 60 38 L 88 78 L 60 78 Z" fill="#0A0A0A"/>
              </g>
            </svg>
          </div>

          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <div style={{ fontFamily:'Archivo Black,sans-serif', fontSize:'clamp(48px,10vw,68px)', letterSpacing:'0.16em', lineHeight:1, color:'#F4F4F2' }}>
              {'APOGEE'.split('').map((l,i) => (
                <span key={i} className={`letter l${i+1}`}>{l}</span>
              ))}
            </div>
            <div className="tag-line" style={{ display:'flex', alignItems:'center', gap:14, fontFamily:'Exo 2, sans-serif', fontSize:12, letterSpacing:'0.5em', color:'#00C46A' }}>
              <div className="bar-l" style={{ width:28, height:1, background:'#00C46A' }}/>
              ULTRA TRAINING
              <div className="bar-r" style={{ width:28, height:1, background:'#00C46A' }}/>
            </div>
          </div>
        </div>

        {/* Race countdown — GPT only */}
        {races.length >= 1 && (
          <div className="cta-wrap" style={{ textAlign:'center', zIndex:2 }}>
            <div style={{ fontFamily:'Archivo Black,sans-serif', fontSize:48, color:'#00C46A', lineHeight:1, textShadow:'0 0 20px rgba(0,196,106,.5)' }}>
              {daysTo(races[races.length - 1].date)}
            </div>
            <div style={{ fontFamily:'Exo 2, sans-serif', fontSize:10, color:'rgba(244,244,242,.35)', letterSpacing:3, marginTop:5 }}>
              DAYS TO GPT100
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="cta-wrap" style={{ position:'relative', zIndex:3 }}>
          <button
            className="enter-btn"
            onClick={handleEnter}
            style={{
              background:'#00C46A', color:'#0A0A0A',
              height:56, padding:'0 44px',
              fontFamily:'DM Sans,sans-serif', fontWeight:800,
              fontSize:13, letterSpacing:'0.32em',
              borderRadius:999,
              display:'inline-flex', alignItems:'center', gap:14,
              boxShadow:'0 12px 30px rgba(0,196,106,.35)',
              transition:'transform .2s, background .2s',
            }}
          >
            ENTER
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M1 5H12M8 1l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Bottom bar sweep */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:2,
          background:'linear-gradient(90deg,transparent,#00C46A,rgba(244,244,242,.5),#00C46A,transparent)',
          animation:'burst 2.5s ease-in-out infinite',
        }}/>
      </div>
    </>
  );
}
