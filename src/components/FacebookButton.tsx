import React, { useState } from 'react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@700&display=swap');

.fb-btn{
  position:relative;
  display:inline-flex;align-items:center;justify-content:center;gap:14px;
  padding:0 36px 0 22px;
  height:80px;min-width:320px;
  border:none;border-radius:16px;cursor:pointer;overflow:hidden;
  background:transparent;outline:none;-webkit-tap-highlight-color:transparent;
  transition:transform .3s cubic-bezier(.34,1.56,.64,1),box-shadow .3s ease;
  box-shadow:
    0 6px 0 rgba(70,35,8,.6),
    0 10px 28px rgba(50,22,3,.5),
    0 2px 6px rgba(0,0,0,.22),
    inset 0 1px 0 rgba(255,225,160,.4);
}
.fb-btn:hover{
  transform:translateY(-3px);
  box-shadow:
    0 9px 0 rgba(70,35,8,.55),
    0 18px 38px rgba(50,22,3,.48),
    0 3px 8px rgba(0,0,0,.22),
    inset 0 1px 0 rgba(255,225,160,.4);
}
.fb-btn:active{
  transform:translateY(3px);
  box-shadow:
    0 2px 0 rgba(70,35,8,.6),
    0 4px 12px rgba(50,22,3,.4),
    inset 0 2px 5px rgba(0,0,0,.22);
}

/* ── Wood base: rich dark walnut ── */
.wood-bg{
  position:absolute;inset:0;
  background:linear-gradient(
    180deg,
    #b8702a 0%,
    #9e5818 5%,
    #b46822 12%,
    #8c4a0e 20%,
    #a85e1a 28%,
    #925010 36%,
    #ae6420 45%,
    #8e4c10 54%,
    #a85e1a 63%,
    #965214 72%,
    #b06620 82%,
    #8a4a0c 91%,
    #a05818 100%
  );
  z-index:0;
}

/* warm light band — rounded plank feel */
.wood-midlight{
  position:absolute;inset:0;z-index:1;pointer-events:none;
  background:radial-gradient(ellipse 90% 60% at 50% 42%,
    rgba(230,175,100,.3) 0%,
    rgba(210,150,75,.15) 45%,
    transparent 75%
  );
}

/* ── SVG wood grain ── */
.wood-grain{
  position:absolute;inset:0;z-index:2;pointer-events:none;
}

/* ── Edge vignette ── */
.wood-vignette{
  position:absolute;inset:0;z-index:3;pointer-events:none;
  background:
    linear-gradient(90deg,rgba(20,6,0,.35) 0%,transparent 18%,transparent 82%,rgba(20,6,0,.35) 100%),
    linear-gradient(180deg,rgba(15,4,0,.25) 0%,transparent 24%,transparent 76%,rgba(15,4,0,.42) 100%);
}

/* ── Animated lacquer sweep ── */
.wood-lacquer{
  position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden;border-radius:16px;
}
.wood-lacquer::after{
  content:'';
  position:absolute;
  top:-20%;left:-60%;
  width:50%;height:140%;
  background:linear-gradient(
    105deg,
    transparent 0%,
    rgba(255,235,190,.05) 30%,
    rgba(255,222,168,.2) 50%,
    rgba(255,235,190,.05) 70%,
    transparent 100%
  );
  transform:skewX(-10deg);
  animation:lacquerSweep 6s cubic-bezier(.45,0,.55,1) infinite 1s;
}
@keyframes lacquerSweep{
  0%   {left:-60%;opacity:0}
  6%   {opacity:1}
  48%  {left:115%;opacity:1}
  54%  {opacity:0}
  100% {left:115%;opacity:0}
}

/* ── Deep carved bevel ── */
.wood-border{
  position:absolute;inset:0;border-radius:16px;z-index:5;pointer-events:none;
  box-shadow:
    inset 0 2.5px 0  rgba(240,200,130,.55),
    inset 0 1px 0    rgba(255,230,165,.3),
    inset 0 -3.5px 0 rgba(22,6,0,.72),
    inset 0 -1px 0   rgba(38,10,0,.4),
    inset 2.5px 0 0  rgba(220,175,110,.28),
    inset -2.5px 0 0 rgba(22,6,0,.42),
    inset 0 0 22px   rgba(15,4,0,.3);
}

/* ── Content ── */
.btn-content{position:relative;z-index:12;display:flex;align-items:center;gap:14px;}

.fb-icon{
  width:48px;height:48px;border-radius:13px;
  background:linear-gradient(145deg,#2d86f5 0%,#1877f2 40%,#1259c4 100%);
  border:1.5px solid rgba(255,210,140,.45);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  box-shadow:
    0 3px 12px rgba(18,80,200,.5),
    0 1px 3px rgba(0,0,0,.3),
    inset 0 1.5px 0 rgba(255,255,255,.28),
    inset 0 -2px 0 rgba(0,0,0,.15);
  transition:transform .3s,box-shadow .3s;
  overflow:hidden;
  position:relative;
}
/* glass gloss top half */
.fb-icon::before{
  content:'';
  position:absolute;
  top:0;left:0;right:0;height:52%;
  background:linear-gradient(180deg,rgba(255,255,255,.22) 0%,transparent 100%);
  border-radius:12px 12px 0 0;
  pointer-events:none;
}
.fb-btn:hover .fb-icon{
  transform:scale(1.1) rotate(-5deg);
  box-shadow:
    0 6px 22px rgba(18,80,200,.6),
    0 2px 5px rgba(0,0,0,.28),
    inset 0 1.5px 0 rgba(255,255,255,.32),
    inset 0 -2px 0 rgba(0,0,0,.15);
}
.fb-icon svg{
  width:22px;height:22px;fill:white;
  position:relative;z-index:1;
  filter:drop-shadow(0 1px 2px rgba(0,0,50,.35));
}

.divider{
  width:1.5px;height:34px;
  background:linear-gradient(180deg,
    transparent,
    rgba(255,205,130,.65) 35%,
    rgba(255,205,130,.65) 65%,
    transparent
  );
}

.btn-label{
  font-family:'Scheherazade New',serif;
  font-size:24px;font-weight:700;
  color:#fff8ee;
  text-shadow:0 1px 4px rgba(50,15,0,.75),0 0 14px rgba(255,175,70,.2);
  direction:rtl;white-space:nowrap;letter-spacing:.3px;
  transition:text-shadow .3s;
}
.fb-btn:hover .btn-label{
  text-shadow:0 1px 4px rgba(50,15,0,.75),0 0 22px rgba(255,200,100,.45);
}

.particle{position:absolute;width:5px;height:5px;border-radius:50%;pointer-events:none;animation:burst .7s ease-out forwards;z-index:25;}
@keyframes burst{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--px),var(--py)) scale(0);opacity:0}}
`;

function WoodGrain() {
  const W = 440, H = 80;
  const lines: JSX.Element[] = [];

  // Dark grain lines (deep shadows between fibers)
  const darkGrains = [
    'rgba(45,14,1,.62)','rgba(38,10,0,.48)','rgba(55,18,2,.54)',
    'rgba(42,12,1,.44)','rgba(60,22,3,.5)', 'rgba(35,9,0,.38)',
    'rgba(68,26,4,.46)','rgba(48,15,2,.52)','rgba(58,20,3,.42)',
    'rgba(40,11,1,.56)','rgba(52,17,2,.46)','rgba(36,9,0,.4)',
    'rgba(62,23,3,.48)','rgba(44,13,1,.5)', 'rgba(70,28,5,.44)',
    'rgba(46,14,2,.44)','rgba(56,19,3,.5)', 'rgba(39,10,0,.38)',
  ];
  // Light grain lines (fiber highlight)
  const lightGrains = [
    'rgba(210,150,70,.22)','rgba(225,168,85,.18)','rgba(195,138,58,.2)',
    'rgba(215,155,72,.16)','rgba(205,145,65,.2)', 'rgba(220,162,80,.15)',
  ];

  // Dense dark grain lines
  for (let i = 0; i < 50; i++) {
    const y = 0.8 + (i / 49) * (H - 1.6);
    const a1 = 0.8 + Math.sin(i * 2.1 + 0.5) * 0.9;
    const a2 = 0.5 + Math.cos(i * 1.6 + 1.2) * 0.5;
    const a3 = 0.3 + Math.sin(i * 0.9) * 0.25;
    const f1 = 0.012 + Math.sin(i * 0.7) * 0.004;
    const f2 = 0.035 + Math.cos(i * 1.2) * 0.007;
    const f3 = 0.08  + Math.sin(i * 0.5) * 0.015;
    const ph = i * 3.1;
    let d = `M 0 ${y}`;
    for (let x = 0; x <= W; x += 5) {
      const dy = Math.sin(x*f1+ph)*a1 + Math.cos(x*f2+ph*.8)*a2 + Math.sin(x*f3+ph*.4)*a3;
      d += ` L ${x} ${y+dy}`;
    }
    const sw = i % 7 === 0 ? 1.4 : i % 4 === 0 ? 1.0 : i % 2 === 0 ? 0.7 : 0.45;
    lines.push(<path key={`d${i}`} d={d} stroke={darkGrains[i%darkGrains.length]} strokeWidth={sw} fill="none"/>);
  }

  // Bright fiber highlights (fewer, thinner)
  for (let i = 0; i < 14; i++) {
    const y = 3 + (i / 13) * (H - 6);
    const ph = i * 5.2 + 1.4;
    let d = `M 0 ${y}`;
    for (let x = 0; x <= W; x += 8) {
      const dy = Math.sin(x*.013+ph)*.7 + Math.cos(x*.038+ph*.7)*.4;
      d += ` L ${x} ${y+dy}`;
    }
    lines.push(<path key={`l${i}`} d={d} stroke={lightGrains[i%lightGrains.length]} strokeWidth={0.5} fill="none"/>);
  }

  // Knots — 3 this time, with wrapping grain distortion
  const knots = [
    { cx:62,  cy:38, rx:16, ry:10 },
    { cx:285, cy:22, rx:12, ry:8, cy2: 0  },
    { cx:390, cy:54, rx:9,  cy2:54, ry:6 },
  ];
  knots.forEach((k, ki) => {
    // distortion aura around knot
    for (let r = 6; r >= 1; r--) {
      lines.push(
        <ellipse key={`ka${ki}r${r}`} cx={k.cx} cy={k.cy}
          rx={k.rx * r * 0.38} ry={(k.ry||6) * r * 0.38}
          fill="none"
          stroke={`rgba(35,10,0,${Math.max(0.04, 0.38 - r*0.055)})`}
          strokeWidth={r <= 2 ? 1.4 : 0.8}/>
      );
    }
    // dark heartwood center
    lines.push(
      <ellipse key={`kf${ki}`} cx={k.cx} cy={k.cy}
        rx={k.rx*.22} ry={(k.ry||6)*.22}
        fill="rgba(28,8,0,.65)" stroke="rgba(20,5,0,.4)" strokeWidth=".6"/>
    );
    // tiny highlight
    lines.push(
      <ellipse key={`kh${ki}`} cx={k.cx-k.rx*.06} cy={k.cy-(k.ry||6)*.1}
        rx={k.rx*.06} ry={(k.ry||6)*.06}
        fill="rgba(210,155,75,.35)"/>
    );
  });

  return (
    <svg className="wood-grain" viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.72 }}>
      {lines}
    </svg>
  );
}

interface FacebookButtonProps {
  facebookUrl?: string;
  className?: string;
}

interface Particle {
    id: number;
    angle: number;
    color: string;
    dist: number;
}

export default function FacebookButton({
  facebookUrl = "https://www.facebook.com/share/1bZQQuQinu/",
  className = ""
}: FacebookButtonProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const handleClick = () => {
    const ps = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      angle: (i / 12) * 360,
      color: ['rgba(255,215,150,.9)','rgba(255,240,200,.85)','rgba(210,170,110,.9)'][i % 3],
      dist: 36 + Math.random() * 34,
    }));
    setParticles(ps);
    setTimeout(() => setParticles([]), 800);
    setTimeout(() => window.open(facebookUrl, '_blank', 'noopener,noreferrer'), 180);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className={`flex justify-center ${className}`}>
        <button className="fb-btn" onClick={handleClick} type="button">

          <div className="wood-bg"/>
          <div className="wood-midlight"/>
          <WoodGrain/>
          <div className="wood-vignette"/>
          <div className="wood-lacquer"/>
          <div className="wood-border"/>

          {particles.map(p => {
            const rad = (p.angle * Math.PI) / 180;
            return (
              <div key={p.id} className="particle" style={{
                top:'50%', left:'50%',
                background: p.color,
                boxShadow: `0 0 5px ${p.color}`,
                ['--px' as any]: `${Math.cos(rad) * p.dist}px`,
                ['--py' as any]: `${Math.sin(rad) * p.dist}px`,
              }}/>
            );
          })}

          <div className="btn-content">
            <div className="fb-icon">
              <svg viewBox="0 0 320 512">
                <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H12.89V288h81.39v224h100.17V288z"/>
              </svg>
            </div>
            <div className="divider"/>
            <span className="btn-label">تابعنا على فيسبوك</span>
          </div>

        </button>
      </div>
    </>
  );
}
