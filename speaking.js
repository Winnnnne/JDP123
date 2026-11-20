// Japanese Study — Speaking (nghe câu hỏi · từ khóa gợi ý · thi thử · luyện đọc)
// Dữ liệu: window.SP_DATA (speaking-data.js) — dựng từ bộ tài liệu SPEAKING - TEST (Speaking 4–7, Reading, Demo)
const SP=window.SP_DATA;
const SPS=Object.assign({rate:0.85,autoplay:true,hideText:false,furi:true,voiceURI:''},(()=>{try{return JSON.parse(localStorage.getItem('spSettings'))||{}}catch(e){return {}}})());
const spSave=()=>{try{localStorage.setItem('spSettings',JSON.stringify(SPS))}catch(e){}};
let spUnit=4;            // 4..7 hoặc 'all'
let spTimer=null,spToken=0;

/* ───────── Âm thanh (Text-to-Speech của trình duyệt) ───────── */
let _jaVoices=[];
function ttsLoad(){_jaVoices=('speechSynthesis'in window?speechSynthesis.getVoices():[]).filter(v=>/^ja/i.test(v.lang))}
if('speechSynthesis'in window){ttsLoad();speechSynthesis.onvoiceschanged=()=>{ttsLoad();const b=document.getElementById('spVoiceInfo');if(b)b.innerHTML=ttsStatus()}}
function ttsVoice(){
  if(SPS.voiceURI){const v=_jaVoices.find(v=>v.voiceURI===SPS.voiceURI);if(v)return v}
  return _jaVoices.find(v=>/kyoko|nanami|haruka|ayumi|o-ren|google/i.test(v.name))||_jaVoices[0]||null;
}
function ttsStatus(){
  if(!('speechSynthesis'in window))return '⚠️ Trình duyệt này không hỗ trợ phát âm. Hãy dùng Chrome, Edge hoặc Safari.';
  const v=ttsVoice();
  return v?`🔈 Giọng đọc: <b>${esc(v.name)}</b> (${esc(v.lang)})`:'⚠️ Thiết bị chưa có giọng tiếng Nhật — hãy cài thêm giọng Japanese trong cài đặt hệ thống (Ngôn ngữ / Giọng nói) rồi tải lại trang.';
}
function ttsClean(t){return String(t).replace(/～さん/g,'たなかさん').replace(/[～（）()＋]/g,'').replace(/\s+/g,'')}
function ttsSpeak(text,o={}){
  return new Promise(res=>{
    if(!('speechSynthesis'in window)){res(false);return}
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(ttsClean(text));
    u.lang='ja-JP';const v=ttsVoice();if(v)u.voice=v;u.rate=o.rate||SPS.rate;
    u.onend=()=>res(true);u.onerror=()=>res(false);
    setTimeout(()=>speechSynthesis.speak(u),60); // tránh lỗi mất tiếng khi cancel() rồi speak() liền nhau
  });
}
function ttsStop(){spToken++;if('speechSynthesis'in window)speechSynthesis.cancel()}
function spStopAll(){ttsStop();if(spTimer){clearInterval(spTimer);spTimer=null}}
function spSayEl(el){ttsSpeak(el.dataset.say)}

/* ───────── Tiện ích hiển thị ───────── */
const SP_ORDER={q:0,g:1,n:2,v:3,a:4};
const KIND_LABEL={q:'Từ để hỏi',g:'Mẫu câu',n:'Danh từ',v:'Động từ',a:'Tính từ'};
function sortKw(kw){return kw.map((k,i)=>({k,i})).sort((a,b)=>((SP_ORDER[a.k.k]<=1?0:1)-(SP_ORDER[b.k.k]<=1?0:1))||a.i-b.i).map(x=>x.k)}
function chipHTML(c,withTip){
  const show=c.b&&c.b!==c.m&&(c.k==='v'||c.k==='a'||/[一-龯]/.test(c.b))?`${esc(c.m)}<small> → ${esc(c.b)}</small>`:esc(c.m);
  const say=(c.k==='v'||c.k==='a')?c.b:c.m;
  return `<button class="kw kw-${c.k}" data-say="${esc(say)}" onclick="spSayEl(this)" title="Nhấn để nghe từ này"><span class="kw-w">${show}${c.reuse?'<i class="kw-re" title="Từ này nên dùng lại trong câu trả lời">↩</i>':''}</span><span class="kw-vi">${esc(c.vi)}</span>${withTip&&c.tip?`<span class="kw-tip">${esc(c.tip)}</span>`:''}</button>`;
}
function hlQuestion(it,on){
  const q=it.q;if(!on||!it.sp||!it.sp.length)return esc(q);
  const owner=[];it.sp.forEach(([p,l,k],i)=>{for(let j=p;j<p+l;j++)owner[j]={i,k}});
  let out='',k=0,open=null;
  for(const ch of q){
    const skip=/[\s\u3000、。？?]/.test(ch);
    const o=skip?null:owner[k];if(!skip)k++;
    const id=o?o.i:null;
    if(open!==id){if(open!==null)out+='</mark>';if(id!==null)out+=`<mark class="hl hl-${o.k}">`;open=id}
    out+=esc(ch);
  }
  if(open!==null)out+='</mark>';
  return out;
}
function spSettingsBar(){
  const rates=[[0.65,'🐢 Chậm'],[0.85,'Vừa'],[1,'Thường']];
  const voiceSel=_jaVoices.length>1?`<select class="sp-voice" onchange="spSetVoice(this.value)" aria-label="Chọn giọng">${_jaVoices.map(v=>`<option value="${esc(v.voiceURI)}" ${ttsVoice()&&ttsVoice().voiceURI===v.voiceURI?'selected':''}>${esc(v.name)}</option>`).join('')}</select>`:'';
  return `<div class="sp-settings"><div class="sp-set-row"><span class="muted">Tốc độ:</span>${rates.map(([r,l])=>`<button class="pill ${SPS.rate===r?'active':''}" onclick="spSetRate(${r})">${l}</button>`).join('')}${voiceSel}<label class="sp-check"><input type="checkbox" ${SPS.autoplay?'checked':''} onchange="spToggleAuto(this.checked)"> Tự phát khi chuyển câu</label></div><div class="sp-voice-info muted" id="spVoiceInfo">${ttsStatus()}</div></div>`;
}
function spSetRate(r){SPS.rate=r;spSave();renderSpeak()}
function spSetVoice(u){SPS.voiceURI=u;spSave();renderSpeak()}
function spToggleAuto(v){SPS.autoplay=v;spSave();renderSpeak()}
const unitName=u=>u==='all'?'Tất cả bài':'Bài '+u;
function unitTabs(){
  return `<div class="toolbar sp-units">${[4,5,6,7,'all'].map(u=>`<button class="pill ${String(spUnit)===String(u)?'active':''}" onclick="spPickUnit('${u}')">${u==='all'?'Tất cả':'Bài '+u}</button>`).join('')}</div>`;
}
function spPickUnit(u){spUnit=u==='all'?'all':Number(u);if(state.mode==='qa'){state.sec='all';spBuildList()}if(state.mode==='exam')state.exam=null;renderSpeak()}
function spModeTabs(){
  const t=(m,l,fn)=>`<button class="pill ${state.mode===m?'active':''}" onclick="${fn}">${l}</button>`;
  return `<div class="toolbar sp-tabs">${t('hub','🏠 Tổng quan','showSpeakHub()')}${t('qa','🎧 Nghe – nói',"openSpeak('qa')")}${t('list','📋 Danh sách',"openSpeak('list')")}${t('exam','⏱ Thi thử',"openSpeak('exam')")}${t('read','📖 Luyện đọc',"openSpeak('read')")}</div>`;
}
function unitItems(u){
  const units=u==='all'?[4,5,6,7]:[Number(u)];
  const out=[];
  units.forEach(n=>SP.units[n].sections.forEach((s,si)=>s.items.forEach((it,k)=>out.push({it,sec:s,si,unit:n,n:k}))));
  return out;
}

/* ───────── Điều hướng ───────── */
function showSpeakHub(){state=freshState({type:'speak',mode:'hub'});renderSpeak();scrollTo(0,0)}
function openSpeak(mode,unit,extra){
  if(unit!==undefined&&unit!==null)spUnit=unit==='all'?'all':Number(unit);
  state=freshState(Object.assign({type:'speak',mode,idx:0,hint:0,sec:'all',shuffle:false,reveal:false,rid:null,exam:null},extra||{}));
  if(mode==='qa')spBuildList();
  renderSpeak();scrollTo(0,0);
}
function renderSpeak(){
  const m=state.mode;
  let body;
  if(m==='hub')body=spHub();
  else if(m==='qa')body=unitTabs()+spQA();
  else if(m==='list')body=unitTabs()+spList();
  else if(m==='exam')body=unitTabs()+spExam();
  else body=state.rid===null?spReadList():spReadPassage();
  const back=m==='hub'?'<button class="back" onclick="showHome()">← Trang chủ</button>':'<button class="back" onclick="showSpeakHub()">← Speaking</button>';
  $('#app').innerHTML=`<div class="page-head"><div>${back}</div><div><h1>🎤 Speaking</h1><div class="stats">Nghe câu hỏi · từ khóa gợi ý · thi thử · luyện đọc</div></div><div></div></div>${spModeTabs()}${spSettingsBar()}${body}`;
  if(m==='read'&&state.rid!==null&&!SPS.furi){const c=$('.rd-body');if(c)c.classList.add('no-furi')}
}

/* ───────── Tổng quan ───────── */
function spHub(){
  const cnt=u=>SP.units[u].sections.reduce((a,s)=>a+s.items.length,0);
  const cards=[4,5,6,7].map(u=>`<article class="sp-card"><h3>Bài ${u}</h3><div class="muted">${cnt(u)} câu hỏi · ${SP.units[u].sections.length} dạng</div><div class="module-buttons" style="margin-top:12px"><button class="action primary" onclick="openSpeak('qa',${u})">🎧 Nghe – nói</button><button class="action" onclick="openSpeak('list',${u})">📋 Danh sách</button><button class="action" onclick="openSpeak('exam',${u})">⏱ Thi thử</button></div></article>`).join('');
  return `<div class="note"><b>Thể thức thi Speaking JPD123:</b> Reading đọc một đoạn ~150 chữ (45 điểm, chuẩn bị 20 giây) · Q&amp;A 3 câu giám thị hỏi — 1 câu có tranh, 2 câu không tranh (45 điểm) · tác phong, độ trôi chảy, phát âm, chào hỏi (10 điểm). Mỗi câu hỏi được hỏi tối đa 3 lần, mỗi lần suy nghĩ không quá 10 giây.</div>
  <div class="sp-grid">${cards}
  <article class="sp-card"><h3>Thi thử</h3><div class="muted">3 câu ngẫu nhiên, chỉ nghe, tối đa 3 lần nghe, 10 giây suy nghĩ</div><div class="module-buttons" style="margin-top:12px"><button class="action blue" onclick="openSpeak('exam','all')">⏱ Bắt đầu thi thử</button><button class="action" onclick="openSpeak('read')">📖 Luyện đọc (10 đề + demo)</button></div></article></div>
  <div class="note" style="margin-top:18px"><b>Cách luyện:</b> bấm 🔊 nghe câu hỏi → trả lời thử → mở gợi ý từng bước: 💡 <b>Từ khóa</b> (từ để hỏi + từ quan trọng, ↩ là từ nên dùng lại khi trả lời) → 🧩 <b>Khung trả lời</b> → ✅ <b>Đáp án mẫu</b>. Âm thanh là giọng đọc của trình duyệt (không có file ghi âm trong bộ tài liệu).</div>
  <div class="kbd-hint"><kbd>←</kbd> <kbd>→</kbd> Câu trước / sau · <kbd>Space</kbd> Nghe câu hỏi · <kbd>H</kbd> hoặc <kbd>Enter</kbd> Gợi ý tiếp · <kbd>↑</kbd> Gợi ý ít hơn · <kbd>S</kbd> Nghe chậm · <kbd>P</kbd> Nghe đáp án · <kbd>T</kbd> Ẩn/hiện chữ · <kbd>R</kbd> Xáo trộn</div>`;
}

/* ───────── Luyện nghe – nói ───────── */
function spBuildList(){
  let L=unitItems(spUnit);
  if(state.sec!=='all'&&spUnit!=='all')L=L.filter(x=>x.si===Number(state.sec));
  if(state.shuffle)L=shuffle(L);
  state.list=L;state.idx=0;state.hint=0;state.reveal=false;
}
function spQA(){
  const L=state.list;
  if(!L.length)return '<div class="empty">Chưa có câu hỏi.</div>';
  const cur=L[state.idx],it=cur.it,h=state.hint;
  const secSel=spUnit==='all'?'':`<select class="sp-sec" onchange="spSetSec(this.value)" aria-label="Chọn dạng câu hỏi"><option value="all">Tất cả dạng câu hỏi</option>${SP.units[spUnit].sections.map((s,i)=>`<option value="${i}" ${String(state.sec)===String(i)?'selected':''}>${i+1}. ${esc(s.title)}</option>`).join('')}</select>`;
  const badges=`${it.pic?'<span class="badge b-pic" title="Trong đề thật câu này có tranh minh hoạ; ở đây chỉ có chữ">🖼 Câu có tranh</span>':''}${it.self?'<span class="badge b-self" title="Câu hỏi về bản thân: đáp án mẫu chỉ là ví dụ">🙋 Hỏi về bạn</span>':''}${it.sample?'<span class="badge b-self">Đáp án gợi ý của mình</span>':''}`;
  const hidden=SPS.hideText&&!state.reveal;
  const qBlock=hidden?`<div class="sp-hidden">🎧 Nghe và trả lời… <button class="pill" onclick="spReveal()">Hiện chữ</button></div>`:`<div class="sp-q-text">${hlQuestion(it,h>=1)}</div>`;
  let hints='';
  if(h>=1){
    const kws=sortKw(it.kw);
    hints+=`<div class="sp-hint"><div class="sp-hint-t">💡 Từ khóa trong câu hỏi <span class="muted">(nhấn vào từ để nghe · ↩ = nên dùng lại khi trả lời)</span></div>${kws.length?`<div class="kw-list">${kws.map(c=>chipHTML(c,true)).join('')}</div>`:'<div class="muted">Không có từ khóa đặc biệt.</div>'}</div>`;
  }
  if(h>=2){
    const re=it.kw.filter(c=>c.reuse);
    hints+=`<div class="sp-hint"><div class="sp-hint-t">🧩 Khung câu trả lời</div><div class="sp-pattern">${esc(cur.sec.pattern)}</div>${re.length?`<div class="muted" style="margin-top:8px">Dùng lại từ trong câu hỏi: ${re.map(c=>`<b>${esc(c.m)}</b>`).join('、')}</div>`:''}${it.self?'<div class="muted" style="margin-top:6px">Đây là câu hỏi về bạn — hãy trả lời bằng thông tin thật của bạn theo khung trên.</div>':''}</div>`;
  }
  if(h>=3){
    hints+=`<div class="sp-hint"><div class="sp-hint-t">✅ Đáp án mẫu</div>${it.a.map(a=>`<div class="sp-ans"><button class="sp-mini" data-say="${esc(a)}" onclick="spSayEl(this)" title="Nghe đáp án">🔊</button><span class="jp-line">${esc(a)}</span></div>`).join('')}</div>`;
  }
  const step=(n,l)=>`<button class="sp-step ${h>=n?'on':''}" onclick="spSetHint(${n})">${l}</button>`;
  return `<div class="sp-wrap"><div class="sp-top"><div class="muted">Câu <b>${state.idx+1}/${L.length}</b> · Bài ${cur.unit} · ${esc(cur.sec.title)}</div>${secSel}</div>
  <div class="sp-card-main"><div class="sp-badges">${badges}</div>
    <div class="sp-q-top"><button class="sp-play" id="spPlayBtn" onclick="spPlayQ()">🔊 Nghe câu hỏi</button><button class="pill" onclick="spPlayQ(0.6)">🐢 Nghe chậm</button><button class="pill ${SPS.hideText?'active':''}" onclick="spToggleHide()">🎧 Chỉ nghe (ẩn chữ)</button></div>
    ${qBlock}
    <div class="sp-steps">${step(1,'💡 Từ khóa')}${step(2,'🧩 Khung trả lời')}${step(3,'✅ Đáp án mẫu')}<button class="pill" onclick="spSetHint(0)">Ẩn gợi ý</button></div>
    ${hints}
    <div class="toolbar" style="justify-content:center;margin-top:18px"><button class="pill" onclick="spPrev()">← Câu trước</button><button class="pill ${state.shuffle?'active':''}" onclick="spToggleShuffle()">🔀 Xáo trộn</button><button class="pill" onclick="spNext()">Câu sau →</button></div>
  </div>
  <div class="kbd-hint"><kbd>←</kbd> <kbd>→</kbd> Câu trước / sau · <kbd>Space</kbd> Nghe · <kbd>S</kbd> Nghe chậm · <kbd>H</kbd>/<kbd>Enter</kbd> Gợi ý tiếp · <kbd>↑</kbd> Giảm gợi ý · <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> Chọn mức gợi ý · <kbd>P</kbd> Nghe đáp án · <kbd>T</kbd> Ẩn/hiện chữ · <kbd>R</kbd> Xáo trộn</div></div>`;
}
const spCur=()=>state.list&&state.list[state.idx]&&state.list[state.idx].it;
function spPlayQ(rate){
  const it=spCur();if(!it)return;
  const b=document.getElementById('spPlayBtn');if(b)b.classList.add('playing');
  ttsSpeak(it.q,{rate}).then(()=>{const x=document.getElementById('spPlayBtn');if(x)x.classList.remove('playing')});
}
function spPlayAnswer(){const it=spCur();if(it)ttsSpeak(it.a[0])}
function spMove(d){
  const n=state.list.length;if(!n)return;
  state.idx=(state.idx+d+n)%n;state.hint=0;state.reveal=false;ttsStop();renderSpeak();
  if(SPS.autoplay)spPlayQ();
}
function spNext(){spMove(1)}
function spPrev(){spMove(-1)}
function spSetHint(n){state.hint=n;renderSpeak()}
function spSetSec(v){state.sec=v;spBuildList();renderSpeak();if(SPS.autoplay)spPlayQ()}
function spToggleShuffle(){state.shuffle=!state.shuffle;spBuildList();renderSpeak()}
function spToggleHide(){SPS.hideText=!SPS.hideText;spSave();state.reveal=false;renderSpeak()}
function spReveal(){state.reveal=true;renderSpeak()}

/* ───────── Danh sách đầy đủ ───────── */
function spList(){
  const units=spUnit==='all'?[4,5,6,7]:[spUnit];
  return units.map(u=>SP.units[u].sections.map((s,si)=>`<article class="grammar-card sp-list-card"><h3>Bài ${u} · ${si+1}. ${esc(s.title)}</h3><div class="sp-pattern" style="margin-bottom:10px">${esc(s.pattern)}</div>${s.items.map(it=>`<div class="sp-row"><div class="sp-row-q"><button class="sp-mini" data-say="${esc(it.q)}" onclick="spSayEl(this)" title="Nghe câu hỏi">🔊</button><span class="jp-line">${esc(it.q)}</span>${it.pic?'<span class="badge b-pic">🖼</span>':''}${it.self?'<span class="badge b-self">🙋</span>':''}</div><div class="kw-list kw-compact">${sortKw(it.kw).map(c=>chipHTML(c,false)).join('')}</div>${it.a.map(a=>`<div class="sp-ans"><button class="sp-mini" data-say="${esc(a)}" onclick="spSayEl(this)" title="Nghe đáp án">🔊</button><span class="jp-line">➞ ${esc(a)}</span></div>`).join('')}</div>`).join('')}</article>`).join('')).join('');
}

/* ───────── Thi thử ───────── */
function examPick(){
  const all=unitItems(spUnit);
  const pics=all.filter(x=>x.it.pic),nons=all.filter(x=>!x.it.pic);
  const chosen=[];
  const take=(pool)=>{const p=pool.filter(x=>!chosen.some(c=>c.sec===x.sec));return p.length?pick(p):null};
  const a=take(pics.length?pics:all);if(a)chosen.push(a);
  for(let i=0;i<2;i++){const b=take(nons.length?nons:all)||pick(all);if(!chosen.includes(b))chosen.push(b)}
  while(chosen.length<3)chosen.push(pick(all));
  return shuffle(chosen);
}
function spExam(){
  const ex=state.exam;
  if(!ex)return `<div class="sp-wrap"><div class="sp-card-main" style="text-align:center"><h2 style="margin-top:0">⏱ Thi thử Q&amp;A — ${unitName(spUnit)}</h2><p class="muted">Bạn sẽ nghe 3 câu hỏi ngẫu nhiên (1 câu có tranh + 2 câu không tranh). Mỗi câu nghe tối đa <b>3 lần</b>, suy nghĩ không quá <b>10 giây</b> mỗi lần, rồi tự trả lời thành tiếng.</p><button class="sp-play" onclick="examStart()">▶ Bắt đầu thi thử</button><div class="kbd-hint">Bắt đầu: <kbd>Enter</kbd> · Nghe lại: <kbd>Space</kbd> · Xong, xem đáp án: <kbd>Enter</kbd> · Câu tiếp: <kbd>→</kbd></div></div></div>`;
  if(ex.phase==='done'){
    return `<div class="sp-wrap"><div class="sp-card-main"><h2 style="margin-top:0">🎉 Hoàn thành!</h2><p class="muted">Xem lại 3 câu vừa rồi và tự đánh giá cách trả lời của bạn.</p>${ex.list.map((x,i)=>`<div class="sp-hint"><div class="sp-hint-t">Câu ${i+1}${x.it.pic?' 🖼':''}</div><div class="sp-ans"><button class="sp-mini" data-say="${esc(x.it.q)}" onclick="spSayEl(this)">🔊</button><span class="jp-line">${esc(x.it.q)}</span></div><div class="kw-list kw-compact">${sortKw(x.it.kw).map(c=>chipHTML(c,false)).join('')}</div>${x.it.a.map(a=>`<div class="sp-ans"><button class="sp-mini" data-say="${esc(a)}" onclick="spSayEl(this)">🔊</button><span class="jp-line">➞ ${esc(a)}</span></div>`).join('')}</div>`).join('')}<div class="toolbar" style="justify-content:center"><button class="action primary" onclick="examStart()">Thi lại</button></div><div class="kbd-hint"><kbd>Enter</kbd> Thi lại</div></div></div>`;
  }
  const x=ex.list[ex.i],it=x.it;
  const head=`<div class="muted">Câu <b>${ex.i+1}/3</b>${it.pic?' · 🖼 câu có tranh trong đề thật':''}</div>`;
  if(ex.phase==='listen'){
    return `<div class="sp-wrap"><div class="sp-card-main" style="text-align:center">${head}<div class="exam-icon">🎧</div><div class="muted">Đã nghe <b>${ex.plays}/3</b> lần</div><div class="exam-timer"><div id="examBar" style="width:0%"></div></div><div id="examMsg" class="muted" style="min-height:24px"></div><div class="toolbar" style="justify-content:center"><button class="sp-play" ${ex.plays>=3?'disabled':''} onclick="examPlay()">🔊 Nghe lại</button><button class="action" onclick="examDone()">Xong — xem đáp án</button></div><div class="kbd-hint"><kbd>Space</kbd> Nghe lại · <kbd>Enter</kbd> Xong, xem đáp án</div></div></div>`;
  }
  const last=ex.i>=2;
  return `<div class="sp-wrap"><div class="sp-card-main">${head}<div class="sp-q-top"><button class="sp-play" onclick="examReplay()">🔊 Nghe lại câu hỏi</button></div><div class="sp-q-text">${hlQuestion(it,true)}</div><div class="sp-hint"><div class="sp-hint-t">💡 Từ khóa</div><div class="kw-list">${sortKw(it.kw).map(c=>chipHTML(c,true)).join('')}</div></div><div class="sp-hint"><div class="sp-hint-t">🧩 Khung câu trả lời</div><div class="sp-pattern">${esc(x.sec.pattern)}</div></div><div class="sp-hint"><div class="sp-hint-t">✅ Đáp án mẫu</div>${it.a.map(a=>`<div class="sp-ans"><button class="sp-mini" data-say="${esc(a)}" onclick="spSayEl(this)">🔊</button><span class="jp-line">${esc(a)}</span></div>`).join('')}</div><div class="toolbar" style="justify-content:center"><button class="action primary" onclick="examNext()">${last?'Xem tổng kết':'Câu tiếp theo →'}</button></div><div class="kbd-hint"><kbd>→</kbd> / <kbd>Enter</kbd> ${last?'Xem tổng kết':'Câu tiếp'} · <kbd>Space</kbd> Nghe lại câu hỏi</div></div></div>`;
}
function examStart(){spStopAll();state.exam={list:examPick(),i:0,plays:0,phase:'listen'};renderSpeak();examPlay()}
function examPlay(){
  const ex=state.exam;if(!ex||ex.phase!=='listen'||ex.plays>=3)return;
  if(spTimer){clearInterval(spTimer);spTimer=null}
  ex.plays++;const my=++spToken;renderSpeak();
  ttsSpeak(ex.list[ex.i].it.q).then(()=>{if(my!==spToken||state.exam!==ex||ex.phase!=='listen')return;examTimer()});
}
function examTimer(){
  const ex=state.exam,T=10,t0=Date.now();
  const msg=document.getElementById('examMsg');if(msg)msg.textContent='Suy nghĩ… trả lời thành tiếng nhé!';
  spTimer=setInterval(()=>{
    const el=(Date.now()-t0)/1000,bar=document.getElementById('examBar');
    if(bar)bar.style.width=Math.min(100,el/T*100)+'%';
    const m=document.getElementById('examMsg');if(m)m.textContent=el<T?`Còn ${Math.ceil(T-el)} giây…`:'Hết giờ!';
    if(el>=T){clearInterval(spTimer);spTimer=null;if(state.exam===ex&&ex.phase==='listen'&&ex.plays>=3)setTimeout(()=>{if(state.exam===ex&&ex.phase==='listen')examDone()},600)}
  },100);
}
function examDone(){const ex=state.exam;if(!ex||ex.phase!=='listen')return;spStopAll();ex.phase='reveal';renderSpeak()}
function examReplay(){const ex=state.exam;if(ex)ttsSpeak(ex.list[ex.i].it.q)}
function examNext(){
  const ex=state.exam;if(!ex||ex.phase!=='reveal')return;spStopAll();
  if(ex.i>=2){ex.phase='done';renderSpeak();return}
  ex.i++;ex.plays=0;ex.phase='listen';renderSpeak();examPlay();
}

/* ───────── Luyện đọc ───────── */
const spPassages=()=>[SP.demo.reading,...SP.reading];
function spReadList(){
  return `<div class="sp-grid">${spPassages().map(p=>{const first=p.paras[0][0].t;return `<article class="sp-card"><h3>${p.id===0?'Demo':'Đề '+p.id} · ${esc(p.title.replace(/^Đề A-0 \(Demo\)$/,'Đề A-0 (Demo)'))}</h3><div class="muted" style="min-height:42px">${esc(first.slice(0,42))}…</div><div class="module-buttons" style="margin-top:12px"><button class="action primary" onclick="openReading(${p.id})">📖 Luyện đọc</button></div></article>`}).join('')}</div>`;
}
function openReading(id){spStopAll();state=freshState({type:'speak',mode:'read',rid:id,idx:0,reading:null});renderSpeak();scrollTo(0,0)}
function spReadPassage(){
  const ps=spPassages(),p=ps.find(x=>x.id===state.rid);
  const body=p.paras.map((para,pi)=>`<p class="rd-p">${para.map((s,si)=>`<span class="rd-s" id="rs-${pi}-${si}" onclick="rdPlayOne(${pi},${si})" title="Nhấn để nghe câu này">${s.h}</span>`).join(' ')}</p>`).join('');
  const title=p.id===0?p.title:`Đề ${p.id} · 「${esc(p.title)}」`;
  return `<div class="sp-wrap"><div class="sp-top"><div class="muted"><b>${title}</b></div><div class="toolbar" style="margin:0"><button class="pill" onclick="rdNav(-1)">← Đề trước</button><button class="pill" onclick="rdNav(1)">Đề sau →</button></div></div>
  <div class="sp-card-main"><div class="sp-q-top"><button class="sp-play" id="rdPlayBtn" onclick="rdToggle()">▶ Nghe cả bài</button><button class="pill ${SPS.furi?'active':''}" id="rdFuri" onclick="rdFuri()">ふりがな</button><button class="pill" onclick="rdPrep()">⏱ Chuẩn bị 20 giây</button></div><div id="rdPrepMsg" class="muted" style="min-height:22px"></div><div class="rd-body" id="rdBody">${body}</div></div>
  <div class="kbd-hint"><kbd>←</kbd> <kbd>→</kbd> Đề trước / sau · <kbd>Space</kbd> Nghe cả bài / dừng · <kbd>F</kbd> Bật/tắt furigana · Nhấn vào một câu để nghe riêng câu đó</div></div>`;
}
function rdNav(d){
  const ps=spPassages(),i=ps.findIndex(x=>x.id===state.rid),n=ps.length;
  openReading(ps[(i+d+n)%n].id);
}
function rdFuri(){SPS.furi=!SPS.furi;spSave();const b=document.getElementById('rdBody'),f=document.getElementById('rdFuri');if(b)b.classList.toggle('no-furi',!SPS.furi);if(f)f.classList.toggle('active',SPS.furi)}
function rdMark(pi,si){document.querySelectorAll('.rd-s.now').forEach(e=>e.classList.remove('now'));const e=document.getElementById(`rs-${pi}-${si}`);if(e){e.classList.add('now');e.scrollIntoView({block:'nearest',behavior:'smooth'})}}
function rdPlayOne(pi,si){
  spStopAll();const p=spPassages().find(x=>x.id===state.rid);
  rdMark(pi,si);ttsSpeak(p.paras[pi][si].t).then(()=>{const e=document.getElementById(`rs-${pi}-${si}`);if(e)e.classList.remove('now')});
}
async function rdToggle(){
  const btn=document.getElementById('rdPlayBtn');
  if(btn&&btn.dataset.on==='1'){spStopAll();rdReset();return}
  spStopAll();const my=spToken;
  if(btn){btn.dataset.on='1';btn.textContent='⏹ Dừng'}
  const p=spPassages().find(x=>x.id===state.rid);
  for(let pi=0;pi<p.paras.length;pi++)for(let si=0;si<p.paras[pi].length;si++){
    if(my!==spToken)return;
    rdMark(pi,si);await ttsSpeak(p.paras[pi][si].t);
  }
  if(my===spToken)rdReset();
}
function rdReset(){const b=document.getElementById('rdPlayBtn');if(b){b.dataset.on='0';b.textContent='▶ Nghe cả bài'}document.querySelectorAll('.rd-s.now').forEach(e=>e.classList.remove('now'))}
function rdPrep(){
  if(spTimer){clearInterval(spTimer);spTimer=null}
  const t0=Date.now(),m=document.getElementById('rdPrepMsg');
  spTimer=setInterval(()=>{
    const left=20-Math.floor((Date.now()-t0)/1000);
    const x=document.getElementById('rdPrepMsg');if(!x){clearInterval(spTimer);spTimer=null;return}
    x.textContent=left>0?`⏱ Chuẩn bị… còn ${left} giây`:'▶ Bắt đầu đọc!';
    if(left<=0){clearInterval(spTimer);spTimer=null}
  },250);
  if(m)m.textContent='⏱ Chuẩn bị… còn 20 giây';
}

/* ───────── Phím tắt (được gọi từ app.js) ───────── */
function speakKey(e){
  const k=e.key,m=state.mode;
  if(m==='qa'){
    if(k==='ArrowRight'){spNext();return true}
    if(k==='ArrowLeft'){spPrev();return true}
    if(k===' '){spPlayQ();return true}
    if(k==='s'||k==='S'){spPlayQ(0.6);return true}
    if(k==='Enter'||k==='ArrowDown'||k==='h'||k==='H'){spSetHint(Math.min(3,state.hint+1));return true}
    if(k==='ArrowUp'){spSetHint(Math.max(0,state.hint-1));return true}
    if(/^[123]$/.test(k)){spSetHint(Number(k));return true}
    if(k==='p'||k==='P'){spPlayAnswer();return true}
    if(k==='t'||k==='T'){spToggleHide();return true}
    if(k==='r'||k==='R'){spToggleShuffle();return true}
    return false;
  }
  if(m==='exam'){
    const ex=state.exam;
    if(!ex){if(k==='Enter'||k===' '){examStart();return true}return false}
    if(ex.phase==='listen'){
      if(k===' '){examPlay();return true}
      if(k==='Enter'||k==='ArrowRight'){examDone();return true}
    }else if(ex.phase==='reveal'){
      if(k==='ArrowRight'||k==='Enter'){examNext();return true}
      if(k===' '){examReplay();return true}
    }else if(ex.phase==='done'){
      if(k==='Enter'||k===' '){examStart();return true}
    }
    return false;
  }
  if(m==='read'&&state.rid!==null){
    if(k==='ArrowRight'){rdNav(1);return true}
    if(k==='ArrowLeft'){rdNav(-1);return true}
    if(k===' '){rdToggle();return true}
    if(k==='f'||k==='F'){rdFuri();return true}
    return false;
  }
  return false;
}
