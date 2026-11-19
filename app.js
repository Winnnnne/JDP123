// Japanese Study — Bài 4–7
const D=window.JP_DATA;
const $=s=>document.querySelector(s);
const JP_RE=/[ぁ-んァ-ン一-龯]/;
const VI_RE=/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i;
const freshState=(o={})=>({unit:null,type:null,mode:null,idx:0,flipped:false,quiz:null,...o});
let state=freshState();
let grammarType='mix'; // mix | topic | trans | blankmc | blanktype
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const unitObj=u=>D.units.find(x=>x.id===Number(u));

/* ───────── Utils ───────── */
function shuffle(a){const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r}
const pick=a=>a[Math.floor(Math.random()*a.length)];
const uniq=a=>[...new Set(a)];

/* ───────── Điều hướng ───────── */
function showHome(){state=freshState();renderHome();scrollTo(0,0)}
function renderHome(){
  $('#app').innerHTML=`<section class="hero"><h1>日本語 学習</h1><p>Học tiếng Nhật theo Bài 4–7 • Từ vựng · Kanji · Ngữ pháp</p></section>
  <div class="unit-grid">${D.units.map(u=>`
  <article class="unit-card"><h2>Bài ${u.id}</h2><div class="sub">${u.vocabCount} từ vựng · ${u.kanjiCount} Kanji · ${u.grammarCount} chủ đề</div>
    <div class="module pink"><div class="module-title">📖 Từ vựng</div><div class="module-buttons">
      <button class="action" onclick="openModule(${u.id},'vocab','list')">Danh sách</button><button class="action" onclick="openModule(${u.id},'vocab','flash')">Flashcard</button><button class="action primary" onclick="openModule(${u.id},'vocab','quiz')">Kiểm tra</button></div></div>
    <div class="module purple"><div class="module-title">🈶 Kanji</div><div class="module-buttons">
      <button class="action" onclick="openModule(${u.id},'kanji','list')">Danh sách</button><button class="action" onclick="openModule(${u.id},'kanji','flash')">Flashcard</button><button class="action purple" onclick="openModule(${u.id},'kanji','quiz')">Kiểm tra</button></div></div>
    <div class="module blue"><div class="module-title">⚖️ Ngữ pháp</div><div class="module-buttons">
      <button class="action blue" onclick="openModule(${u.id},'grammar','view')">Xem Ngữ pháp</button><button class="action" onclick="openModule(${u.id},'grammar','quiz')">Kiểm tra</button></div></div>
  </article>`).join('')}</div>`;
}
function openModule(unit,type,mode){state=freshState({unit,type,mode});renderModule();scrollTo(0,0)}
function backUnit(){showHome()}
function dataFor(){
  if(state.type==='vocab')return D.vocab.filter(x=>x.unit===state.unit);
  if(state.type==='kanji')return D.kanji.filter(x=>x.unit===state.unit);
  return D.grammar[String(state.unit)].sections;
}
function titleFor(){return state.type==='vocab'?'Từ vựng':state.type==='kanji'?'Kanji':'Ngữ pháp'}
function renderModule(){
  const u=unitObj(state.unit);
  $('#app').innerHTML=`<div class="page-head"><div><button class="back" onclick="backUnit()">← Danh sách bài</button></div><div><h1>Bài ${u.id} · ${titleFor()}</h1><div class="stats">${u.vocabCount} từ vựng · ${u.kanjiCount} Kanji · ${u.grammarCount} chủ đề</div></div><div></div></div>${moduleBody()}`;
  const fi=$('#fillInput'); if(fi&&!fi.disabled)fi.focus();
  const fbk=$('#feedback'); if(fbk&&fbk.scrollIntoView)fbk.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function tabs(kind){
  const t=(m,l)=>`<button class="pill ${state.mode===m?'active':''}" onclick="openModule(${state.unit},'${kind}','${m}')">${l}</button>`;
  return `<div class="toolbar">${t('list','Danh sách')}${t('flash','Flashcard')}${t('quiz','Kiểm tra')}</div>`;
}
function moduleBody(){
  if(state.type==='vocab')return tabs('vocab')+(state.mode==='list'?vocabList():state.mode==='flash'?flashView():quizView('vocab'));
  if(state.type==='kanji')return tabs('kanji')+(state.mode==='list'?kanjiList():state.mode==='flash'?flashView():quizView('kanji'));
  return `<div class="toolbar"><button class="pill ${state.mode==='view'?'active':''}" onclick="openModule(${state.unit},'grammar','view')">Xem ngữ pháp</button><button class="pill ${state.mode==='quiz'?'active':''}" onclick="openModule(${state.unit},'grammar','quiz')">Kiểm tra</button></div>`+(state.mode==='view'?grammarView():quizView('grammar'));
}

/* ───────── Danh sách / Ngữ pháp ───────── */
function vocabList(){const rows=dataFor();return `<div class="table-wrap"><table><thead><tr><th>#</th><th>Tiếng Nhật</th><th>Romaji</th><th>Nghĩa</th></tr></thead><tbody>${rows.map((x,i)=>`<tr><td>${i+1}</td><td><div class="jp">${esc(x.japanese||x.kanji||'—')}</div>${x.kanji?`<div class="muted">${esc(x.kanji)}</div>`:''}</td><td>${esc(x.romaji||'—')}</td><td>${esc(x.meaning||'—')}</td></tr>`).join('')}</tbody></table></div>`}
function kanjiList(){const rows=dataFor();return `<div class="table-wrap"><table><thead><tr><th>#</th><th>Kanji</th><th>Hán Việt</th><th>Hiragana</th><th>Ý nghĩa</th></tr></thead><tbody>${rows.map((x,i)=>`<tr><td>${i+1}</td><td class="jp">${esc(x.kanji||'—')}</td><td>${esc(x.hanviet||'—')}</td><td>${esc(x.hiragana||'—')}</td><td>${esc(x.meaning||'—')}</td></tr>`).join('')}</tbody></table></div>`}
function grammarView(){const secs=dataFor();return `<div class="section-grid">${secs.map(s=>`<article class="grammar-card"><h3>${esc(s.title)}</h3>${s.lines.map(line=>`<div class="line ${JP_RE.test(line)?'jp-line':''}">${esc(line)}</div>`).join('')}</article>`).join('')}</div><div class="note">Mẹo: ưu tiên đọc mẫu câu tiếng Nhật trước, sau đó xem phần giải thích tiếng Việt và tự đặt thêm 1 câu.</div>`}

/* ───────── Flashcard ───────── */
function flashItems(){return state.type==='grammar'?[]:dataFor()}
function flashView(){
  const rows=flashItems(); if(!rows.length)return '<div class="empty">Chưa có flashcard.</div>';
  const n=rows.length,i=state.idx%n,x=rows[i],isK=state.type==='kanji';
  const front=isK?(x.kanji||x.hiragana||x.hanviet):(x.japanese||x.kanji);
  const back=isK?`${esc(x.hanviet||'')} · ${esc(x.hiragana||'')}<br><span class="muted">${esc(x.meaning||'')}</span>`:`${esc(x.meaning||'')}<div class="romaji">${esc(x.romaji||'')}</div>`;
  return `<div class="flash-wrap"><div><div class="flash ${state.flipped?'flipped':''}" onclick="flipCard()"><div class="flash-inner"><div class="face"><div class="jp-big">${esc(front||'—')}</div><div class="muted">Nhấn để lật thẻ</div></div><div class="face backface"><div class="meaning">${back}</div></div></div></div>
  <div class="toolbar" style="justify-content:center"><button class="pill" onclick="prevCard()">← Trước</button><button class="pill" onclick="nextCard()">Tiếp →</button><button class="pill" onclick="speakCard()">🔊 Phát âm</button></div></div>
  <aside class="flash-side"><strong>Thẻ ${i+1}/${n}</strong><div style="margin:10px 0" class="progress-bar"><div style="width:${(i+1)/n*100}%"></div></div><div class="muted">Lật thẻ để xem nghĩa. Dùng nút phát âm để nghe tiếng Nhật bằng giọng hệ thống.</div>
  <div class="kbd-hint"><kbd>←</kbd> <kbd>→</kbd> Trước / Tiếp<br><kbd>Space</kbd> Lật thẻ · <kbd>P</kbd> Phát âm</div></aside></div>`;
}
function flipCard(){
  state.flipped=!state.flipped;
  const el=$('.flash'); if(el)el.classList.toggle('flipped',state.flipped); // giữ animation lật, không render lại
}
function nextCard(){const n=dataFor().length;if(!n)return;state.idx=(state.idx+1)%n;state.flipped=false;renderModule()}
function prevCard(){const n=dataFor().length;if(!n)return;state.idx=(state.idx-1+n)%n;state.flipped=false;renderModule()}
function speakCard(){
  const rows=dataFor(),x=rows[state.idx%rows.length]; if(!x)return;
  const text=state.type==='kanji'?(x.kanji||x.hiragana):(x.japanese||x.kanji);
  if('speechSynthesis'in window){const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';speechSynthesis.cancel();speechSynthesis.speak(u)}
}

/* ───────── Ngữ pháp: tách câu ví dụ từ dữ liệu thô ───────── */
const cleanTitle=t=>String(t).replace(/^\s*\d+\s*[)）.．]\s*/,'').trim();
const BAD_TR=/^(TH\b|Hai câu|Lưu ý)/;
const PLACEHOLDER=/(^|[^A-Za-z])(N|V|A|CN)[0-9]?(?![A-Za-z])/;
function cleanLine(raw){
  let s=String(raw).replace(/\u00a0/g,' ').trim(),p;
  do{p=s;s=s.replace(/^(?:VD\s*[:：]\s*|[➞⇒→*＊]\s*|=>\s*|[AB]\s*[:：]\s*)/,'').trim()}while(s!==p);
  return s;
}
const _sentCache={};
function grammarSentences(unit){
  if(_sentCache[unit])return _sentCache[unit];
  const out=[],seen=new Set();
  D.grammar[String(unit)].sections.forEach((sec,si)=>{
    const raw=sec.lines.map(String);
    raw.forEach((r,i)=>{
      const line=cleanLine(r); if(!JP_RE.test(line))return;
      let main=line,tr='';
      const m=line.match(/^(.*?)\s*[（(]([^()（）]*)[)）]\s*$/);
      if(m&&!JP_RE.test(m[2])&&/[A-Za-zÀ-ỹ]{2}/.test(m[2])&&!BAD_TR.test(m[2].trim())){main=m[1].trim();tr=m[2].trim()}
      if(!tr&&raw[i+1]!==undefined){
        const nx=String(raw[i+1]).replace(/\u00a0/g,' ').trim();
        if(nx&&!JP_RE.test(nx)&&/[A-Za-zÀ-ỹ]{2}/.test(nx)&&!/^[*＊…\.\-—:：]/.test(nx)&&!/^(Lưu ý|VD|Nsự|Trường)/.test(nx)&&!BAD_TR.test(nx))
          tr=nx.replace(/^[（(]\s*/,'').replace(/\s*[)）]\s*$/,'').trim();
      }
      if(!JP_RE.test(main)||VI_RE.test(main)||PLACEHOLDER.test(main)||/[～…＋]|。。。/.test(main)||main.length<4)return;
      const chunks=main.split(/[\s\u3000]+/).filter(Boolean);
      const okEnd=/[。？?！]$/.test(main)||(tr&&chunks.length>=2&&/[すんねよか]$/.test(main));
      if(!okEnd||seen.has(main))return;
      seen.add(main); out.push({sec:si,main,tr});
    });
  });
  return _sentCache[unit]=out;
}

/* Tìm chỗ có thể đục lỗ (trợ từ ở cuối mỗi cụm từ) */
const PARTS=['は','が','を','に','で','へ','と','も','の','や','から','まで','より'];
const CONF={'は':['が','も'],'が':['は','を'],'を':['が'],'に':['へ','で'],'へ':['に'],'で':['に'],'と':['や','も'],'も':['は','が'],'の':[],'や':['と'],'から':['まで'],'まで':['から'],'より':[]};
const NOT_PARTICLE=['ひと','この','その','あの','どの','もの','ちょっと','こんばんは','こんにちは','いっしょに'];
const ROMAJI={wa:'は',ha:'は',ga:'が',wo:'を',o:'を',ni:'に',de:'で',he:'へ',e:'へ',to:'と',mo:'も',no:'の',ya:'や',kara:'から',made:'まで',yori:'より'};
function findBlanks(main){
  const res=[],re=/[^\s\u3000]+/g;let m;
  while((m=re.exec(main))){
    const core=m[0].replace(/[。、？?！!，,]+$/,'');
    if(NOT_PARTICLE.includes(core))continue;
    let p=['から','まで','より'].find(x=>core.endsWith(x)&&core.length>x.length);
    if(!p){const c=core.slice(-1);if(core.length>=2&&PARTS.includes(c)&&c.length===1)p=c}
    if(p)res.push({idx:m.index+core.length-p.length,len:p.length,ans:p});
  }
  return res;
}
function normAns(s){
  s=String(s).normalize('NFKC').replace(/\s+/g,'').toLowerCase();
  return ROMAJI[s]||s;
}
const EQUIV={'に':['へ'],'へ':['に'],'は':['が'],'が':['は']}; // các cặp có thể thay nhau khi tự gõ
function fillOk(input,ans){const v=normAns(input);return v===ans||(EQUIV[ans]||[]).includes(v)}

/* ───────── Tạo câu hỏi ───────── */
const TYPE_LABEL={topic:'Chọn chủ đề',trans:'Dịch câu',blankmc:'Điền trống · Chọn đáp án',blanktype:'Điền trống · Tự gõ'};
function mcQ(label,html,correct,wrong,explain){
  return {type:'mc',label,html,options:shuffle([correct,...wrong]),correct,explain,answered:false,chosen:null,ok:null};
}
function sentHTML(main,b){return esc(main.slice(0,b.idx))+'<span class="blank">　？　</span>'+esc(main.slice(b.idx+b.len))}
function fullSentHTML(s){return `<span class="jp-line">${esc(s.main)}</span>${s.tr?`<div class="muted">${esc(s.tr)}</div>`:''}`}

const nk=t=>String(t).replace(/[\s\u3000]+/g,''); // khoá chuẩn hoá để chống trùng nội dung
const _tlCache={};
function topicLines(unit){
  if(_tlCache[unit])return _tlCache[unit];
  const out=[],seen=new Set();
  D.grammar[String(unit)].sections.forEach((sec,si)=>sec.lines.forEach(raw=>{
    const t=cleanLine(raw).replace(/\s*[（(][^()（）]*[)）]\s*$/,m=>JP_RE.test(m)?m:'').trim();
    const jp=(t.match(/[ぁ-んァ-ン一-龯]/g)||[]).length;
    if(jp<3||nk(t).length<6||/^[….\s]+$/.test(t))return;
    const key=nk(t); if(seen.has(key))return; seen.add(key);
    out.push({sec:si,text:t,key});
  }));
  return _tlCache[unit]=out;
}
function genTopic(unit,ctx){
  const secs=D.grammar[String(unit)].sections;
  const pool=topicLines(unit).filter(l=>!ctx.used.has(l.key));
  if(!pool.length)return null;
  const l=pick(pool); ctx.used.add(l.key);
  const correct=cleanTitle(secs[l.sec].title);
  const wrong=shuffle(uniq(secs.filter((_,i)=>i!==l.sec).map(x=>cleanTitle(x.title)).filter(t=>t!==correct))).slice(0,3);
  if(wrong.length<3)return null;
  return mcQ(TYPE_LABEL.topic,`Mẫu câu dưới đây thuộc chủ đề nào?<br><span class="jp-line">${esc(l.text)}</span>`,correct,wrong,`Chủ đề đúng: <b>${esc(correct)}</b>`);
}
function genTrans(unit,ctx){
  const sents=grammarSentences(unit).filter(s=>s.tr&&!ctx.used.has(nk(s.main)));
  if(!sents.length)return null;
  const s=pick(sents); ctx.used.add(nk(s.main));
  let pool=uniq(grammarSentences(unit).map(x=>x.tr).filter(t=>t&&t!==s.tr));
  if(pool.length<3)pool=uniq(pool.concat(D.units.flatMap(u=>grammarSentences(u.id).map(x=>x.tr)).filter(t=>t&&t!==s.tr)));
  const wrong=shuffle(pool).slice(0,3); if(wrong.length<3)return null;
  return mcQ(TYPE_LABEL.trans,`Câu <span class="jp-line">${esc(s.main)}</span> có nghĩa là gì?`,s.tr,wrong,fullSentHTML(s));
}
function genBlank(unit,ctx,mode){
  let cands=grammarSentences(unit).filter(s=>!ctx.used.has(nk(s.main))).map(s=>({s,bl:findBlanks(s.main)})).filter(x=>x.bl.length);
  if(mode==='type'){const clear=cands.filter(x=>x.bl.some(b=>b.ans!=='は'&&b.ans!=='が'));if(clear.length)cands=clear} // ưu tiên câu ít nhập nhằng
  if(!cands.length)return null;
  const c=pick(cands); ctx.used.add(nk(c.s.main));
  let bl=c.bl;
  if(mode==='type'){const clear=bl.filter(b=>b.ans!=='は'&&b.ans!=='が');if(clear.length)bl=clear}
  const b=pick(bl);
  const head=`Điền trợ từ thích hợp vào chỗ trống:<br><span class="jp-line">${sentHTML(c.s.main,b)}</span>${c.s.tr?`<div class="muted" style="font-size:15px;font-weight:500;margin-top:6px">${esc(c.s.tr)}</div>`:''}`;
  const explain=fullSentHTML(c.s);
  if(mode==='mc'){
    const bad=new Set([b.ans,...(CONF[b.ans]||[])]);
    const wrong=shuffle(PARTS.filter(p=>!bad.has(p))).slice(0,3);
    return mcQ(TYPE_LABEL.blankmc,head,b.ans,wrong,explain);
  }
  return {type:'fill',label:TYPE_LABEL.blanktype,html:head,answer:b.ans,explain,answered:false,userText:'',ok:null};
}
const GTYPES=['trans','blanktype','blankmc','topic']; // thứ tự: dạng kén dữ liệu làm trước, "chọn chủ đề" (linh hoạt nhất) làm sau
function grammarGens(){return {topic:genTopic,trans:genTrans,blankmc:(u,c)=>genBlank(u,c,'mc'),blanktype:(u,c)=>genBlank(u,c,'type')}}
/* Số câu tối đa không trùng nội dung */
const _capCache={};
function grammarCapacity(unit,gt){
  const k=unit+'|'+gt; if(_capCache[k]!==undefined)return _capCache[k];
  const sents=grammarSentences(unit);
  let n;
  if(gt==='topic')n=topicLines(unit).length;
  else if(gt==='trans')n=sents.filter(s=>s.tr).length;
  else if(gt==='blankmc'||gt==='blanktype')n=sents.filter(s=>findBlanks(s.main).length).length;
  else n=new Set([...topicLines(unit).map(l=>l.key),...sents.map(s=>nk(s.main))]).size;
  return _capCache[k]=Math.min(50,n);
}
function buildGrammar(unit,gt,total){
  const gens=grammarGens(),ctx={used:new Set()},out=[];
  let plan={};
  if(gt==='mix'){ // chia đều 4 dạng, phần dư rải ngẫu nhiên
    const base=Math.floor(total/4);GTYPES.forEach(t=>plan[t]=base);
    shuffle(GTYPES).slice(0,total-base*4).forEach(t=>plan[t]++);
  }else plan[gt]=total;
  // lấy luân phiên từng câu cho mỗi dạng để các dạng dùng chung câu ví dụ chia đều, không dạng nào bị hết trước
  const left={...plan},done={};let short=0;
  for(let progress=true;progress;){
    progress=false;
    for(const t of GTYPES){
      if(!left[t]||done[t])continue;
      const q=gens[t](unit,ctx);
      if(q){out.push(q);left[t]--;progress=true}else{done[t]=true;short+=left[t];left[t]=0}
    }
  }
  // dạng nào hết nội dung thì dạng khác bù vào (vẫn không trùng)
  for(let guard=0;short>0&&guard<100;guard++){
    let any=false;
    for(const t of shuffle(gt==='mix'?GTYPES:[gt])){if(short<=0)break;const q=gens[t](unit,ctx);if(q){out.push(q);short--;any=true}}
    if(!any)break;
  }
  return shuffle(out);
}
/* Từ vựng / Kanji: bỏ mục trùng nội dung */
function uniqueItems(kind,rows){
  const seen=new Set();
  return rows.filter(x=>{const k=kind==='vocab'?nk((x.japanese||'')+'|'+(x.kanji||'')):nk(x.hanviet||x.meaning||x.kanji);if(seen.has(k))return false;seen.add(k);return true});
}
function buildSimple(kind,total){
  const all=uniqueItems(kind,dataFor());
  return shuffle(all).slice(0,total).map(item=>{
    let correct,pool,html,explain;
    if(kind==='vocab'){
      correct=item.meaning||item.japanese; pool=all.filter(x=>x!==item).map(x=>x.meaning||x.japanese);
      html=`Từ <span class="jp-line">${esc(item.japanese||item.kanji||'—')}</span> có nghĩa là gì?`;
      explain=`<span class="jp-line">${esc(item.japanese||item.kanji||'')}</span> · ${esc(item.romaji||'')} = <b>${esc(item.meaning||'')}</b>`;
    }else{
      correct=item.kanji||item.hiragana; pool=all.filter(x=>x!==item&&x.hanviet!==item.hanviet).map(x=>x.kanji||x.hiragana||x.hanviet);
      html=`Từ Hán Việt <b>${esc(item.hanviet||item.meaning)}</b> tương ứng với Kanji nào?`;
      explain=`<span class="jp-line">${esc(item.kanji||'')}</span> (${esc(item.hiragana||'')}) · ${esc(item.hanviet||'')} — ${esc(item.meaning||'')}`;
    }
    const wrong=shuffle(uniq(pool.filter(p=>p&&p!==correct))).slice(0,3);
    return mcQ(titleFor(),html,correct,wrong,explain);
  });
}

/* ───────── Kiểm tra ───────── */
const curQ=()=>state.quiz&&state.quiz.questions[state.quiz.pos];
/* Số câu hỏi: nhớ lựa chọn của người dùng, giới hạn tối đa 50 và theo số nội dung không trùng hiện có */
let quizCount=(()=>{try{return JSON.parse(localStorage.getItem('quizCount'))||{}}catch(e){return {}}})();
function quizCap(kind){
  if(kind==='grammar')return grammarCapacity(state.unit,grammarType);
  return Math.min(50,uniqueItems(kind,dataFor()).length);
}
function quizMin(kind){const cap=quizCap(kind);return kind==='grammar'&&grammarType==='mix'?Math.min(4,cap):Math.min(1,cap)} // Hỗn hợp: tối thiểu 4 câu để đủ 4 dạng
function quizN(kind){return Math.max(quizMin(kind),Math.min(quizCap(kind),Number(quizCount[kind])||10))}
function setQuizCount(kind,v){
  quizCount[kind]=Number(v);
  try{localStorage.setItem('quizCount',JSON.stringify(quizCount))}catch(e){}
  startQuiz(kind);
}
function quizControls(kind){
  const cap=quizCap(kind),min=quizMin(kind),n=quizN(kind);
  const note=kind==='grammar'&&grammarType==='mix'?'Chia đều 4 dạng · không trùng nội dung':'Không trùng nội dung';
  return `<div class="quiz-count"><label for="qCount">Số câu</label><input id="qCount" type="range" min="${min}" max="${cap}" value="${n}" ${cap<=min?'disabled':''} oninput="document.getElementById('qVal').textContent=this.value" onchange="setQuizCount('${kind}',this.value)"><b id="qVal">${n}</b><span class="muted">tối đa ${cap} · ${note}</span></div>`;
}
function gtypeBar(){
  const items=[['mix','🔀 Hỗn hợp'],['topic','Chọn chủ đề'],['trans','Dịch câu'],['blankmc','Điền trống · Chọn'],['blanktype','Điền trống · Gõ']];
  return `<div class="toolbar quiz-types">${items.map(([k,l])=>`<button class="pill ${grammarType===k?'active':''}" onclick="setGrammarType('${k}')">${l}</button>`).join('')}</div>`;
}
function setGrammarType(k){grammarType=k;startQuiz('grammar')}
function quizView(kind){
  if(!state.quiz||state.quiz.kind!==kind)startQuiz(kind,true);
  const q=state.quiz,bar=(kind==='grammar'?gtypeBar():'')+quizControls(kind);
  if(!q.total)return `<div class="quiz">${bar}<div class="empty">Chưa đủ dữ liệu để tạo câu hỏi dạng này.</div></div>`;
  if(q.done)return `<div class="quiz">${bar}<div class="quiz-card result"><div class="score-big">${q.score}/${q.total}</div><h2>Hoàn thành!</h2><p class="muted">Bạn có thể làm lại để luyện tiếp.</p><div class="toolbar" style="justify-content:center"><button class="action" onclick="prevQuiz()">← Xem lại câu cuối</button><button class="action primary" onclick="startQuiz('${kind}')">Làm lại</button></div><div class="kbd-hint"><kbd>←</kbd> Xem lại · <kbd>Enter</kbd> Làm lại</div></div></div>`;
  const qq=q.questions[q.pos];
  let body;
  if(qq.type==='mc'){
    body=`<div class="options">${qq.options.map((o,i)=>{
      let cls='opt';
      if(qq.answered){if(o===qq.correct)cls+=' correct';else if(i===qq.chosen)cls+=' wrong'}
      return `<button class="${cls}" ${qq.answered?'disabled':''} onclick="answerQuiz(${i})"><span class="key">${i+1}</span>${esc(o)}</button>`;
    }).join('')}</div>`;
  }else{
    const cls=qq.answered?(qq.ok?' correct':' wrong'):'';
    body=`<div class="fill-row"><input id="fillInput" class="fill-input${cls}" value="${esc(qq.userText)}" ${qq.answered?'disabled':''} placeholder="Nhập trợ từ (vd: は, を, に…)" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="8"><button class="action primary" ${qq.answered?'disabled':''} onclick="submitFill()">Kiểm tra</button></div>${qq.answered?'':'<div class="muted" style="margin-top:8px;font-size:13px">Gõ bằng hiragana hoặc romaji (wa, ga, wo, ni, de, e, to, mo, no, kara, made, yori).</div>'}`;
  }
  const right=qq.type==='mc'?qq.correct:qq.answer;
  const fb=qq.answered?`<div class="feedback ${qq.ok?'ok':'bad'}" id="feedback"><div class="verdict">${qq.ok?'✓ Đúng rồi!':'✗ Sai rồi'}</div>${qq.ok?'':`<div class="right-answer">Đáp án đúng: <b>${esc(right)}</b></div>`}<div class="explain">${qq.explain}</div></div>`:'';
  const nav=`<div class="toolbar quiz-nav">${q.pos>0?`<button class="action" onclick="prevQuiz()">← Câu trước</button>`:''}${qq.answered?`<button class="action primary" onclick="nextQuiz()">${q.pos+1===q.total?'Xem kết quả':'Câu tiếp theo →'}</button>`:''}</div>`;
  const hint=`<div class="kbd-hint">${qq.type==='mc'?'<kbd>1</kbd>–<kbd>4</kbd> Chọn đáp án · ':'<kbd>Enter</kbd> Kiểm tra · '}<kbd>→</kbd> / <kbd>Enter</kbd> Câu tiếp · <kbd>←</kbd> Câu trước</div>`;
  return `<div class="quiz">${bar}<div class="quiz-card"><div class="q-label">Câu ${q.pos+1}/${q.total} · ${esc(qq.label)}</div><div class="question">${qq.html}</div>${fb}${body}${nav}${hint}</div></div>`;
}
function startQuiz(kind,silent){
  const n=quizN(kind),questions=kind==='grammar'?buildGrammar(state.unit,grammarType,n):buildSimple(kind,n);
  state.quiz={kind,questions,total:questions.length,pos:0,score:0,done:false};
  if(!silent)renderModule();
}
function answerQuiz(i){
  const q=state.quiz,qq=curQ(); if(!qq||qq.answered||qq.type!=='mc')return;
  qq.answered=true;qq.chosen=i;qq.ok=qq.options[i]===qq.correct; if(qq.ok)q.score++;
  renderModule();
}
function submitFill(){
  const q=state.quiz,qq=curQ(),fi=$('#fillInput'); if(!qq||qq.answered||qq.type!=='fill'||!fi)return;
  const v=fi.value; if(!v.trim()){fi.focus();return}
  qq.answered=true;qq.userText=v;qq.ok=fillOk(v,qq.answer); if(qq.ok)q.score++;
  renderModule();
}
function nextQuiz(){
  const q=state.quiz,qq=curQ(); if(!q||q.done||!qq||!qq.answered)return;
  if(q.pos+1>=q.total){q.done=true;saveBest();renderModule();return}
  q.pos++;renderModule();
}
function prevQuiz(){
  const q=state.quiz; if(!q)return;
  if(q.done)q.done=false; else if(q.pos>0)q.pos--; else return;
  renderModule();
}
function saveBest(){
  try{const key=`best_${state.unit}_${state.type}`;const old=Number(localStorage.getItem(key)||0);localStorage.setItem(key,String(Math.max(old,state.quiz.score)))}catch(e){}
}

/* ───────── Tiến độ / Tìm kiếm ───────── */
function showStats(){
  state=freshState();
  const get=k=>{try{return Number(localStorage.getItem(k)||0)}catch(e){return 0}};
  const list=D.units.map(u=>{const a=['vocab','kanji','grammar'].map(t=>get(`best_${u.id}_${t}`));return `<div class="result-card"><b>Bài ${u.id}</b><div class="muted">Từ vựng: ${a[0]} · Kanji: ${a[1]} · Ngữ pháp: ${a[2]}</div></div>`}).join('');
  $('#app').innerHTML=`<div class="page-head"><button class="back" onclick="showHome()">← Về trang chủ</button><div><h1>Tiến độ</h1><div class="stats">Điểm cao nhất được lưu trên trình duyệt này</div></div><div></div></div><div class="search-results">${list}</div>`;scrollTo(0,0);
}
function toggleSearch(){const el=$('#searchBar');el.classList.toggle('hidden');if(!el.classList.contains('hidden'))$('#searchInput').focus()}
function closeSearch(){const el=$('#searchBar');if(el.classList.contains('hidden'))return false;el.classList.add('hidden');$('#searchInput').value='';showHome();return true}
function renderSearch(term){
  state=freshState(); // thoát khỏi flashcard/quiz để phím tắt không kích hoạt nhầm
  const t=term.trim().toLowerCase(); if(!t){$('#app').innerHTML='<div class="empty">Nhập từ khóa để tìm.</div>';return}
  const res=[];
  for(const x of D.vocab){const hay=[x.japanese,x.romaji,x.meaning,x.kanji].join(' ').toLowerCase();if(hay.includes(t))res.push({type:'Từ vựng',unit:x.unit,title:x.japanese||x.kanji,sub:`${x.romaji||''} · ${x.meaning||''}`})}
  for(const x of D.kanji){const hay=[x.kanji,x.hanviet,x.hiragana,x.meaning].join(' ').toLowerCase();if(hay.includes(t))res.push({type:'Kanji',unit:x.unit,title:x.kanji||x.hanviet,sub:`${x.hanviet||''} · ${x.hiragana||''} · ${x.meaning||''}`})}
  for(const [u,g] of Object.entries(D.grammar)){for(const s of g.sections){const hay=[s.title,...s.lines].join(' ').toLowerCase();if(hay.includes(t))res.push({type:'Ngữ pháp',unit:Number(u),title:s.title,sub:s.lines.find(x=>JP_RE.test(x))||s.lines[0]||''})}}
  $('#app').innerHTML=`<div class="page-head"><div><h1>Kết quả tìm kiếm</h1><div class="stats">${res.length} kết quả</div></div><button class="back" onclick="showHome()">← Về trang chủ</button><div></div></div><div class="search-results">${res.length?res.slice(0,80).map(r=>`<div class="result-card" onclick="openSearchResult('${r.type}',${r.unit})"><b>${esc(r.title)}</b><div class="muted">${esc(r.type)} · Bài ${r.unit}</div><div>${esc(r.sub)}</div></div>`).join(''):'<div class="empty">Không tìm thấy.</div>'}</div>`;
}
function openSearchResult(type,unit){if(type==='Từ vựng'||type==='Kanji')openModule(unit,type==='Từ vựng'?'vocab':'kanji','list');else openModule(unit,'grammar','view')}

/* ───────── Phím tắt toàn trang ─────────
   Flashcard : ← Trước · → Tiếp · Space/Enter/↑/↓ lật thẻ · P phát âm
   Kiểm tra  : 1–4 chọn đáp án · → hoặc Enter/Space câu tiếp · ← câu trước
   Chung     : Esc đóng ô tìm kiếm                                              */
function quizKey(e){
  const q=state.quiz,k=e.key; if(!q)return false;
  if(q.done){
    if(k==='ArrowLeft'){prevQuiz();return true}
    if(k==='Enter'||k===' '){startQuiz(q.kind);return true}
    return false;
  }
  const qq=curQ(); if(!qq)return false;
  if(k==='ArrowLeft'){if(q.pos>0){prevQuiz();return true}return false}
  if(k==='ArrowRight'){if(qq.answered){nextQuiz();return true}return false}
  if(k==='Enter'||k===' '){
    if(qq.answered){nextQuiz();return true}
    if(qq.type==='fill'){const fi=$('#fillInput');if(fi){fi.focus();return true}}
    return false;
  }
  if(/^[1-9]$/.test(k)&&qq.type==='mc'&&!qq.answered){const i=Number(k)-1;if(i<qq.options.length){answerQuiz(i);return true}}
  return false;
}
document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.isComposing||e.keyCode===229)return; // đang gõ IME tiếng Nhật: Enter dùng để chốt chữ, không submit
  const t=e.target,tag=t&&t.tagName;
  if(e.key==='Escape'){if(closeSearch())e.preventDefault();return}
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(t&&t.isContentEditable)){
    if(t.id==='fillInput'){
      if(e.key==='Enter'){e.preventDefault();submitFill()}
      else if(e.key==='ArrowLeft'&&!t.value&&state.quiz&&state.quiz.pos>0){e.preventDefault();prevQuiz()}
    }
    return;
  }
  const onBtn=tag==='BUTTON'||tag==='A',k=e.key;
  if((k==='Enter'||k===' ')&&onBtn)return; // để nút đang focus tự xử lý click
  if(state.mode==='flash'){
    if(k==='ArrowRight'){e.preventDefault();nextCard()}
    else if(k==='ArrowLeft'){e.preventDefault();prevCard()}
    else if(k===' '||k==='Enter'||k==='ArrowUp'||k==='ArrowDown'){e.preventDefault();flipCard()}
    else if(k==='p'||k==='P'){speakCard()}
  }else if(state.mode==='quiz'){
    if(quizKey(e))e.preventDefault();
  }
});

renderHome();
