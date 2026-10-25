/* ETIB: закладки (ароматы — в каталоге, блоки шпаргалки — на главной) */
(function(){
/* режима «крупный шрифт» больше нет: убираем его след у тех, кто успел включить */
try{localStorage.removeItem('etib-big')}catch(e){}document.documentElement.classList.remove('big');
var KEY='etib-fav-v1';
function get(p){try{return(JSON.parse(localStorage.getItem(KEY))||[]).filter(function(f){return f.id&&f.id[0]===p})}catch(e){return[]}}
function all(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return[]}}
function put(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
function has(id){return all().some(function(f){return f.id===id})}
function toggle(f){var a=all(),i=a.findIndex(function(x){return x.id===f.id});if(i<0)a.push(f);else a.splice(i,1);put(a);return i<0}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var STAR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.7l-5.4 3 1.2-6L3.3 9.5l6.1-.7z"/></svg>';
var tt;function toast(m){var t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}
 t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('on')},3200)}
function paint(b,f){var on=has(f.id);b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',(on?'Убрать из закладок: ':'Добавить в закладки: ')+f.n)}
function mk(f,after){var b=document.createElement('button');b.type='button';b.className='fav';b.innerHTML=STAR;paint(b,f);
 b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var added=toggle(f);paint(b,f);b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');after(added)});return b}

/* каталог: звёздочка на карточке и отдельная кнопка «Закладки» только с ароматами */
var grid=document.getElementById('grid');
if(grid&&document.body.dataset.sec==='cat'){
 var on=false,q=document.getElementById('q');
 var ft=document.createElement('button');ft.type='button';ft.className='favtog';
 var nts=document.getElementById('notes');if(nts)nts.insertAdjacentElement('afterend',ft);else{var main=document.querySelector('main');main.insertBefore(ft,main.firstChild)}
 var note=document.createElement('p');note.className='favnote';note.hidden=true;grid.parentNode.insertBefore(note,grid);
 var sync=function(){var n=get('a').length;ft.innerHTML=STAR+'<span>'+(on?'Показать все ароматы':'Закладки')+'</span><b>'+n+'</b>';ft.setAttribute('aria-pressed',on);
  ft.setAttribute('aria-label','Закладки: '+n+(on?'. Показать все ароматы':'. Показать только ароматы из закладок'));
  grid.classList.toggle('favonly',on);note.hidden=!on;
  note.textContent=n?'Показаны только ароматы из закладок.':'Закладок пока нет. Нажмите ★ на фото аромата, чтобы добавить его.';
  grid.querySelectorAll('article.card').forEach(function(c){c.classList.toggle('isfav',has(c.dataset.fid))})};
 var setOn=function(v){on=v;if(on&&q&&q.value){q.value='';q.dispatchEvent(new Event('input',{bubbles:true}))}sync();if(on)ft.scrollIntoView({block:'start'})};
 ft.onclick=function(){setOn(!on)};
 var inject=function(){grid.querySelectorAll('article.card:not([data-fv])').forEach(function(c){c.dataset.fv=1;
  var no=((c.querySelector('.no')||{}).textContent||'').trim(),nm=((c.querySelector('h3')||{}).textContent||'').trim();if(!no)return;
  var f={id:'a:'+no,n:no+' '+nm};c.dataset.fid=f.id;
  (c.querySelector('.art')||c).appendChild(mk(f,function(added){sync();toast(added?'Добавлено в закладки: '+no+'. Весь список: кнопка «Закладки» вверху':'Убрано из закладок: '+no)}))});sync()};
 new MutationObserver(inject).observe(grid,{childList:true});inject();
 var byHash=function(){var m=/^#n=(.+)$/.exec(location.hash);
  if(m){var v='';try{v=decodeURIComponent(m[1])}catch(e){v=m[1]}if(on){on=false;sync()}if(q){q.value=v;q.dispatchEvent(new Event('input',{bubbles:true}))}history.replaceState(null,'',location.pathname+location.search);window.scrollTo(0,0)}
  else if(location.hash==='#fav'){history.replaceState(null,'',location.pathname+location.search);setOn(true)}};
 byHash();addEventListener('hashchange',byHash);
}

/* шпаргалка: звёздочка у блоков, закладки видны на главной */
if(typeof DL!=='undefined'){
 var nz=function(s){return s.replace(/\s+/g,' ').trim().toLowerCase().replace(/ё/g,'е')};
 var TN={sell:'Как продавать',price:'Бонусы и скидки',rep:'Смена и отчёт',memo:'Памятки',facts:'Интересные факты'};
 document.querySelectorAll('details.sec>summary').forEach(function(s){
  var sec=s.closest('section[id^="p-"]');if(!sec)return;
  var t=sec.id.slice(2),title=s.textContent.trim(),x=nz(title),ks=Object.keys(DL).filter(function(k){return DL[k][0]===t});
  var slug=ks.find(function(k){return nz(DL[k][1])===x})||ks.find(function(k){return x.indexOf(nz(DL[k][1]))>=0});
  if(!slug){var hs=[].slice.call(s.parentElement.querySelectorAll('summary,h3')).map(function(h){return nz(h.textContent)});
   slug=ks.find(function(k){return hs.some(function(h){return h===nz(DL[k][1])||h.indexOf(nz(DL[k][1]))===0})})}
  if(slug)s.appendChild(mk({id:'b:'+t+'/'+slug,n:title,s:TN[t],u:'sales.html#'+t+'/'+slug,k:t},function(added){toast(added?'Добавлено в закладки. Список — на главной странице':'Убрано из закладок')}))})}

/* главная: закладки из шпаргалки */
var list=document.getElementById('list'),sf=document.getElementById('sf');
if(list&&sf){
 var box=document.createElement('section');box.className='favs';list.parentNode.insertBefore(box,document.getElementById('res'));
 var draw=function(){var a=get('b');
  box.innerHTML='<h2>Мои закладки</h2>'+(a.length?'<ul>'+a.map(function(f){return'<li style="--k:var(--k-'+esc(f.k)+',var(--accent))"><a href="'+esc(f.u)+'"><b>'+esc(f.n)+'</b><small>'+esc(f.s)+'</small></a><button type="button" class="rm" data-id="'+esc(f.id)+'" aria-label="Убрать из закладок: '+esc(f.n)+'">×</button></li>'}).join('')+'</ul>'
  :'<p class="favhint">Пока пусто. В шпаргалке нажмите ★ у нужного блока, и он появится здесь. Ароматы собираются в каталоге, кнопкой «Закладки».</p>')};
 box.addEventListener('click',function(e){var b=e.target.closest('.rm');if(!b)return;put(all().filter(function(f){return f.id!==b.dataset.id}));draw()});
 draw();addEventListener('pageshow',draw);addEventListener('storage',draw)}
})();

/* итоговый отчёт: плашка сверху, экран заполнения, черновик */
(function(){
var DK='etib-report-draft',KEEP=['r-t','r-name'];
var F=[
 ['h','Кто заполняет'],
 ['r-t','Торговая точка','t'],['r-name','ФИО','t','name'],
 ['h','Касса'],
 ['r-m','Остаток на утро'],['r-pl','План'],
 ['r-f','Факт','n','','Эвотор: «Продажи»'],['r-n','Нал','n','','Эвотор: «В кассе»'],
 ['r-e','Расход','n','','Чек приложить'],['r-p','Промо'],
 ['r-ed','На что расход','t','','','w2','150 салфетка, 150 бумага'],
 ['r-i','Инкассация','n','','','w2'],
 ['r-id','Описание инкассации','t','','','w2','Например: забрал руководитель'],
 ['h','Продажи'],
 ['r-bs','БС'],['r-rk','Р/К'],['r-a','Акция'],['r-o','Одиночные'],['r-c','Консультации'],['r-d','Доп','t','','','','3 авто 1 диф']
];
var IDS=F.filter(function(f){return f[0]!=='h'}).map(function(f){return f[0]});
function today(){return new Date().toLocaleDateString('ru-RU')}
function hm(){return new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
function rub(n){n=Math.round((n+Number.EPSILON)*100)/100;return n.toLocaleString('ru-RU',{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2})+' ₽'}
function load(){try{return JSON.parse(localStorage.getItem(DK))||null}catch(e){return null}}
function cur(){var o=load();if(!o)return{};if(o.d===today())return o;var k={};KEEP.forEach(function(id){if(o[id])k[id]=o[id]});return k}
function hasDraft(){var o=load();return!!o&&o.d===today()&&IDS.some(function(id){return KEEP.indexOf(id)<0&&String(o[id]||'').trim()!==''})}
var root=null,inp={};
function val(id){return inp[id]?inp[id].value:(cur()[id]||'')}
function num(id){return parseFloat(val(id))||0}
function save(){if(!root)return;var o={d:today(),t:hm()};IDS.forEach(function(id){o[id]=inp[id].value});
 try{localStorage.setItem(DK,JSON.stringify(o));note('Черновик сохранён · '+o.t)}catch(e){note('Черновик не сохраняется: память браузера недоступна')}paintBar()}
function note(t){if(root)root.querySelector('.rp-top small').textContent=t}
function text(){var m=num('r-m'),f=num('r-f'),n=num('r-n'),e=num('r-e'),p=num('r-p'),i=num('r-i');
 var ost=m+n-e-p-i,bn=f-n,s=function(id){return val(id).trim()},q=function(id){return String(num(id))},D=function(id){var x=s(id);return x?' ('+x+')':''};
 var L=[new Date().toLocaleDateString('ru-RU'),'','Торговая точка: '+s('r-t'),'ФИО: '+s('r-name'),
  'Остаток на утро: '+rub(m),'План: '+rub(num('r-pl')),'Факт: '+rub(f),'Нал: '+rub(n),'Б/н: '+rub(bn),
  'Расход: '+rub(e)+D('r-ed'),'БС: '+q('r-bs'),'Р/К: '+q('r-rk'),'Промо: '+rub(p),
  'Доп: '+s('r-d'),'Инкассация: '+rub(i)+D('r-id'),'Акция: '+q('r-a'),
  'Одиночные: '+q('r-o'),'Консультации: '+q('r-c'),'Остаток на вечер: '+rub(ost)];
 return{text:L.join('\n'),ost:ost,bn:bn}}
function calc(){var r=text(),w=[];
 var e=inp['r-e'].value!==''&&num('r-e')>0||inp['r-ed'].value.trim()!=='',i=num('r-i')>0||inp['r-id'].value.trim()!=='';
 inp['r-ed'].parentNode.hidden=!e;inp['r-id'].parentNode.hidden=!i;
 if(num('r-e')>0&&!inp['r-ed'].value.trim())w.push('Укажи, на что расход.');
 if(num('r-i')>0&&!inp['r-id'].value.trim())w.push('Добавь описание инкассации.');
 root.querySelector('.rp-sum').innerHTML='<span>Остаток на вечер <b class="big">'+rub(r.ost)+'</b></span><span>Б/н <b>'+rub(r.bn)+'</b></span>';
 root.querySelector('.rp-warn').textContent=w.join(' ')}
var SVG_X='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
function build(){
 root=document.createElement('div');root.className='rp';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Итоговый отчёт');
 var h='<div class="rp-top"><div><h2>Итоговый отчёт</h2><small></small></div><button type="button" class="rp-x" aria-label="Свернуть отчёт (черновик сохранится)">'+SVG_X+'</button></div><div class="rp-body"><div class="rp-in">',open=false;
 F.forEach(function(f){
  if(f[0]==='h'){if(open)h+='</div>';h+='<div class="rp-h">'+f[1]+'</div><div class="rp-g">';open=true;return}
  var id=f[0],t=f[2]==='t';
  h+='<div class="rp-f'+(f[5]?' '+f[5]:'')+'"><label for="rp-'+id+'">'+f[1]+'</label><input id="rp-'+id+'" data-k="'+id+'" '+(t?'type="text" autocomplete="'+(f[3]||'off')+'"':'type="number" step="any" inputmode="decimal"')+' enterkeyhint="next"'+(f[6]?' placeholder="'+f[6]+'"':'')+'>'+(f[4]?'<small>'+f[4]+'</small>':'')+'</div>'});
 h+='</div></div></div><div class="rp-bar"><div class="rp-sum"></div><div class="rp-warn"></div><div class="rp-btns"><button type="button" class="main" data-a="copy">Скопировать отчёт</button><button type="button" data-a="clr">Очистить</button></div></div>';
 root.innerHTML=h;document.body.appendChild(root);
 IDS.forEach(function(id){var el=root.querySelector('[data-k="'+id+'"]');inp[id]=el;el.addEventListener('input',function(){calc();save()})});
 root.querySelector('.rp-x').onclick=close;
 root.querySelector('[data-a="copy"]').onclick=function(ev){var b=ev.currentTarget,t=text().text;
  function ok(m){b.textContent=m;setTimeout(function(){b.textContent='Скопировать отчёт'},1800)}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){ok('Скопировано')},fb)}else fb();
  function fb(){var a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();var r=false;try{r=document.execCommand('copy')}catch(e){}a.remove();ok(r?'Скопировано':'Не удалось скопировать')}};
 root.querySelector('[data-a="clr"]').onclick=function(){if(!confirm('Очистить черновик отчёта? Точка и ФИО останутся.'))return;
  IDS.forEach(function(id){if(KEEP.indexOf(id)<0)inp[id].value=''});calc();save();note('Черновик очищен')};
}
function fill(){var c=cur();IDS.forEach(function(id){inp[id].value=c[id]!=null?c[id]:''});calc();
 var o=load();note(hasDraft()?'Черновик за сегодня'+(o&&o.t?' · '+o.t:''):'Черновик сохраняется сам')}
function open(){if(!root)build();fill();root.hidden=false;document.documentElement.style.overflow='hidden';root.querySelector('.rp-body').scrollTop=0}
function close(){if(!root||root.hidden)return;save();root.hidden=true;document.documentElement.style.overflow='';paintBar()}
function paintBar(){var b=document.getElementById('rrep');if(!b)return;var d=hasDraft();
 b.textContent=d?'Продолжить итоговый отчёт · черновик':'Открыть итоговый отчёт';
 b.classList.toggle('draft',d)}
function init(){
 paintBar();
 addEventListener('pageshow',paintBar);addEventListener('storage',paintBar);
 document.addEventListener('visibilitychange',function(){if(document.hidden)save();else paintBar()});
 addEventListener('pagehide',save);
 document.addEventListener('keydown',function(e){if(e.key==='Escape')close()})}
window.etibReport={open:open,close:close};
if(document.body)init();else document.addEventListener('DOMContentLoaded',init);
})();
