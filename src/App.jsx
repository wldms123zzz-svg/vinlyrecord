import { useState, useRef, useCallback, useEffect } from "react";

/* ─── CONSTANTS ─── */
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const MONTHS_KR = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const MOODS = ["몽롱","설렘","쓸쓸","따뜻","날카로움","평온","두근","공허","충만"];
const BG = "#16181A";
const CREAM = "#EAECEF";
const DARK = "#1F2226";
const PAPER = "#F0F3F7";
const BURGUNDY = "#7A1C25";

// 12 spines: step from very light grey to medium-dark, evenly spaced
const SPINE_COLORS = Array.from({length:12}, (_,i) => {
const t = i / 11; // 0 → 1
const light = [205, 210, 215];
const dark  = [100, 105, 110];
const r = Math.round(light[0] + (dark[0]-light[0])*t);
const g = Math.round(light[1] + (dark[1]-light[1])*t);
const b = Math.round(light[2] + (dark[2]-light[2])*t);
return `rgb(${r},${g},${b})`;
});
const ACCENTS = [
"#949ca3","#8a939a","#808991","#768088",
"#6c767f","#626d76","#58636d","#4e5a64",
"#44505b","#3a4752","#303d49","#263440",
];

/* ─── EMPTY INITIAL DATA ─── */
const INIT_DATA = {};

/* ─── VINYL SVG ─── */
function VinylSVG({ spineColor, accent, size = 200 }) {
const cx = size / 2;
const id = `vg-${size}-${spineColor.replace("#","")}`;
return (
<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display:"block" }}>
<defs>
<radialGradient id={id} cx="50%" cy="50%" r="50%">
<stop offset="0%" stopColor={spineColor} />
<stop offset="30%" stopColor="#0D1217" />
<stop offset="100%" stopColor="#06080A" />
</radialGradient>
</defs>
<circle cx={cx} cy={cx} r={cx-2} fill={`url(#${id})`} />
<circle cx={cx} cy={cx} r={cx-2} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
{Array.from({length:10}).map((_,i) => (
<circle key={i} cx={cx} cy={cx} r={(cx-10)*(1-i*0.082)}
fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.6" />
))}
<circle cx={cx} cy={cx} r={cx*0.26} fill={spineColor} opacity="0.9" />
<circle cx={cx} cy={cx} r={cx*0.20} fill={spineColor} opacity="0.5" />
<circle cx={cx} cy={cx} r={cx*0.032} fill="#16181A" />
<ellipse cx={cx*0.7} cy={cx*0.5} rx={cx*0.2} ry={cx*0.09}
fill="rgba(255,255,255,0.03)" transform={`rotate(-35 ${cx} ${cx})`} />
</svg>
);
}

/* ─── GRAYSCALE IMAGE with sepia tint ─── */
function GrayscaleImg({ src, style }) {
return (
<img src={src} alt="" style={{
...style,
objectFit: "cover",
}} />
);
}

/* ─── RECORD SPINE ─── */
function spineTextColor(spineColor) {
const m = spineColor.match(/rgb\((\d+),(\d+),(\d+)\)/);
if (!m) return "rgba(255,255,255,0.6)";
const lum = 0.299*+m[1] + 0.587*+m[2] + 0.114*+m[3];
return lum > 140 ? "rgba(40,45,50,0.5)" : "rgba(255,255,255,0.65)";
}

function RecordSpine({ monthIdx, hasRecord, isOpen, onClick, spineColor }) {
const [hov, setHov] = useState(false);
const txtColor = spineTextColor(spineColor);
return (
<div onClick={onClick}
onMouseEnter={() => setHov(true)}
onMouseLeave={() => setHov(false)}
style={{
width: 22, height: 340,
cursor: "pointer", flexShrink: 0,
transform: isOpen ? "translateY(-18px)" : hov ? "translateY(-6px)" : "translateY(0)",
transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
position: "relative",
}}>
<div style={{
width: "100%", height: "100%",
background: hasRecord ? spineColor : "#E2E5EA",
borderRadius: "3px 3px 1px 1px",
boxShadow: isOpen
? `0 -12px 30px rgba(0,0,0,0.1), 0 -4px 12px rgba(0,0,0,0.06)`
: hov ? "0 -6px 14px rgba(0,0,0,0.06)" : "1px 0 3px rgba(0,0,0,0.03)",
border: isOpen ? `1px solid rgba(0,0,0,0.12)` : "1px solid rgba(0,0,0,0.04)",
transition: "all 0.25s ease",
position: "relative", overflow: "hidden",
}}>
{hasRecord && <>
{[0.25,0.5,0.75].map(p => (
<div key={p} style={{
position:"absolute", top:`${p*100}%`, left:3, right:3,
height:"0.5px", background:"rgba(255,255,255,0.22)",
}}/>
))}
<div style={{
position:"absolute", top:9, left:"50%", transform:"translateX(-50%)",
width:5, height:5, borderRadius:"50%",
background: BURGUNDY, opacity:0.8,
}}/>
<div style={{
position:"absolute", top:26, left:"50%",
transform:"translateX(-50%) rotate(90deg)",
transformOrigin:"center center",
whiteSpace:"nowrap", color: txtColor,
fontSize:7.5, fontFamily:"'Space Mono', monospace",
letterSpacing:1.8, width:200, textAlign:"left",
overflow:"hidden", textOverflow:"ellipsis",
pointerEvents:"none",
}}>
{MONTHS[monthIdx]}
</div>
</>}
{!hasRecord && (
<div style={{
position:"absolute", top:"50%", left:"50%",
transform:"translate(-50%,-50%) rotate(90deg)",
color:"#A5ACB5", fontSize:7, fontFamily:"'Space Mono', monospace",
letterSpacing:1, pointerEvents:"none",
}}>{MONTHS[monthIdx]}</div>
)}
</div>
</div>
);
}

/* ─── SHARE CARD — captures the live sleeve+vinyl view ─── */
function ShareCard({ shareRef, onClose }) {
const [saving, setSaving] = useState(false);
const [dataUrl, setDataUrl] = useState(null);

async function capture() {
setSaving(true);
try {
// dynamic import html2canvas from CDN via script tag
if (!window.html2canvas) {
await new Promise((res, rej) => {
const s = document.createElement("script");
s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
s.onload = res; s.onerror = rej;
document.head.appendChild(s);
});
}
const canvas = await window.html2canvas(shareRef.current, {
scale: 3,
useCORS: true,
backgroundColor: PAPER,
logging: false,
});
setDataUrl(canvas.toDataURL("image/png"));
} catch(e) {
console.error(e);
}
setSaving(false);
}

return (
<div style={{
position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center",
padding:20,
}}>
<div style={{
background:"#fff", borderRadius:16, overflow:"hidden",
width:"100%", maxWidth:400,
boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
}}>
<div style={{ background:BG, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
<span style={{ color:CREAM, fontSize:11, letterSpacing:3, fontFamily:"'Space Mono', monospace" }}>SHARE</span>
<button onClick={onClose} style={{ background:"none", border:"none", color:CREAM, fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
</div>
<div style={{ padding:20 }}>
{!dataUrl ? (
<>
<div style={{ fontSize:10, color:"#aaa", textAlign:"center", marginBottom:16, fontFamily:"'Space Mono', monospace", letterSpacing:1 }}>
현재 커버 화면을 이미지로 저장합니다
</div>
<button onClick={capture} disabled={saving}
style={{ width:"100%", padding:13, background:BG, border:"none", borderRadius:8, color:CREAM, fontSize:11, letterSpacing:3, cursor:"pointer", fontFamily:"'Space Mono', monospace" }}>
{saving ? "생성 중..." : "카드 생성하기"}
</button>
</>
) : (
<>
<img src={dataUrl} alt="share" style={{ width:"100%", borderRadius:8, marginBottom:14, boxShadow:"0 4px 20px rgba(0,0,0,0.15)" }} />
<a href={dataUrl} download="vinyl-diary.png"
style={{ display:"block", width:"100%", padding:13, background:BG, borderRadius:8, color:CREAM, fontSize:11, letterSpacing:3, textDecoration:"none", fontFamily:"'Space Mono', monospace", textAlign:"center" }}>
이미지 저장하기
</a>
</>
)}
</div>
</div>
</div>
);
}

/* ─── DRAGGABLE TEXT OVERLAY ─── */
function DraggableText({ text, color, containerSize, position, scale=1, rotation=0, onMove, editing }) {
const dragStart = useRef(null);

function onPointerDown(e) {
if (!editing) return;
e.stopPropagation();
dragStart.current = { px: e.clientX, py: e.clientY, ox: position.x, oy: position.y };
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
}
function onPointerMove(e) {
if (!dragStart.current) return;
const dx = e.clientX - dragStart.current.px;
const dy = e.clientY - dragStart.current.py;
onMove({
x: Math.max(0, Math.min(100, dragStart.current.ox + (dx / containerSize.w) * 100)),
y: Math.max(0, Math.min(100, dragStart.current.oy + (dy / containerSize.h) * 100)),
});
}
function onPointerUp() {
dragStart.current = null;
window.removeEventListener("pointermove", onPointerMove);
window.removeEventListener("pointerup", onPointerUp);
}

if (!text) return null;
return (
<div
onPointerDown={onPointerDown}
style={{
position:"absolute",
left:`${position.x}%`,
top:`${position.y}%`,
transform:`translate(-50%,-50%) scale(${scale})`,
cursor: editing ? "grab" : "default",
userSelect:"none",
touchAction:"none",
padding:"4px 2px",
border: editing ? "1px dashed rgba(255,255,255,0.4)" : "none",
borderRadius:3,
maxWidth:"85%",
zIndex:10,
}}>
<div style={{
fontSize: text.length > 30 ? 13 : text.length > 15 ? 17 : 22,
fontWeight:"bold",
color: color || "#1a1a1a",
lineHeight:1.25,
letterSpacing:-0.3,
fontFamily:"'Space Mono', monospace",
wordBreak:"break-word",
whiteSpace:"pre-wrap",
transform: `skewX(${-rotation}deg)`,
}}>
{text}
</div>
{editing && (
<div style={{ fontSize:7, color:"rgba(255,255,255,0.5)", textAlign:"center", marginTop:3, letterSpacing:1 }}>
드래그로 이동
</div>
)}
</div>
);
}

/* ─── RECORD DETAIL ─── */
function RecordDetail({ record, monthLabel, yearLabel, onBack, onSave, initialEdit }) {
const [spinning, setSpinning] = useState(false);
const [viewMode, setViewMode] = useState("vinyl");
const [editing, setEditing] = useState(initialEdit || !record.song);
const [form, setForm] = useState({
song:   record.song   || "",
artist: record.artist || "",
diary:  record.diary  || "",
photo:  record.photo  || null,
coverText:      record.coverText      || "",
coverTextColor: record.coverTextColor || "#261F18",
showCoverText:  record.showCoverText  !== false,
showPhoto:      record.showPhoto      !== false,
textPos:        record.textPos        || { x: 15, y: 75 },
textSize:       record.textSize       || 1,
textRotate:     record.textRotate     || 0,
});
const [showShare, setShowShare] = useState(false);
const fileRef  = useRef();
const shareRef = useRef();   // ← capture target
const sleeveRef = useRef();  // for drag container size
const spineColor = record._spineColor || SPINE_COLORS[0];
const accent     = record._accent     || ACCENTS[0];

function handlePhoto(e) {
const file = e.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = ev => {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    let w = img.width;
    let h = img.height;
    if (w > 1200) { h = Math.round(h * 1200 / w); w = 1200; }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.filter = 'grayscale(100%) sepia(20%) brightness(0.85) contrast(1.1)';
    ctx.drawImage(img, 0, 0, w, h);
    setForm(f => ({ ...f, photo: canvas.toDataURL("image/jpeg", 0.85), showPhoto: true }));
  };
  img.src = ev.target.result;
};
reader.readAsDataURL(file);
}

function handleSave() { onSave(form); setEditing(false); }

const d = editing ? form : record;
const hasPhoto = d.photo && d.showPhoto !== false;
const hasText  = d.coverText && d.showCoverText !== false;
const textPos  = d.textPos || { x: 15, y: 75 };

const TEXT_COLORS = [
{ label:"검정", value:"#1a1a1a" },
{ label:"흰색", value:"#ffffff" },
{ label:"크림", value:"#F2EBD5" },
];

return (
<div style={{ minHeight:"100vh", background:PAPER, fontFamily:"'Space Mono', monospace" }}>
<style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} } @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>

  {/* ── HEADER ── */}
  <div style={{ background:"transparent", borderBottom:"1px solid rgba(0,0,0,0.06)", padding:"20px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
    <button onClick={onBack} style={{ background:"none", border:"none", color:DARK, fontSize:11, letterSpacing:2, cursor:"pointer", fontFamily:"'Space Mono', monospace", padding:0 }}>
      ← BACK
    </button>
    <div style={{ color:DARK, fontSize:11, letterSpacing:3, opacity:0.6, fontFamily:"'Space Mono', monospace" }}>{yearLabel} <span style={{color:BURGUNDY}}>·</span> {monthLabel}</div>
    <div style={{ display:"flex", gap:12 }}>
      <button onClick={() => setViewMode(v => v === "vinyl" ? "polaroid" : "vinyl")} style={{ background:"transparent", border:"1px solid #ddd", color:DARK, fontSize:9, letterSpacing:2, cursor:"pointer", padding:"6px 12px", borderRadius:0, fontFamily:"'Space Mono', monospace" }}>
        {viewMode === "vinyl" ? "폴라로이드" : "바이닐"}
      </button>
      <button onClick={() => setEditing(e => !e)} style={{ background:"transparent", border:"1px solid #ddd", color:DARK, fontSize:9, letterSpacing:2, cursor:"pointer", padding:"6px 12px", borderRadius:0, fontFamily:"'Space Mono', monospace" }}>
        {editing ? "보기" : "편집"}
      </button>
      {!editing && (record.song || record.diary) && (
        <button onClick={() => setShowShare(true)} style={{ background:DARK, border:"none", color:"#fff", fontSize:9, letterSpacing:2, cursor:"pointer", padding:"6px 12px", borderRadius:0, fontFamily:"'Space Mono', monospace" }}>공유</button>
      )}
    </div>
  </div>

  <div style={{ padding:"28px 20px 48px", animation:"fadeUp 0.3s ease" }}>

    {/* ── ALBUM SLEEVE — this whole block is captured for sharing ── */}
    {viewMode === "polaroid" ? (
      <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
        <div ref={shareRef} style={{ display:"flex", flexDirection:"column", alignItems:"center", background:"#fff", padding:"16px 16px 40px 16px", boxShadow:"0 8px 30px rgba(0,0,0,0.12)" }}>
          {/* Photo */}
          <div style={{ width: 280, height: 280, background: hasPhoto ? "#111" : "#e8e5e0", overflow:"hidden" }}>
            {hasPhoto ? (
              <GrayscaleImg src={d.photo} style={{ width:"100%", height:"100%" }} />
            ) : (
              <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ color:"#A5ACB5", fontSize:10, letterSpacing:2 }}>사진 비어있음</span>
              </div>
            )}
          </div>
          
          {/* Diary & Date */}
          {(!editing) && (d.diary || yearLabel) && (
            <div style={{ marginTop: 24, textAlign: "center", maxWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
              {d.diary && (
                <div style={{ fontSize: 13, color: DARK, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>
                  {d.diary}
                </div>
              )}
              <div style={{ fontSize: 10, color: "#aaa", letterSpacing: 2, fontFamily: "'Courier New',monospace" }}>
                {yearLabel} · {monthLabel}
              </div>
            </div>
          )}
        </div>
      </div>
    ) : (
    <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
      <div ref={shareRef} style={{ display:"inline-flex", flexDirection:"column", alignItems:"center", position:"relative", background:PAPER, padding:"40px 40px 30px 40px" }}>
        
        {/* Cover + Vinyl Wrapper */}
        <div style={{ display:"flex", alignItems:"center", position:"relative", paddingRight: 110 }}>
          {/* Vinyl peeking right */}
          <div onClick={() => setSpinning(s => !s)} style={{
            position:"absolute", right:0, top:"50%", transform:"translateY(-50%)",
            borderRadius:"50%", cursor:"pointer", zIndex:1,
            animation: spinning ? "spin 3.5s linear infinite" : "none",
            boxShadow: spinning ? "0 0 28px rgba(0,0,0,0.5)" : "4px 0 20px rgba(0,0,0,0.35)",
            transition:"box-shadow 0.3s",
          }}>
            <VinylSVG spineColor={spineColor} accent={accent} size={210} />
          </div>

          {/* Sleeve */}
          <div ref={sleeveRef} style={{
        width:260, height:260, background: hasPhoto ? "#0D1217" : CREAM,
        borderRadius:4, position:"relative", zIndex:2, overflow:"hidden", flexShrink:0,
        boxShadow:"0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08), 2px 2px 0 rgba(0,0,0,0.04)",
      }}>
        {/* Photo layer */}
        {hasPhoto && (
          <GrayscaleImg src={d.photo} style={{ width:"100%", height:"100%", position:"absolute", inset:0 }} />
        )}

        {/* Gradient under text when photo present */}
        {hasPhoto && hasText && (
          <div style={{ position:"absolute", inset:0, pointerEvents:"none",
            background:"linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)" }} />
        )}

        {/* Draggable text overlay */}
        {hasText && (
          <DraggableText
            text={d.coverText}
            color={d.coverTextColor || "#1a1a1a"}
            containerSize={{ w: sleeveRef.current?.offsetWidth || 260, h: sleeveRef.current?.offsetHeight || 260 }}
            position={textPos}
            scale={d.textSize}
            rotation={d.textRotate}
            editing={editing}
            onMove={pos => setForm(f => ({ ...f, textPos: pos }))}
          />
        )}

        {/* Empty state */}
        {!hasPhoto && !hasText && (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"#A5ACB5", fontSize:10, letterSpacing:2 }}>커버 비어있음</span>
          </div>
        )}

        {/* Gloss overlay */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%, rgba(0,0,0,0.04) 100%)" }}/>
      </div>
        </div>

        {/* Diary & Date below */}
        {(!editing) && (d.diary || yearLabel) && (
          <div style={{ marginTop: 40, textAlign: "center", maxWidth: 320, display: "flex", flexDirection: "column", gap: 16 }}>
            {d.diary && (
              <div style={{ fontSize: 13, color: DARK, lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "keep-all" }}>
                {d.diary}
              </div>
            )}
            <div style={{ fontSize: 10, color: "#aaa", letterSpacing: 2, fontFamily: "'Courier New',monospace" }}>
              {yearLabel} · {monthLabel}
            </div>
          </div>
        )}

      </div>
    </div>
    )}

    {/* Song + artist below sleeve */}
    <div style={{ textAlign:"center", marginBottom:8 }}>
      <div style={{ fontSize:15, fontWeight:"bold", color:DARK, lineHeight:1.3 }}>{d.song || "—"}</div>
      <div style={{ fontSize:11, color:`${DARK}77`, marginTop:3 }}>{d.artist}</div>
    </div>

    {/* Spin hint */}
    <div style={{ textAlign:"center", marginBottom:32, fontSize:9, color:"#bbb", letterSpacing:2 }}>
      {spinning ? "▶  재생 중 — 판을 탭해서 멈추기" : "판을 탭하면 돌아가요"}
    </div>

    {/* ── EDIT MODE ── */}
    {editing && (<>

      {/* Song / Artist */}
      <div style={{ background:"transparent", marginBottom:32 }}>
        <input value={form.song}
          onChange={e => setForm(f=>({...f,song:e.target.value}))}
          placeholder="노래 제목"
          style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(0,0,0,0.1)", color:DARK, fontSize:18, fontWeight:"600", fontFamily:"'Noto Serif KR', serif", padding:"8px 0", outline:"none", width:"100%", marginBottom:8 }}/>
        <input value={form.artist}
          onChange={e => setForm(f=>({...f,artist:e.target.value}))}
          placeholder="아티스트명"
          style={{ background:"transparent", border:"none", borderBottom:"1px solid rgba(0,0,0,0.06)", color:`${DARK}99`, fontSize:14, fontFamily:"'Noto Serif KR', serif", padding:"8px 0", outline:"none", width:"100%" }}/>
      </div>

      {/* COVER PHOTO */}
      <div style={{ background:"#fff", border:"1px solid #e4e2dc", borderRadius:10, padding:"18px", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:8, letterSpacing:4, color:"#bbb" }}>COVER PHOTO</div>
          {form.photo && (
            <button onClick={() => setForm(f=>({...f, showPhoto: !f.showPhoto }))}
              style={{ background:"none", border:"none", fontSize:9, color: form.showPhoto ? BG : "#bbb", cursor:"pointer", letterSpacing:1, fontFamily:"'Space Mono', monospace" }}>
              {form.showPhoto ? "✓ 표시중" : "숨김"}
            </button>
          )}
        </div>

        {form.photo ? (
          <div style={{ position:"relative", borderRadius:6, overflow:"hidden", marginBottom:10 }}>
            <GrayscaleImg src={form.photo} style={{ width:"100%", height:140 }} />
            <div style={{ position:"absolute", inset:0, display:"flex", gap:8, alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.35)" }}>
              <button onClick={() => fileRef.current?.click()}
                style={{ background:"rgba(255,255,255,0.9)", border:"none", borderRadius:6, padding:"6px 14px", fontSize:10, cursor:"pointer", fontFamily:"'Space Mono', monospace" }}>사진 변경</button>
              <button onClick={() => setForm(f=>({...f, photo:null, showPhoto:false }))}
                style={{ background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.5)", borderRadius:6, padding:"6px 14px", fontSize:10, color:"#fff", cursor:"pointer", fontFamily:"'Space Mono', monospace" }}>삭제</button>
            </div>
          </div>
        ) : (
          <div onClick={() => fileRef.current?.click()} style={{
            height:120, background:"#EAECEF", borderRadius:6, border:"1.5px dashed #C4CAD2",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            gap:6, cursor:"pointer",
          }}>
            <span style={{ fontSize:26, lineHeight:1, color:"#A5ACB5" }}>+</span>
            <span style={{ fontSize:9, letterSpacing:2, color:"#A5ACB5", fontFamily:"'Space Mono', monospace" }}>사진 추가</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto} />
        <div style={{ fontSize:8, color:"#ccc", marginTop:6 }}>* 흑백 세피아 필터로 변환됩니다</div>
      </div>

      {/* COVER TEXT */}
      {viewMode === "vinyl" && (
      <div style={{ background:"#fff", border:"1px solid #e4e2dc", borderRadius:10, padding:"18px", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:8, letterSpacing:4, color:"#bbb" }}>COVER TEXT</div>
          {form.coverText && (
            <button onClick={() => setForm(f=>({...f, showCoverText: !f.showCoverText }))}
              style={{ background:"none", border:"none", fontSize:9, color: form.showCoverText ? BG : "#bbb", cursor:"pointer", letterSpacing:1, fontFamily:"'Space Mono', monospace" }}>
              {form.showCoverText ? "✓ 표시중" : "숨김"}
            </button>
          )}
        </div>

        <textarea value={form.coverText}
          onChange={e => setForm(f=>({...f, coverText:e.target.value, showCoverText:true }))}
          placeholder="커버에 올릴 글을 입력하세요..."
          rows={3}
          style={{ width:"100%", background:"#F4F6F9", border:"1px solid #DFE3E8", borderRadius:6, padding:"10px 12px", color:DARK, fontSize:13, fontFamily:"'Space Mono', monospace", lineHeight:1.7, resize:"none", outline:"none", marginBottom:12 }}/>

        {/* Color picker */}
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom: form.coverText ? 12 : 0 }}>
          <span style={{ fontSize:8, letterSpacing:2, color:"#bbb" }}>글자 색상</span>
          {TEXT_COLORS.map(tc => (
            <button key={tc.value} onClick={() => setForm(f=>({...f, coverTextColor: tc.value }))}
              style={{
                width:26, height:26, borderRadius:"50%",
                background: tc.value,
                border: form.coverTextColor===tc.value ? `2.5px solid ${BURGUNDY}` : "2px solid #ddd",
                cursor:"pointer",
                boxShadow: tc.value==="#ffffff" ? "inset 0 0 0 1px #ddd" : "none",
              }}/>
          ))}
          {form.coverText && (
            <button onClick={() => setForm(f=>({...f, coverText:"", showCoverText:false }))}
              style={{ marginLeft:"auto", background:"none", border:"none", fontSize:9, color:"#bbb", cursor:"pointer", fontFamily:"'Space Mono', monospace", letterSpacing:1 }}>
              텍스트 삭제
            </button>
          )}
        </div>
        {form.coverText && (
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <span style={{ fontSize:8, letterSpacing:2, color:"#bbb" }}>크기</span>
            <input type="range" min="0.5" max="3" step="0.1" value={form.textSize || 1} onChange={e => setForm(f=>({...f, textSize: parseFloat(e.target.value)}))} style={{ width:"30%" }} />
            <span style={{ fontSize:8, letterSpacing:2, color:"#bbb", marginLeft:"auto" }}>글씨 기울기</span>
            <input type="range" min="-45" max="45" step="1" value={form.textRotate || 0} onChange={e => setForm(f=>({...f, textRotate: parseInt(e.target.value)}))} style={{ width:"30%" }} />
          </div>
        )}
      </div>
      )}

      {/* DIARY */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:9, letterSpacing:4, color:"#999", marginBottom:12, fontFamily:"'Space Mono', monospace" }}>DIARY</div>
        <textarea value={form.diary}
          onChange={e => setForm(f=>({...f,diary:e.target.value}))}
          placeholder="이 노래를 들으며 무슨 생각을 했나요..."
          rows={5}
          style={{ width:"100%", background:"transparent", border:"1px solid rgba(0,0,0,0.1)", borderRadius:0, padding:"16px", color:DARK, fontSize:14, fontFamily:"'Noto Serif KR', serif", lineHeight:1.9, resize:"none", outline:"none" }}/>
      </div>

      <button onClick={handleSave} disabled={!form.song.trim()}
        style={{ width:"100%", padding:16, background: form.song.trim() ? DARK : "#D6DBE1", border:"none", borderRadius:0, color: form.song.trim() ? "#fff" : "#999", fontSize:12, letterSpacing:4, cursor: form.song.trim() ? "pointer" : "default", fontFamily:"'Space Mono', monospace" }}>
        저장하기
      </button>
    </>)}

    {!editing && record.song && (
      <button onClick={() => setEditing(true)} style={{ width:"100%", padding:16, background: "#EAECEF", border:"1px solid #C4CAD2", borderRadius:0, color: DARK, fontSize:12, letterSpacing:4, cursor: "pointer", fontFamily:"'Space Mono', monospace", marginTop: 24 }}>
        이 기록 수정하기
      </button>
    )}
  </div>

  {showShare && (
    <ShareCard shareRef={shareRef} onClose={() => setShowShare(false)} />
  )}
</div>
);
}

/* ─── YEAR DRAWER (month spines) ─── */
function YearDrawer({ year, data, onBack, onSelectMonth }) {
const [openMonth, setOpenMonth] = useState(null);
const yearData = data[year] || {};

function toggleMonth(m) {
if (openMonth === m) setOpenMonth(null);
else setOpenMonth(m);
}

const openRecord = openMonth !== null ? (yearData[openMonth] || {}) : null;

return (
<div style={{ minHeight:"100vh", background:PAPER, fontFamily:"'Space Mono', monospace" }}>
<style>{`@keyframes popIn { from{opacity:0;transform:scale(0.94) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} } @keyframes fadeDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} } ::-webkit-scrollbar { height:3px; } ::-webkit-scrollbar-thumb { background:#ddd; }`}</style>

  {/* Header */}
  <div style={{
    padding:"28px 22px 18px",
    display:"flex", alignItems:"flex-end", justifyContent:"space-between",
    borderBottom:"1px solid #DFE3E8",
  }}>
    <div>
      <button onClick={onBack} style={{
        background:"none", border:"none", color:"#aaa",
        fontSize:9, letterSpacing:4, cursor:"pointer",
        fontFamily:"'Space Mono', monospace", padding:0, marginBottom:16, display:"block",
      }}>← 연도</button>
      <div style={{ fontSize:18, fontWeight:800, letterSpacing:"-0.5px", color:DARK, marginBottom:2, fontFamily:"system-ui, -apple-system, sans-serif" }}>VINYL DIARY</div>
      <div style={{ fontSize:24, fontWeight:"bold", color:"#888", letterSpacing:-1, fontFamily:"'Space Mono', monospace" }}>{year}</div>
    </div>
    <div style={{ fontSize:9, color:"#bbb", letterSpacing:2 }}>
      {Object.keys(yearData).length}장 기록됨
    </div>
  </div>

  {/* THE SHELF */}
  <div style={{ padding:"16px 16px 0" }}>
    <div style={{ height:5, background:"#A9B0BA", borderRadius:"3px 3px 0 0", boxShadow:"0 1px 0 rgba(0,0,0,0.1)" }}/>
    <div style={{
      background:"#fff", border:"1px solid #DFE3E8", borderTop:"none",
      padding:"0 12px", overflowX:"auto",
    }}>
      <div style={{
        display:"flex", gap:6,
        alignItems:"flex-end",
        minHeight:360,
        paddingBottom:18, paddingTop:24,
      }}>
        {Array.from({length:12},(_,i)=>i+1).map(m => {
          const hasRec = !!yearData[m];
          const colIdx = (m-1) % SPINE_COLORS.length;
          return (
            <RecordSpine key={m}
              monthIdx={m-1}
              hasRecord={hasRec}
              isOpen={openMonth===m}
              onClick={() => hasRec ? toggleMonth(m) : onSelectMonth(m, false)}
              spineColor={SPINE_COLORS[colIdx]}
              accent={ACCENTS[colIdx]}
            />
          );
        })}
      </div>
    </div>
    <div style={{ height:12, background:"#A9B0BA", borderRadius:"0 0 5px 5px", boxShadow:"0 4px 10px rgba(0,0,0,0.1)" }}/>
  </div>

  {/* Open record preview */}
  {openMonth !== null && (
    <div key={openMonth} style={{
      margin:"16px 16px 0",
      background:"#fff", border:"1px solid #DFE3E8",
      borderRadius:12, overflow:"hidden",
      boxShadow:"0 10px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
      animation:"popIn 0.28s cubic-bezier(0.34,1.4,0.64,1)",
    }}>
      <div style={{ height:3, background:`linear-gradient(90deg, ${BG}, ${SPINE_COLORS[(openMonth-1)%SPINE_COLORS.length]})` }}/>

      <div style={{ padding:"18px 20px", display:"flex", gap:16, alignItems:"center" }}>
        <div style={{
          borderRadius:"50%",
          boxShadow:"0 3px 14px rgba(0,0,0,0.2)",
          flexShrink:0,
        }}>
          <VinylSVG
            spineColor={SPINE_COLORS[(openMonth-1)%SPINE_COLORS.length]}
            accent={ACCENTS[(openMonth-1)%ACCENTS.length]}
            size={100}
          />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:9, letterSpacing:3, color:"#bbb", marginBottom:6 }}>
            {year} · {MONTHS_KR[openMonth-1]}
          </div>
          <div style={{ fontSize:15, fontWeight:"bold", color:"#1a1a1a", marginBottom:3,
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {openRecord.song || "—"}
          </div>
          <div style={{ fontSize:11, color:"#999", marginBottom:10 }}>
            {openRecord.artist}
          </div>
          {openRecord.mood && (
            <div style={{
              display:"inline-block", padding:"3px 12px", borderRadius:20,
              background:`${BG}18`, border:`1px solid ${BG}44`,
              color:DARK, fontSize:10,
            }}>{openRecord.mood}</div>
          )}
        </div>
      </div>

      {openRecord.diary && (
        <div style={{ margin:"0 20px 16px", padding:"12px 14px",
          background:"#F4F6F9", borderRadius:8, borderLeft:`3px solid ${BURGUNDY}99` }}>
          <div style={{ fontSize:11, color:"#666", lineHeight:1.8 }}>
            {openRecord.diary.length > 80 ? openRecord.diary.slice(0,80)+"..." : openRecord.diary}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onSelectMonth(openMonth, true)} style={{
          flex:1, padding:"12px",
          background:BURGUNDY, border:"none",
          color:CREAM, fontSize:10, letterSpacing:3,
          cursor:"pointer", fontFamily:"'Space Mono', monospace",
        }}>
          자세히 보기
        </button>
        <button onClick={() => onSelectMonth(openMonth, true, true)} style={{
          flex:1, padding:"12px",
          background:"#fff", border:`1px solid ${BURGUNDY}`,
          color:BURGUNDY, fontSize:10, letterSpacing:3,
          cursor:"pointer", fontFamily:"'Space Mono', monospace",
        }}>
          편집하기
        </button>
      </div>
    </div>
  )}

  {/* Add new month button */}
  <div style={{ padding:"16px 16px 40px" }}>
    <div style={{ fontSize:8, color:"#ccc", letterSpacing:2, marginBottom:10, textAlign:"center" }}>
      비어있는 달을 눌러 기록을 추가하세요
    </div>
    <button onClick={() => {
      const empty = Array.from({length:12},(_,i)=>i+1).find(m => !yearData[m]);
      if (empty) onSelectMonth(empty, false);
    }} style={{
      width:"100%", padding:"12px",
      background:"transparent", border:"1.5px dashed #C4CAD2",
      borderRadius:8, color:"#A5ACB5", fontSize:10,
      cursor:"pointer", fontFamily:"'Space Mono', monospace", letterSpacing:4,
    }}>+ 새 달 기록하기</button>
  </div>
</div>
);
}

/* ─── YEAR GRID HOME ─── */
function YearGrid({ data, onSelectYear, onAddYear, onDeleteYear }) {
const years = Object.keys(data).map(Number).sort((a,b) => b - a);
const [deleteMode, setDeleteMode] = useState(false);

return (
<div style={{ minHeight:"100vh", background:PAPER, fontFamily:"'Space Mono', monospace" }}>
<style>{`@keyframes cardIn { from { opacity:0; transform:translateY(10px); } to   { opacity:1; transform:translateY(0); } }`}</style>

  {/* Top right: + and trash */}
  <div style={{
    display:"flex", justifyContent:"flex-end", alignItems:"center",
    padding:"40px 28px 0", gap:22,
  }}>
    {!deleteMode && (
      <button onClick={onAddYear} style={{
        background:"none", border:"none", cursor:"pointer",
        fontSize:30, color:"#1a1a1a", lineHeight:1, padding:0, fontWeight:200,
      }}>+</button>
    )}
    <button onClick={() => setDeleteMode(d => !d)} style={{
      background:"none", border:"none", cursor:"pointer", padding:0,
      color: deleteMode ? BG : "#1a1a1a",
    }}>
      {deleteMode ? (
        <span style={{ fontSize:11, letterSpacing:2, fontFamily:"'Space Mono', monospace", color:BG }}>취소</span>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      )}
    </button>
  </div>

  {/* Main title */}
  <div style={{ padding:"16px 28px 16px", fontSize:28, fontWeight:900, letterSpacing:"-1px", color:DARK, fontFamily:"system-ui, -apple-system, sans-serif" }}>
    VINYL DIARY
  </div>

  {/* 2-col grid */}
  <div style={{
    padding:"16px 16px 60px",
    display:"grid", gridTemplateColumns:"1fr 1fr", gap:14,
  }}>
    {years.map((y, yi) => {
      const yData = data[y] || {};

      return (
        <div key={y}
          onClick={() => deleteMode ? onDeleteYear(y) : onSelectYear(y)}
          style={{
            cursor:"pointer",
            animation:`cardIn 0.35s ease ${yi * 0.06}s both`,
            position:"relative",
          }}>

          {/* Delete badge */}
          {deleteMode && (
            <div style={{
              position:"absolute", top:-6, right:-6, zIndex:10,
              width:20, height:20, borderRadius:"50%",
              background:BG, color:CREAM,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:14, fontWeight:"bold", lineHeight:1,
              boxShadow:"0 2px 6px rgba(0,0,0,0.2)",
            }}>−</div>
          )}

          {/* Card */}
          <div style={{
            border:`1px solid ${deleteMode ? "#e0b0b0" : "#d8d4ce"}`,
            borderRadius:3,
            background: deleteMode ? "#fff8f8" : "#fff",
            aspectRatio:"4/3",
            overflow:"hidden",
            display:"flex",
            alignItems:"flex-end",
            padding:"10px 9px",
            transition:"border-color 0.2s, background 0.2s",
          }}
          onMouseEnter={e => { if (!deleteMode) e.currentTarget.style.borderColor="#aaa"; }}
          onMouseLeave={e => { if (!deleteMode) e.currentTarget.style.borderColor="#d8d4ce"; }}
          >
            <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:"78%" }}>
              {Array.from({length:12}, (_,i) => i+1).map(m => {
                const has = !!yData[m];
                return (
                  <div key={m} style={{
                    width: has ? 7 : 4,
                    height: has ? "85%" : "28%",
                    background: has ? SPINE_COLORS[(m-1)%SPINE_COLORS.length] : "#E2E5EA",
                    borderRadius:"1px 1px 0 0",
                    flexShrink:0,
                    alignSelf:"flex-end",
                  }}/>
                );
              })}
            </div>
          </div>

          {/* Year below */}
          <div style={{
            textAlign:"center", fontSize:11,
            color: deleteMode ? BG : "#999",
            letterSpacing:1, marginTop:7,
          }}>{y}</div>
        </div>
      );
    })}

    {/* Empty filler slots */}
    {!deleteMode && Array.from({ length: Math.max(0, 6 - years.length) }).map((_, i) => (
      <div key={`e-${i}`} onClick={i === 0 ? onAddYear : undefined} style={{ animation:`cardIn 0.35s ease ${(years.length+i)*0.06}s both`, cursor: i === 0 ? "pointer" : "default" }}>
        <div style={{ border:"1px solid #DFE3E8", borderRadius:3, background:"#F4F6F9", aspectRatio:"4/3", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {i === 0 && <span style={{ fontSize: 40, color: "#A5ACB5", fontWeight: "300" }}>+</span>}
        </div>
        <div style={{ height:26 }}/>
      </div>
    ))}
  </div>
</div>
);
}

/* ─── ROOT ─── */
export default function App() {
const [data, setData] = useState(() => {
  const saved = localStorage.getItem("vinyl-diary-data");
  return saved ? JSON.parse(saved) : INIT_DATA;
});

useEffect(() => {
  localStorage.setItem("vinyl-diary-data", JSON.stringify(data));
}, [data]);
const [screen, setScreen] = useState("home"); // home | year | detail
const [selectedYear, setSelectedYear] = useState(null);
const [selectedMonth, setSelectedMonth] = useState(null);
const [startEdit, setStartEdit] = useState(false);

function handleAddYear() {
const input = window.prompt("추가할 연도를 입력하세요 (예: 2024)");
if (!input) return;
const yr = parseInt(input, 10);
if (isNaN(yr)) {
  window.alert("올바른 연도를 입력해주세요.");
  return;
}
if (data[yr]) {
  window.alert("이미 존재하는 연도입니다.");
  return;
}
setData(d => ({ ...d, [yr]: {} }));
}

function handleSelectMonth(month, goDetail, isEdit = false) {
setSelectedMonth(month);
setStartEdit(isEdit);
setScreen("detail");
}

function handleSaveRecord(form) {
const colIdx = (selectedMonth-1) % SPINE_COLORS.length;
setData(d => ({
...d,
[selectedYear]: {
...d[selectedYear],
[selectedMonth]: {
...form,
_spineColor: SPINE_COLORS[colIdx],
_accent: ACCENTS[colIdx],
},
},
}));
}

function handleDeleteYear(y) {
if (!window.confirm(`${y}년 기록을 삭제할까요?`)) return;
setData(d => { const n ={...d}; delete n[y]; return n; });
}

if (screen === "home") {
return (
<YearGrid
data={data}
onSelectYear={y => { setSelectedYear(y); setScreen("year"); }}
onAddYear={handleAddYear}
onDeleteYear={handleDeleteYear}
/>
);
}

if (screen === "year") {
return (
<YearDrawer
year={selectedYear}
data={data}
onBack={() => setScreen("home")}
onSelectMonth={handleSelectMonth}
/>
);
}

if (screen === "detail") {
const record = (data[selectedYear]?.[selectedMonth]) || {};
const colIdx = (selectedMonth-1) % SPINE_COLORS.length;
const enriched = {
...record,
_spineColor: record._spineColor || SPINE_COLORS[colIdx],
_accent: record._accent || ACCENTS[colIdx],
};
return (
<RecordDetail
record={enriched}
monthLabel={MONTHS_KR[selectedMonth-1]}
yearLabel={String(selectedYear)}
onBack={() => setScreen("year")}
onSave={handleSaveRecord}
initialEdit={startEdit}
/>
);
}

return null;
}
