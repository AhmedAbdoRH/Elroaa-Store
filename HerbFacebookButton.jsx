import { useState } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#e8ddd0;min-height:100vh;display:flex;align-items:center;justify-content:center;}

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

/* ── Floating botanicals ── */
.floaters{position:absolute;inset:0;z-index:6;pointer-events:none;overflow:hidden;border-radius:16px;}
.floater{
  position:absolute;
  transform:rotate(var(--rot)) scale(var(--sc));
  opacity:var(--op);
  animation:gentleFloat var(--dur) ease-in-out infinite var(--delay);
  will-change:transform;
}
@keyframes gentleFloat{
  0%,100%{ transform:rotate(var(--rot)) scale(var(--sc)) translate(0px, 0px); }
  25%    { transform:rotate(calc(var(--rot) + 4deg)) scale(var(--sc)) translate(1.5px, -2.5px); }
  50%    { transform:rotate(var(--rot)) scale(var(--sc)) translate(2px, -1px); }
  75%    { transform:rotate(calc(var(--rot) - 3deg)) scale(var(--sc)) translate(0.5px, -3px); }
}
`;

function WoodGrain() {
  const W = 440, H = 80;
  const lines = [];

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
    { cx:285, cy:22, rx:12, ry:8  },
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


/* ── Scattered dried herbs & seeds — fixed positions, gentle float ── */
function FloatShape({ type, w, h, fill }) {
  if (type === 'leaf') {
    return (
      <svg width={w*2} height={h*2} viewBox={`0 0 ${w*2} ${h*2}`} style={{overflow:'visible'}}>
        <ellipse cx={w} cy={h} rx={w*.88} ry={h*.82} fill={fill}/>
        <line x1={w*.15} y1={h} x2={w*1.85} y2={h} stroke="rgba(50,28,5,.4)" strokeWidth=".7" strokeLinecap="round"/>
        <line x1={w*.85} y1={h} x2={w*.5}  y2={h*.3}  stroke="rgba(50,28,5,.28)" strokeWidth=".45"/>
        <line x1={w*.85} y1={h} x2={w*.5}  y2={h*1.7} stroke="rgba(50,28,5,.28)" strokeWidth=".45"/>
        <line x1={w*1.15} y1={h} x2={w*1.5} y2={h*.35} stroke="rgba(50,28,5,.28)" strokeWidth=".45"/>
        <line x1={w*1.15} y1={h} x2={w*1.5} y2={h*1.65} stroke="rgba(50,28,5,.28)" strokeWidth=".45"/>
      </svg>
    );
  }
  if (type === 'curl') {
    return (
      <svg width={w*2} height={h*2} viewBox={`0 0 ${w*2} ${h*2}`} style={{overflow:'visible'}}>
        <path d={`M ${w*.1} ${h} Q ${w*.5} ${h*.2} ${w} ${h*.3} Q ${w*1.5} ${h*.4} ${w*1.9} ${h} Q ${w*1.4} ${h*1.5} ${w} ${h*1.6} Q ${w*.5} ${h*1.7} ${w*.1} ${h} Z`} fill={fill}/>
        <path d={`M ${w*.2} ${h} Q ${w*.9} ${h*.6} ${w*1.8} ${h*.9}`} stroke="rgba(45,25,5,.35)" strokeWidth=".6" fill="none" strokeLinecap="round"/>
      </svg>
    );
  }
  if (type === 'seed') {
    return (
      <svg width={w*2} height={h*2} viewBox={`0 0 ${w*2} ${h*2}`} style={{overflow:'visible'}}>
        <path d={`M ${w} ${h*.1} Q ${w*1.7} ${h} ${w} ${h*1.9} Q ${w*.3} ${h} ${w} ${h*.1} Z`} fill={fill}/>
        <path d={`M ${w} ${h*.3} Q ${w*1.3} ${h} ${w} ${h*1.7}`} stroke="rgba(255,215,150,.22)" strokeWidth=".55" fill="none" strokeLinecap="round"/>
      </svg>
    );
  }
  if (type === 'twig') {
    return (
      <svg width={w*2} height={h*4} viewBox={`0 0 ${w*2} ${h*4}`} style={{overflow:'visible'}}>
        <path d={`M 0 ${h*2} Q ${w*.6} ${h*1.5} ${w} ${h*2} Q ${w*1.4} ${h*2.5} ${w*2} ${h*2}`} stroke={fill} strokeWidth={h*1.4} fill="none" strokeLinecap="round"/>
        <circle cx={w*.45}  cy={h*1.82} r={h*.7} fill={fill}/>
        <circle cx={w*1.55} cy={h*2.18} r={h*.6} fill={fill}/>
      </svg>
    );
  }
  return (
    <svg width={w*2} height={h*2} viewBox={`0 0 ${w*2} ${h*2}`} style={{overflow:'visible'}}>
      <circle cx={w} cy={h} r={w*.88} fill={fill}/>
      <circle cx={w*.7} cy={h*.7} r={w*.28} fill="rgba(255,225,170,.22)"/>
    </svg>
  );
}

// Each floater has a fixed position (left/top as % of button) + gentle bob animation
const SCATTERED = [
  // ── big visible leaves — green/olive dried tones
  { type:'leaf', w:16,h:9,  fill:'rgba(155,185,80,.92)',  left:'4%',  top:'16%', rot:'-12deg', dur:'3.8s', delay:'0s',    op:.9,  sc:1.1 },
  { type:'leaf', w:14,h:8,  fill:'rgba(130,165,58,.88)',  left:'13%', top:'65%', rot:'28deg',  dur:'4.2s', delay:'-1.5s', op:.85, sc:1.0 },
  { type:'leaf', w:18,h:10, fill:'rgba(160,195,75,.9)',   left:'23%', top:'10%', rot:'10deg',  dur:'3.5s', delay:'-0.8s', op:.88, sc:1.2 },
  { type:'leaf', w:13,h:7,  fill:'rgba(140,172,65,.85)',  left:'32%', top:'72%', rot:'-32deg', dur:'4.6s', delay:'-2.3s', op:.82, sc:.95 },
  { type:'leaf', w:15,h:8,  fill:'rgba(148,180,70,.88)',  left:'40%', top:'20%', rot:'20deg',  dur:'3.9s', delay:'-3.1s', op:.85, sc:1.05},
  { type:'leaf', w:16,h:9,  fill:'rgba(155,188,72,.9)',   left:'48%', top:'68%', rot:'-10deg', dur:'4.0s', delay:'-0.4s', op:.88, sc:1.1 },
  { type:'leaf', w:14,h:8,  fill:'rgba(132,168,60,.86)',  left:'57%', top:'12%', rot:'38deg',  dur:'3.6s', delay:'-1.9s', op:.83, sc:.98 },
  { type:'leaf', w:17,h:9,  fill:'rgba(158,190,74,.9)',   left:'65%', top:'75%', rot:'-25deg', dur:'4.3s', delay:'-2.7s', op:.88, sc:1.15},
  { type:'leaf', w:13,h:7,  fill:'rgba(136,170,62,.85)',  left:'74%', top:'8%',  rot:'16deg',  dur:'3.7s', delay:'-0.6s', op:.82, sc:.95 },
  { type:'leaf', w:15,h:8,  fill:'rgba(150,182,68,.88)',  left:'82%', top:'62%', rot:'-20deg', dur:'4.1s', delay:'-3.4s', op:.85, sc:1.0 },
  { type:'leaf', w:14,h:8,  fill:'rgba(142,175,64,.86)',  left:'89%', top:'25%', rot:'30deg',  dur:'3.8s', delay:'-1.2s', op:.83, sc:.98 },
  { type:'leaf', w:16,h:9,  fill:'rgba(152,185,70,.9)',   left:'94%', top:'70%', rot:'-6deg',  dur:'4.5s', delay:'-2.0s', op:.88, sc:1.1 },
  // ── curled/brown dried leaves
  { type:'curl', w:14,h:10, fill:'rgba(168,132,55,.88)',  left:'8%',  top:'48%', rot:'42deg',  dur:'4.4s', delay:'-0.9s', op:.85, sc:1.05},
  { type:'curl', w:12,h:8,  fill:'rgba(148,115,45,.84)',  left:'19%', top:'35%', rot:'-28deg', dur:'3.6s', delay:'-2.5s', op:.80, sc:.95 },
  { type:'curl', w:13,h:9,  fill:'rgba(160,125,50,.86)',  left:'43%', top:'45%', rot:'18deg',  dur:'4.0s', delay:'-1.7s', op:.82, sc:1.0 },
  { type:'curl', w:14,h:10, fill:'rgba(155,120,48,.88)',  left:'69%', top:'40%', rot:'-38deg', dur:'3.8s', delay:'-3.0s', op:.84, sc:1.05},
  { type:'curl', w:11,h:8,  fill:'rgba(145,112,44,.84)',  left:'86%', top:'52%', rot:'24deg',  dur:'4.2s', delay:'-0.3s', op:.80, sc:.92 },
  // ── seeds — warm ochre/tan
  { type:'seed', w:6, h:11, fill:'rgba(195,155,70,.92)',  left:'6%',  top:'36%', rot:'12deg',  dur:'3.2s', delay:'-1.1s', op:.90, sc:1.1 },
  { type:'seed', w:5, h:9,  fill:'rgba(178,140,58,.88)',  left:'17%', top:'80%', rot:'-18deg', dur:'3.8s', delay:'-2.8s', op:.85, sc:.95 },
  { type:'seed', w:7, h:12, fill:'rgba(205,162,72,.92)',  left:'27%', top:'28%', rot:'32deg',  dur:'3.4s', delay:'-0.5s', op:.90, sc:1.15},
  { type:'seed', w:6, h:10, fill:'rgba(188,148,62,.88)',  left:'36%', top:'55%', rot:'-22deg', dur:'4.0s', delay:'-3.5s', op:.85, sc:1.0 },
  { type:'seed', w:7, h:12, fill:'rgba(198,158,68,.92)',  left:'53%', top:'26%', rot:'8deg',   dur:'3.6s', delay:'-1.4s', op:.90, sc:1.1 },
  { type:'seed', w:6, h:10, fill:'rgba(182,142,60,.88)',  left:'61%', top:'60%', rot:'-30deg', dur:'3.9s', delay:'-2.1s', op:.85, sc:.98 },
  { type:'seed', w:7, h:12, fill:'rgba(202,160,70,.92)',  left:'76%', top:'30%', rot:'20deg',  dur:'3.3s', delay:'-0.7s', op:.90, sc:1.15},
  { type:'seed', w:6, h:10, fill:'rgba(176,138,56,.88)',  left:'83%', top:'76%', rot:'-12deg', dur:'4.1s', delay:'-3.2s', op:.85, sc:1.0 },
  { type:'seed', w:7, h:11, fill:'rgba(196,155,66,.92)',  left:'96%', top:'42%', rot:'28deg',  dur:'3.7s', delay:'-1.8s', op:.88, sc:1.05},
  // ── dots — round seeds, darker
  { type:'dot',  w:5, h:5,  fill:'rgba(165,125,48,.9)',   left:'10%', top:'26%', rot:'0deg',   dur:'2.8s', delay:'-0.2s', op:.88, sc:1.1 },
  { type:'dot',  w:6, h:6,  fill:'rgba(178,138,55,.92)',  left:'21%', top:'58%', rot:'0deg',   dur:'3.2s', delay:'-1.6s', op:.90, sc:1.0 },
  { type:'dot',  w:5, h:5,  fill:'rgba(158,120,46,.88)',  left:'34%', top:'84%', rot:'0deg',   dur:'2.9s', delay:'-3.0s', op:.85, sc:.95 },
  { type:'dot',  w:7, h:7,  fill:'rgba(185,145,58,.92)',  left:'45%', top:'14%', rot:'0deg',   dur:'3.5s', delay:'-0.8s', op:.90, sc:1.1 },
  { type:'dot',  w:5, h:5,  fill:'rgba(162,124,48,.88)',  left:'59%', top:'78%', rot:'0deg',   dur:'3.0s', delay:'-2.2s', op:.85, sc:1.0 },
  { type:'dot',  w:6, h:6,  fill:'rgba(175,136,52,.9)',   left:'71%', top:'20%', rot:'0deg',   dur:'2.7s', delay:'-1.0s', op:.88, sc:.98 },
  { type:'dot',  w:5, h:5,  fill:'rgba(155,118,45,.88)',  left:'79%', top:'56%', rot:'0deg',   dur:'3.3s', delay:'-3.6s', op:.85, sc:1.05},
  { type:'dot',  w:7, h:7,  fill:'rgba(182,142,56,.92)',  left:'91%', top:'36%', rot:'0deg',   dur:'3.1s', delay:'-0.4s', op:.90, sc:1.1 },
  { type:'dot',  w:5, h:5,  fill:'rgba(160,122,47,.88)',  left:'98%', top:'63%', rot:'0deg',   dur:'2.8s', delay:'-2.6s', op:.85, sc:.95 },
  // ── twigs
  { type:'twig', w:18,h:4,  fill:'rgba(162,120,50,.85)',  left:'15%', top:'43%', rot:'16deg',  dur:'4.8s', delay:'-1.3s', op:.82, sc:1.0 },
  { type:'twig', w:14,h:3,  fill:'rgba(145,108,42,.82)',  left:'51%', top:'83%', rot:'-10deg', dur:'4.5s', delay:'-3.8s', op:.78, sc:.9  },
  { type:'twig', w:16,h:4,  fill:'rgba(155,115,46,.84)',  left:'77%', top:'46%', rot:'22deg',  dur:'5.0s', delay:'-0.9s', op:.80, sc:1.0 },
];

function FloatingBotanicals() {
  return (
    <div className="floaters">
      {SCATTERED.map((f, i) => (
        <div key={i} className="floater" style={{
          left: f.left,
          top:  f.top,
          '--dur':   f.dur,
          '--delay': f.delay,
          '--rot':   f.rot,
          '--sc':    f.sc,
          '--op':    f.op,
        }}>
          <FloatShape type={f.type} w={f.w} h={f.h} fill={f.fill}/>
        </div>
      ))}
    </div>
  );
}

export default function FacebookWoodButton({
  facebookUrl = "https://www.facebook.com/profile.php?id=61573723094947",
}) {
  const [particles, setParticles] = useState([]);

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
      <div style={{ display:'flex', justifyContent:'center', margin:'48px 0' }}>
        <button className="fb-btn" onClick={handleClick} type="button">

          <div className="wood-bg"/>
          <div className="wood-midlight"/>
          <WoodGrain/>
          <div className="wood-vignette"/>
          <div className="wood-lacquer"/>
          <div className="wood-border"/>
          <FloatingBotanicals/>

          {particles.map(p => {
            const rad = (p.angle * Math.PI) / 180;
            return (
              <div key={p.id} className="particle" style={{
                top:'50%', left:'50%',
                background: p.color,
                boxShadow: `0 0 5px ${p.color}`,
                '--px': `${Math.cos(rad) * p.dist}px`,
                '--py': `${Math.sin(rad) * p.dist}px`,
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
