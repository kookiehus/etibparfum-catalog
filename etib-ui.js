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
 var m=/^#n=(.+)$/.exec(location.hash);
 if(m){if(q){q.value=decodeURIComponent(m[1]);q.dispatchEvent(new Event('input',{bubbles:true}))}history.replaceState(null,'',location.pathname+location.search)}
 else if(location.hash==='#fav'){history.replaceState(null,'',location.pathname+location.search);setOn(true)}
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
