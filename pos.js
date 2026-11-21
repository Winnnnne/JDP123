// Japanese Study — Từ loại (danh từ · động từ · tính từ · từ loại khác)
// Dữ liệu: window.POS_DATA (pos-data.js), dựng từ file "Tổng hợp từ vựng Unit 4–7 theo từ loại"
const PD=window.POS_DATA;
let posType='mix'; // mix | w2vi | vi2w | listen | typed | te
const POS_LABEL={w2vi:'Nghĩa của từ',vi2w:'Chọn từ tiếng Nhật',listen:'Nghe – chọn nghĩa',typed:'Gõ từ',te:'Chia thể て'};
const POS_CATS=()=>PD.cats;
const posCat=id=>PD.cats.find(c=>c.id===id);

/* ───────── Lấy dữ liệu theo bộ lọc ───────── */
function posAll(cat){ // tất cả từ của 1 loại (hoặc mọi loại), chưa lọc
  const out=[];
  PD.cats.forEach(c=>{if(cat!=='all'&&c.id!==cat)return;c.groups.forEach((g,gi)=>g.items.forEach(it=>out.push(Object.assign({cat:c.id,gi,gt:g.title},it))))});
  return out;
}
function posItems(){
  return posAll(state.cat).filter(x=>{
    if(state.pu!=='all'&&!x.u.includes(Number(state.pu)))return false;
    if(state.pg!=='all'){return state.cat==='all'?x.cat===state.pg:String(x.gi)===String(state.pg)}
    return true;
  });
}
const posEligible=(type,items)=>type==='typed'?items.filter(x=>x.typ):type==='te'?items.filter(x=>x.te):items;
function posQuizCap(){
  const it=posItems();
  if(posType==='mix')return Math.min(50,it.length);
  const el=posEligible(posType,it);
  return Math.min(50,posType==='vi2w'||posType==='typed'||posType==='listen'?new Set(el.map(x=>x.vi)).size:el.length);
}

/* ───────── Gõ từ: romaji → kana, chuẩn hoá để so sánh ───────── */
const _RM=(()=>{
  const t={};
  const add=(s,k)=>s.split(' ').forEach((r,i)=>t[r]=k[i]);
  add('a i u e o','あいうえお');
  add('ka ki ku ke ko','かきくけこ');add('ga gi gu ge go','がぎぐげご');
  add('sa shi su se so','さしすせそ');add('si','し');add('za ji zu ze zo','ざじずぜぞ');add('zi','じ');
  add('ta chi tsu te to','たちつてと');add('ti tu','ちつ');add('da di du de do','だぢづでど');
  add('na ni nu ne no','なにぬねの');add('ha hi fu he ho','はひふへほ');add('hu','ふ');
  add('ba bi bu be bo','ばびぶべぼ');add('pa pi pu pe po','ぱぴぷぺぽ');add('ma mi mu me mo','まみむめも');
  add('ya yu yo','やゆよ');add('ra ri ru re ro','らりるれろ');add('wa wo','わを');
  const ys={k:'き',g:'ぎ',s:'し',z:'じ',t:'ち',n:'に',h:'ひ',b:'び',p:'ぴ',m:'み',r:'り'};
  for(const c in ys)['a','u','o'].forEach((v,i)=>t[c+'y'+v]=ys[c]+['ゃ','ゅ','ょ'][i]);
  [['sha','しゃ'],['shu','しゅ'],['sho','しょ'],['sya','しゃ'],['syu','しゅ'],['syo','しょ'],['cha','ちゃ'],['chu','ちゅ'],['cho','ちょ'],['cya','ちゃ'],['cyu','ちゅ'],['cyo','ちょ'],['ja','じゃ'],['ju','じゅ'],['jo','じょ'],['jya','じゃ'],['jyu','じゅ'],['jyo','じょ'],['fa','ふぁ'],['fi','ふぃ'],['fe','ふぇ'],['fo','ふぉ'],['tsa','つぁ'],['xtsu','っ'],['ltu','っ']].forEach(([a,b])=>t[a]=b);
  return t;
})();
const _RMK=Object.keys(_RM).sort((a,b)=>b.length-a.length);
function romajiToKana(s){
  s=String(s).toLowerCase().replace(/[^a-z\-']/g,'');
  let out='',i=0;
  while(i<s.length){
    const c=s[i];
    if(c==='-'){out+='ー';i++;continue}
    if(c==="'"){i++;continue}
    if(i+1<s.length&&c===s[i+1]&&/[bcdfghjklmpqrstvwxyz]/.test(c)){out+='っ';i++;continue}
    const k=_RMK.find(x=>s.startsWith(x,i));
    if(k){out+=_RM[k];i+=k.length;continue}
    if(c==='n'){out+='ん';i++;continue}
    i++; // ký tự không nhận ra: bỏ qua
  }
  return out;
}
const _V={'あ':'ぁあかがさざただなはばぱまやゃらわ','い':'ぃいきぎしじちぢにひびぴみり','う':'ぅうくぐすずつづぬふぶぷむゆゅるゔ','え':'ぇえけげせぜてでねへべぺめれ','お':'ぉおこごそぞとどのほぼぽもよょろをん'};
function kanaNorm(s){
  s=String(s).normalize('NFKC').replace(/[\s\u3000・、。,.?？!！]/g,'');
  s=s.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)); // katakana → hiragana
  let out='';
  for(const ch of s){
    if(ch==='ー'&&out){const p=out[out.length-1];const v=Object.keys(_V).find(k=>_V[k].includes(p));out+=v||'ー'}else out+=ch;
  }
  return out;
}
function posCheck(accList){const acc=accList.map(kanaNorm);return v=>{const t=/[a-zA-Z]/.test(v)?romajiToKana(v):v;return acc.includes(kanaNorm(t))}}

/* ───────── Tạo câu hỏi (mỗi từ chỉ xuất hiện 1 lần trong 1 bài) ───────── */
function posDistractors(it,field,n=3){
  const pool=posAll('all').filter(x=>x.id!==it.id&&x.vi!==it.vi); // loại từ cùng nghĩa để không có 2 đáp án đúng
  const tier=(arr)=>shuffle(arr);
  const same=tier(pool.filter(x=>x.cat===it.cat&&x.gi===it.gi)),cat=tier(pool.filter(x=>x.cat===it.cat&&x.gi!==it.gi)),rest=tier(pool.filter(x=>x.cat!==it.cat));
  const correct=it[field],out=[];
  for(const x of [...same,...cat,...rest]){const v=x[field];if(v&&v!==correct&&!out.includes(v)){out.push(v);if(out.length>=n)break}}
  return out;
}
function teWrong(it){
  const te=it.te,g1=it.cat==='verb'&&it.gi===0;
  let stem,end,pool;
  const m=g1?te.match(/(って|んで|いて|いで|して)$/):null;
  if(m){stem=te.slice(0,-m[0].length);end=m[0];pool=['って','んで','いて','いで','して']}
  else{stem=te.slice(0,-1);end='て';pool=['って','んで','いて','して']} // nhóm 2/3: て đi ngay sau gốc động từ
  return shuffle(pool.filter(e=>e!==end)).slice(0,3).map(e=>stem+e);
}
const posExplain=it=>`<span class="jp-line">${esc(it.w)}</span> · ${esc(it.ro)} = <b>${esc(it.vi)}</b>${it.te?`<div class="muted">Thể て: <b>${esc(it.te)}</b></div>`:''}<div class="muted">${esc(it.gt)} · Unit ${esc(it.ref)}</div>`;
const posKind=it=>it.cat==='verb'?'động từ':it.cat==='adj'?'tính từ':it.cat==='noun'?'danh từ':'từ';
function posQuestion(type,it){
  if(type==='w2vi')return mcQ(POS_LABEL.w2vi,`Từ <span class="jp-line">${esc(it.w)}</span> có nghĩa là gì?`,it.vi,posDistractors(it,'vi'),posExplain(it));
  if(type==='vi2w')return mcQ(POS_LABEL.vi2w,`Từ tiếng Nhật nào có nghĩa là <b>“${esc(it.vi)}”</b>?`,it.w,posDistractors(it,'w'),posExplain(it));
  if(type==='listen')return Object.assign(mcQ(POS_LABEL.listen,'🎧 Nghe từ và chọn nghĩa đúng',it.vi,posDistractors(it,'vi'),posExplain(it)),{audio:it.say});
  if(type==='typed')return {type:'fill',label:POS_LABEL.typed,html:`Gõ từ tiếng Nhật có nghĩa là <b>“${esc(it.vi)}”</b>${it.cat==='verb'?' <span class="muted">(dạng ます)</span>':''}`,answer:it.acc.join(' / '),explain:posExplain(it),answered:false,userText:'',ok:null,check:posCheck(it.acc),ph:'Gõ hiragana hoặc romaji…',maxlen:24,hint:'Gõ bằng hiragana/katakana hoặc romaji (vd: kuruma, kyou). Với từ katakana có ー, gõ dấu “-” (vd: ko-su).'};
  if(type==='te'){ // xen kẽ trắc nghiệm / tự gõ
    posTeFlip=!posTeFlip;
    if(posTeFlip)return {type:'fill',label:POS_LABEL.te,html:`Chia thể て của <span class="jp-line">${esc(it.w)}</span> <span class="muted">(${esc(it.vi)})</span>`,answer:it.te,explain:posExplain(it),answered:false,userText:'',ok:null,check:posCheck([it.te]),ph:'Gõ thể て (hiragana/romaji)…',maxlen:24,hint:'Gõ thể て bằng hiragana hoặc romaji (vd: atte, tsukutte).'};
    return mcQ(POS_LABEL.te,`Thể て của <span class="jp-line">${esc(it.w)}</span> <span class="muted">(${esc(it.vi)})</span> là gì?`,it.te,teWrong(it),posExplain(it));
  }
}
let posTeFlip=false;
function buildPos(total){
  const items=posItems();
  const types=posType==='mix'?['te','typed','listen','w2vi','vi2w'].filter(t=>posEligible(t,items).length):[posType];
  if(!types.length||!items.length)return [];
  const used=new Set(),out=[];
  const usedVi=new Set(); // câu hỏi theo nghĩa (chọn từ / gõ từ) không được trùng nghĩa trong cùng bài
  const byMeaning=t=>t==='vi2w'||t==='typed'||t==='listen';
  const take=(type,k)=>{
    const pool=shuffle(posEligible(type,items).filter(x=>!used.has(x.id)&&!(byMeaning(type)&&usedVi.has(x.vi))));
    let got=0;for(const it of pool){if(got>=k)break;if(byMeaning(type)){if(usedVi.has(it.vi))continue;usedVi.add(it.vi)}used.add(it.id);out.push(posQuestion(type,it));got++}
    return got;
  };
  if(posType==='mix'){
    const base=Math.floor(total/types.length);let rem=total-base*types.length;
    const quota={};types.forEach(t=>quota[t]=base);shuffle(types).slice(0,rem).forEach(t=>quota[t]++);
    let short=0;
    for(const t of types){short+=quota[t]-take(t,quota[t])} // dạng kén dữ liệu làm trước
    // dạng nào hết từ thì dạng khác bù (vẫn không trùng từ)
    for(let g=0;short>0&&g<20;g++){for(const t of shuffle(types)){if(short<=0)break;short-=take(t,1)}}
  }else take(posType,total);
  return shuffle(out).slice(0,total);
}

/* ───────── Giao diện ───────── */
function showPosHub(){state=freshState({type:'pos',mode:'hub'});renderModule();scrollTo(0,0)}
function openPos(cat,mode,extra){
  state=freshState(Object.assign({type:'pos',cat,mode:mode||'list',pu:'all',pg:'all',idx:0},extra||{}));
  renderModule();scrollTo(0,0);
}
function posMode(m){state.mode=m;state.idx=0;state.flipped=false;state.quiz=null;renderModule()}
function posSetUnit(u){state.pu=u;state.idx=0;state.flipped=false;state.quiz=null;renderModule()}
function posSetGroup(g){state.pg=g;state.idx=0;state.flipped=false;state.quiz=null;renderModule()}
function setPosType(t){posType=t;startQuiz('pos')}
function qPlayAudio(){const qq=curQ();if(qq&&qq.audio&&typeof ttsSpeak==='function')ttsSpeak(qq.audio)}
function quizAutoAudio(){
  const qq=state.mode==='quiz'&&state.quiz&&!state.quiz.done?curQ():null;
  if(qq&&qq.audio&&!qq.answered&&!qq.played){qq.played=true;qPlayAudio()}
}
function posTypeBar(){
  const items=posItems();
  const defs=[['mix','🔀 Hỗn hợp'],['w2vi','Nghĩa của từ'],['vi2w','Chọn từ'],['listen','🎧 Nghe'],['typed','⌨ Gõ từ'],['te','Chia thể て']];
  return `<div class="toolbar quiz-types">${defs.map(([k,l])=>{const n=k==='mix'?items.length:posEligible(k,items).length;return `<button class="pill ${posType===k?'active':''}" ${n?'':'disabled'} onclick="setPosType('${k}')" ${n?'':'title="Không có từ phù hợp trong bộ lọc này"'}>${l}</button>`}).join('')}</div>`;
}
function posFilters(){
  const c=state.cat==='all'?null:posCat(state.cat);
  const units=['all',4,5,6,7].map(u=>`<button class="pill ${String(state.pu)===String(u)?'active':''}" onclick="posSetUnit('${u}')">${u==='all'?'Tất cả bài':'Bài '+u}</button>`).join('');
  const opts=state.cat==='all'?PD.cats.map(x=>[x.id,x.title]):c.groups.map((g,i)=>[i,g.title]);
  const sel=`<select class="sp-sec" onchange="posSetGroup(this.value)" aria-label="Lọc theo nhóm"><option value="all">${state.cat==='all'?'Tất cả từ loại':c.id==='noun'?'Tất cả chủ đề':'Tất cả nhóm'}</option>${opts.map(([v,t])=>`<option value="${esc(v)}" ${String(state.pg)===String(v)?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
  return `<div class="pos-filters"><div class="toolbar" style="margin:0">${units}</div>${(state.cat==='all'||c.groups.length>1)?sel:''}<span class="muted">${posItems().length} từ</span></div>`;
}
function posBack(x){return `${esc(x.vi)}<div class="romaji">${esc(x.ro)}</div>${x.te?`<div class="muted" style="font-size:18px;margin-top:8px">Thể て: <b>${esc(x.te)}</b></div>`:''}<div class="muted" style="font-size:14px;margin-top:8px">${esc(x.gt)} · Unit ${esc(x.ref)}</div>`}
function posList(){
  const items=posItems();if(!items.length)return '<div class="empty">Không có từ nào trong bộ lọc này.</div>';
  const hasTe=items.some(x=>x.te);
  const groups=[];items.forEach(x=>{const k=x.cat+'|'+x.gi;let g=groups.find(y=>y.k===k);if(!g){g={k,t:x.gt,rows:[]};groups.push(g)}g.rows.push(x)});
  return groups.map(g=>`<h3 class="pos-gt">${esc(g.t)} <span class="muted">(${g.rows.length})</span></h3><div class="table-wrap" style="margin-bottom:18px"><table><thead><tr><th>Từ</th>${hasTe?'<th>Thể て</th>':''}<th>Romaji</th><th>Nghĩa</th><th>Unit</th><th></th></tr></thead><tbody>${g.rows.map(x=>`<tr><td class="jp">${esc(x.w)}</td>${hasTe?`<td class="jp">${esc(x.te||'')}</td>`:''}<td>${esc(x.ro)}</td><td>${esc(x.vi)}</td><td>${esc(x.ref)}</td><td><button class="sp-mini" data-say="${esc(x.say)}" onclick="spSayEl(this)" title="Nghe">🔊</button></td></tr>`).join('')}</tbody></table></div>`).join('');
}
function posHub(){
  const total=posAll('all').length;
  const cards=PD.cats.map(c=>{
    const n=posAll(c.id).length;
    const chips=c.groups.map((g,i)=>`<button class="pill" onclick="openPos('${c.id}','quiz',{pg:${i}})" title="Kiểm tra riêng nhóm này">${esc(g.title)} · ${g.items.length}</button>`).join('');
    return `<article class="sp-card pos-card"><h3>${c.icon} ${esc(c.title)}</h3><div class="muted">${esc(c.sub)} · ${n} từ</div><div class="module-buttons" style="margin:12px 0"><button class="action" onclick="openPos('${c.id}','list')">Danh sách</button><button class="action" onclick="openPos('${c.id}','flash')">Flashcard</button><button class="action primary" onclick="openPos('${c.id}','quiz')">Kiểm tra cả loại</button></div><div class="muted" style="font-size:13px;margin-bottom:6px">Hoặc kiểm tra riêng từng ${c.id==='noun'?'chủ đề':'nhóm'}:</div><div class="toolbar" style="margin:0">${chips}</div></article>`;
  }).join('');
  return `<div class="note"><b>Kiểm tra theo từ loại:</b> chọn loại từ, rồi chọn dạng câu hỏi — nghĩa của từ, chọn từ tiếng Nhật, nghe và chọn nghĩa, gõ từ (hiragana hoặc romaji) và chia thể て (động từ). Có thể lọc theo bài (4–7) và theo chủ đề/nhóm, tối đa 50 câu, mỗi từ chỉ hỏi một lần.</div><div class="sp-grid">${cards}<article class="sp-card pos-card"><h3>📚 Tất cả từ loại</h3><div class="muted">trộn cả 4 loại · ${total} từ</div><div class="module-buttons" style="margin-top:12px"><button class="action" onclick="openPos('all','list')">Danh sách</button><button class="action" onclick="openPos('all','flash')">Flashcard</button><button class="action blue" onclick="openPos('all','quiz')">Kiểm tra tổng hợp</button></div></article></div>`;
}
function renderPos(){
  if(state.mode==='hub'){
    $('#app').innerHTML=`<div class="page-head"><div><button class="back" onclick="showHome()">← Trang chủ</button></div><div><h1>📚 Từ loại</h1><div class="stats">Danh từ · Động từ · Tính từ · Từ loại khác</div></div><div></div></div>${posHub()}`;
    return;
  }
  const c=state.cat==='all'?{icon:'📚',title:'Tất cả từ loại'}:posCat(state.cat);
  const t=(m,l)=>`<button class="pill ${state.mode===m?'active':''}" onclick="posMode('${m}')">${l}</button>`;
  const body=state.mode==='list'?posList():state.mode==='flash'?flashView():quizView('pos');
  $('#app').innerHTML=`<div class="page-head"><div><button class="back" onclick="showPosHub()">← Từ loại</button></div><div><h1>${c.icon} ${esc(c.title)}</h1><div class="stats">Unit 4–7 · ${posAll(state.cat).length} từ</div></div><div></div></div><div class="toolbar">${t('list','Danh sách')}${t('flash','Flashcard')}${t('quiz','Kiểm tra')}</div>${posFilters()}${body}`;
  const fi=$('#fillInput');if(fi&&!fi.disabled)fi.focus();
  const fbk=$('#feedback');if(fbk&&fbk.scrollIntoView)fbk.scrollIntoView({block:'nearest',behavior:'smooth'});
  quizAutoAudio();
}
