/* ETIB: Помощник — бот-подсказчик по сайту (без ИИ, без интернета). Данные: helper-data.json (python3 build_helper.py) */
(function(root){
'use strict';
var D=null,LK={'А':'A','В':'B','С':'C','Е':'E','Н':'H','К':'K','М':'M','О':'O','Р':'P','Т':'T','Х':'X'};
function norm(s){return String(s).toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/g,' ').trim()}
function st(w){return w.length>=5?w.slice(0,4):w.length===4?w.slice(0,3):w}
function toks(s){return norm(s).split(' ').filter(function(w){return w.length>1}).map(st)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var STOP=toks('что кто как мне нам для надо нужно хочу есть чтобы или это там тут какой какая какие где можно подскажи покажи найди ищу клиент клиенту аромат ароматы запах пахнет что-то чтото чем от про при без над под если факт факты интересный интересное сколько делать говорит говорить сказать подарок подарить подарка повод день рождения');
var SYN0={'сколь':[],'держ':['хват','стойк'],'стойк':['хват','держ'],'хват':['держ','стойк'],'одеж':['одев','внешн'],'одев':['внешн','форма'],'дорог':['возра','цена','скидк'],'возра':['возра'],'десер':['ванил','карам','шокол','пралин','кофе'],'гурма':['ванил','карам','шокол','пралин'],'сладк':[],'свеж':['цитру','бергам','лимон','мандар','грейп','морск'],
 'летн':['цитру','бергам','лимон','мандар','морск'],'зимн':['ванил','амбра','пряно','корица','табак'],'вечер':['ванил','амбра','мускус','табак','пачул'],'дерев':['сандал','кедр','ветив','дубов','древе'],
 'цвето':['роза','жасми','пион','лилия','ирис'],'мускус':['мускус'],'шоко':['шокол'],'кофе':['кофе'],'пряно':['корица','кардам','гвозд','перец'],'табач':['табак'],'сигар':['табак']};
var FEM=toks('жена жене жены мама маме мамы девушка девушке девушки сестра сестре дочь дочери женщина женщине бабушка подруга подруге женский женские женское');
var MAS=toks('муж мужу мужа папа папе папы парень парню брат брату отец отцу мужчина мужчине дедушка друг другу мужской мужские мужское');
var EM0={'ванил':'🍦','роза':'🌹','цитру':'🍋','лимон':'🍋','кофе':'☕','шокол':'🍫','жасми':'🌼','сандал':'🪵','мускус':'☁️','яблок':'🍎','персик':'🍑','клубн':'🍓','мандар':'🍊','кокос':'🥥','мята':'🌿','пион':'🌸'};
function mk(o){var r={};Object.keys(o).forEach(function(k){r[st(k)]=Array.isArray(o[k])?o[k].map(function(x){return st(x)}):o[k]});return r}
var SYN=mk(SYN0),EM=mk(EM0);
var S_FRESH=st('свежий'),S_SWEET=st('сладкий');
var PR=['тёплый, уютный выбор','клиенты это обожают','хит, который редко подводит','всегда находит своих поклонников','с этого легко начать презентацию'];
var OUT=['Хотите уточнить — для мужчины, свежее, на вечер? Просто напишите 😊','Добби может подобрать ещё: напишите ноту, повод или номер аромата 🌸','Не то? Скажите чуть подробнее, и найдём лучше ✨'];
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function prep(d){talkLoad(d);if(d._p)return;d.aromas.forEach(function(a){a._n={};['top','heart','base'].forEach(function(k){a[k].forEach(function(p){toks(p).forEach(function(t){a._n[t]=Math.max(a._n[t]||0,k==='top'?2:3)})})});
 a._m={};toks(a.nm+' '+a.ru+' '+a.n).forEach(function(t){a._m[t]=1});a._t={};toks(a.how+' '+a.whom+' '+a.hooks.join(' ')).forEach(function(t){a._t[t]=1})});
 d.qa=d.qa||[];d.sections.forEach(function(s){s._n={};toks(s.n).forEach(function(t){s._n[t]=1});s._k={};toks(s.k).forEach(function(t){s._k[t]=1});s._x={};toks(s.x).forEach(function(t){s._x[t]=1})});d._p=1}
function code(q){var m=String(q).trim().toUpperCase().match(/^([A-ZА-Я])\s?-?(\d{1,2})$/);if(!m)return null;return(LK[m[1]]||m[1])+m[2]}
function parse(q){var raw=norm(q).split(' ').filter(Boolean),f={cat:null,t:[]},w=[];
 raw.forEach(function(r){var s=st(r);
  if(/^женск|унисе|премиу|мужск/.test(r)){f.cat=r.indexOf('жен')===0?'ЖЕНСКИЕ':r.indexOf('муж')===0?'МУЖСКИЕ':r.indexOf('уни')===0?'УНИСЕКС':'ПРЕМИУМ';return}
  if(FEM.indexOf(s)>=0){f.cat='ЖЕНСКИЕ';return}if(MAS.indexOf(s)>=0){f.cat='МУЖСКИЕ';return}
  if(s===S_FRESH||s===S_SWEET){f.t.push(s);return}
  if(STOP.indexOf(s)<0&&s.length>1&&!/^(из|на|по|за|со|об|во|ко|от|до|ли|бы|же|тако|так)$/.test(s))w.push({s:fz(s,r),raw:r})});return{f:f,w:w}}
function exp(s){return[s].concat(SYN[s]||[])}
function scoreA(a,p){var sc=0,hit={};p.w.forEach(function(x){var best=0;exp(x.s).forEach(function(t,i){var w=(a._n[t]||0)+(a._m[t]?3:0)+(a._t[t]?1:0);if(i>0)w=w*0.6;if(w>best)best=w;if(a._n[t])hit[t]=1});sc+=best});return{sc:sc,hit:hit}}
function inF(a,f){if(f.cat&&a.c!==f.cat)return false;return f.t.every(function(s){return a.t.toLowerCase().indexOf(s)===0||a.t.toLowerCase().indexOf(s)>=0})}
function findA(p){var r=[];D.aromas.forEach(function(a){if(!inF(a,p.f))return;var s=scoreA(a,p);if(p.w.length&&s.sc<=0)return;r.push({a:a,sc:s.sc,hit:s.hit})});
 r.sort(function(x,y){return y.sc-x.sc});return r}
function findS(p){dfs();var r=[];D.sections.forEach(function(x){var sc=3*hit(x.n,p)+2.5*hit(x.k,p)+hit(x.x,p);if(sc>=5)r.push({s:x,sc:sc})});r.sort(function(a,b){return b.sc-a.sc});return r}
function notes(a,hit){return['top','heart','base'].map(function(k){return a[k].map(function(n){var h=toks(n).some(function(t){return hit[t]});return h?'<b>'+esc(n)+'</b>':esc(n)}).join(', ')}).filter(Boolean).join(' · ')}
function cut(s,n){s=String(s);if(s.length<=n)return s;var c=s.slice(0,n),i=Math.max(c.lastIndexOf('. '),c.lastIndexOf(', '));return(i>40?c.slice(0,i):c.replace(/\s\S*$/,''))+'…'}
function card(r,full){var a=r.a;return'<div class="hc"><b>'+esc(a.n)+' · '+esc(a.nm)+'</b><small>'+esc(a.c.toLowerCase())+' · '+esc(a.t.toLowerCase())+'</small>'+(a.how?'<p>'+esc(full?a.how:cut(a.how,130))+'</p>':'')+'<p class="nt">Ноты: '+notes(a,r.hit||{})+'</p>'+
 (full&&a.whom?'<p>'+esc(a.whom)+'</p>':'')+(full&&a.pitch?'<p class="ps">💬 '+esc(a.pitch)+'</p>':'')+'<a href="catalog.html#n='+encodeURIComponent(a.n)+'">Открыть в каталоге</a></div>'}
function secs(r){return r.slice(0,3).map(function(x){var s=x.s,t=s.x?cut(s.x.replace(s.n,'').trim(),150):'';return'<a class="hs" href="'+esc(s.u||'sales.html')+'"><b>'+esc(s.n)+'</b>'+(t?'<small>'+esc(t)+'</small>':'')+'</a>'}).join('')}
var LAST={},CTX={a:null},QZ=null;
function nr(k,a){var i,l=LAST[k];do{i=Math.floor(Math.random()*a.length)}while(a.length>1&&i===l);LAST[k]=i;return a[i]}
function hello(){var h=new Date().getHours();return h<5?'Доброй ночи':h<12?'Доброе утро':h<18?'Добрый день':'Добрый вечер'}
var POOL=['расскажи свою историю','что-то с ванилью','свежее для мужчины','подарок маме','викторина','расскажи шутку','блоттеры сейчас','бонусы','возражение «дорого»','удиви меня','когда отчёт','факт про розу','подбодри меня','загадай загадку','какой ты?','что ты любишь?'];
function defc(){return POOL.slice().sort(function(){return Math.random()-.5}).slice(0,5)}
var CR=/не хочу жить|хочу умереть|покончить с собой|убить себя|навредить себе|суицид/;
/* болтовня Добби — в dobby-talk.json; build_helper.py кладёт её в helper-data.json (talk, gifts) */
var TALK=[];
function talkLoad(d){if(d._tk)return;d._tk=1;
 TALK=(d.talk||[]).map(function(o){try{return[new RegExp(o.re,o.flags||''),o.say,o.meta||undefined]}catch(e){return null}}).filter(Boolean);
 GF=(d.gifts||[]).map(function(o){try{return[new RegExp(o.re,o.flags||''),o.say,o.offer,o.add,o.chips]}catch(e){return null}}).filter(Boolean);
 ST=null;for(var i=0;i<TALK.length;i++)if(TALK[i][0].source.indexOf('поведай')>=0)ST=TALK[i][0]}
var TM=null,KEEP=false;
function tsay(i){var e=TALK[i];TM=e[2]||null;CTX.ti=TM&&TM.m?i:null;CTX.offer=TM&&TM.o||null;CTX.topic=null;KEEP=true;return nr('t'+i,e[1]).replace('{h}',hello()).replace('{na}',D&&D.aromas?plA(D.aromas.length):'много ароматов').replace('{now}',nowS())}
function talk(n){for(var i=0;i<TALK.length;i++)if(TALK[i][0].test(n))return tsay(i);return null}
var ST=null;
var CH=['📖 <b>Глава 1. Тёмный дом.</b><br>Давным-давно Добби служил в большом тёмном доме. Работы было много, а «спасибо» не слышал никто и никогда. Добби старался быть тише тени, но в глубине души мечтал: вдруг однажды его заметят и поблагодарят? 🧦',
'📖 <b>Глава 2. Смелый поступок.</b><br>Но Добби узнал, что одному мальчику по имени Гарри грозит опасность, и решил его предупредить. Это было очень страшно: хозяева такого не прощали! Но Добби подумал: «Если не Добби, то кто?» Это был самый смелый день его жизни ✨',
'📖 <b>Глава 3. Носок.</b><br>Потом тот самый друг помог Добби получить свободу. Эльфы освобождаются, когда им дарят одежду, и в руках у Добби оказался… носок! 🧦 Добби расплакался от счастья. С тех пор носки для него дороже всего на свете.',
'📖 <b>Глава 4. Новая работа.</b><br>Свободный Добби сам выбрал, где служить. Сначала были школьные кухни, где ему честно платили и давали выходной. А потом он нашёл ETIB PARFUM: тут пахнет, как в лучших зельях, только приятнее, а люди добрые 💛<br>Вот и вся история! Подобрать вам аромат?'];
function story(i){var last=CH.length-1;KEEP=true;CTX.ti=null;
 if(i>last){CTX.topic='more';CTX.offer='удиви меня';return{html:'Вот и весь рассказ 🧦 Но у Добби есть ещё истории про носки, шапки и друзей. Расскажу ещё или подберём вам аромат?',chips:['Расскажи ещё','Что ты любишь?','Удиви меня']}}
 CTX.topic='story';CTX.ch=i;CTX.offer=i<last?'дальше':'удиви меня';
 return{html:CH[i],chips:i<last?['Что было дальше?','Шутка','Удиви меня']:['Удиви меня','Загадай загадку','Какой ты?']}}
var RID=[['Меня наносят на запястья, но я не часы. Меня носят невидимо, а замечают все. Что я?','Это то, что оставляет шлейф.','аромат (или духи)',/аромат|дух|парфюм|одеколон|шлейф/],
['У меня есть верх, сердце и база, но я не дом и не торт. Что я?','Меня составляют ароматисты.','пирамида ароматов',/пирамид/],
['Бумажная полоска: её раздают бесплатно, а она помогает продавать. Что это?','Её нюхают, прежде чем решить.','блоттер',/блоттер|полоск|бумаг/],
['Кто приходит первым и первым же уходит, а остаётся только то, что в базе?','Это самые лёгкие, летучие ноты.','верхние ноты',/верх|ноты|нот[аы]|цитрус/],
['Я свободен, люблю носки и подбираю вам аромат. Кто я?','Он сейчас с вами разговаривает.','Добби, конечно! 🧦',/(^| )(добби|ты|эльф)( |$)/]];
function riddle(){var i;do{i=Math.floor(Math.random()*RID.length)}while(RID.length>1&&i===LAST.rd);LAST.rd=i;CTX.rid=i;CTX.rt=0;KEEP=true;CTX.ti=null;CTX.offer=null;CTX.topic=null;
 return{html:nr('rs',['Загадка! 🧩','Слушайте внимательно 🧐','Добби любит загадки! ✨'])+'<p>'+RID[i][0]+'</p><p class="ot">Отвечайте своими словами, можно сказать «подсказка» или «сдаюсь».</p>',chips:['Подсказка','Сдаюсь']}}
function rreveal(good){var r=RID[CTX.rid];CTX.rid=null;KEEP=true;CTX.offer='загадай загадку';
 return{html:(good?nr('ry',['Верно! 🎉','В точку! 🎯','Блестяще, вы разгадали! ⭐'])+' Ответ: ':nr('rv',['Добби раскроет секрет: ','Ответ такой: ','Сдаётесь? Ответ: ']))+'<b>'+r[2]+'</b> 😊 Хотите ещё загадку?',chips:['Да','Удиви меня','Шутка']}}
var CONT=/^(а |и |ну )?(что )?(было |стало |случилось )?(дальше|потом|далее)( |$)|^(и что|а что|что потом)( |$)|^(продолжай|продолжи|продолжение|рассказывай)( |$)|^(а |и |ну )?(расскажи (мне |что нибудь )?|давай |что )?еще( |$)/,
YES=/^(да|ага|угу|давай|давайте|конечно|хочу|можно|ок|окей|ладно|валяй|поехали|погнали|разумеется|естественно)( (да|давай|пожалуйста|конечно|хочу))?$|^(с удовольствием|почему бы и нет|не откажусь|ну давай|да конечно)$/,
NO=/^(нет|не надо|не хочу|потом|позже|не сейчас|пока нет|не|не стоит|не нужно)( |$)/,
REACT=/^(ого+|вау+|ух ты|ничего себе|надо же|ну надо же|серьезно|правда|да ну|не может быть|ну и ну|интересно|любопытно|оу+|ой|ох|ах)( |$)/,
LAUGH=/^(а?ха+|хах+а*|ахах+а*|хи+хи|хех|лол|кек|смешно|забавно|ржу)( |$)/,
MM=/^(хм+|мм+|эм+|ну)( |$)/,
ASKB=/(^| )а ?(ты|вы|у тебя|у вас|тебя|как ты|как у тебя|как у вас)( как| тоже| что)?$/;
var ME=['У Добби всё чудесно! 🧦 Носки на месте, ароматы пересчитаны. А у вас как настроение?','Добби отлично, спасибо, что спросили 😊 Он в хорошей форме и готов к любым вопросам!','Добби бодр и весел ✨ Раз вы спросили, значит, день удался. Чем займёмся?'];
var ACK=['Добби внимательно слушает 🧦 Правда, как ответить на это, не знает. Но разговор поддержит с радостью!','Интересно! 🤔 Добби задумался. Хотите, расскажет что-нибудь о себе или подберёт аромат?','Добби понял главное: вы человек хороший 😊 Давайте продолжим: можно про ароматы, шутки или истории.','Ох, Добби не знает, что сказать, но слушать любит ✨ Рассказывайте ещё, а он придумает, чем помочь.','Добби запомнил бы, да память занята ароматами 😄 Но слушать он умеет! Что дальше?','Тут Добби пока не мастер 🙈 Но старается! Спросите про носки, аромат или смену.'];
function mpick(){var L=[];for(var i=0;i<TALK.length;i++)if(TALK[i][2]&&TALK[i][2].m)L.push(i);var k;do{k=L[Math.floor(Math.random()*L.length)]}while(L.length>1&&k===LAST.mp);LAST.mp=k;return k}
function chat(n){var w=n.split(' ').length;
 if(CTX.rid!=null){
  if(/^(сдаюсь|не знаю|не могу|ответ|скажи ответ|покажи ответ|сам скажи|без понятия|понятия не имею)/.test(n))return rreveal(0);
  if(/подсказк|намек/.test(n)){KEEP=true;return{html:'Подсказка 💡 '+RID[CTX.rid][1],chips:['Сдаюсь']}}
  if(RID[CTX.rid][3].test(n))return rreveal(1);
  if(/^(хватит|стоп|не хочу|надоело|выход)/.test(n)){CTX.rid=null;KEEP=true;return{html:'Хорошо, загадки отложим 😊 Что дальше?',chips:defc()}}
  if(w<=3&&!/\d/.test(n)){CTX.rt++;if(CTX.rt>=2)return rreveal(0);KEEP=true;return{html:nr('rw',['Не совсем 🙂','Почти, но нет 🤏','Хм, не то 😄'])+' Подсказка: '+RID[CTX.rid][1],chips:['Сдаюсь']}}
  CTX.rid=null}
 if(/загадк|загадай|загадать/.test(n)&&!/клиент|продаж/.test(n))return riddle();
 if(ST&&ST.test(n))return story(0);
 if(CTX.topic==='story'&&CONT.test(n))return story((CTX.ch||0)+1);
 if(CTX.offer&&w<=3){
  if(YES.test(n)){var o=CTX.offer;CTX.offer=null;return reply(o)}
  if(NO.test(n)){CTX.offer=null;KEEP=true;return{html:nr('no',['Хорошо, как скажете 😊 Добби рядом, если что.','Без проблем! 🧦 Предложите свою тему, а Добби поддержит.','Понял-понял 🙌 Тогда что хотите: аромат, шутку или просто поболтаем?']),chips:defc()}}}
 if(CONT.test(n)&&!/раз|один|факт|шутк|аромат|показать|похож/.test(n)){
  if(CTX.ti!=null){var i=CTX.ti;var h=tsay(i);return{html:nr('mo',['Ещё кое-что 🧦 ','А вот ещё ✨ ','Добби вспомнил 😊 '])+h,chips:TM&&TM.c?TM.c:defc()}}
  if(/расскажи/.test(n)||CTX.topic==='more'){var j=mpick(),h2=tsay(j);return{html:nr('mo',['Ещё кое-что 🧦 ','А вот ещё ✨ ','Добби вспомнил 😊 '])+h2,chips:TM&&TM.c?TM.c:defc()}}}
 if(w<=6&&ASKB.test(n)){KEEP=true;CTX.ti=null;CTX.offer=null;return{html:(/^(хорошо|отлично|нормально|прекрасно|замечательно|супер|класс)/.test(n)?nr('gd',['Рад слышать! 🎉 ','Вот и славно! ☀️ ','Добби тоже рад! 😊 ']):'')+nr('me',ME),chips:defc()}}
 if(w<=3&&LAUGH.test(n)){KEEP=true;CTX.ti=null;CTX.offer='расскажи шутку';return{html:nr('lg',['Добби рад, что рассмешил! 😄','Хихи! Добби тоже улыбается 🧦','Смех — лучший аромат для хорошего дня ✨'])+' Ещё шутку?',chips:['Да','Загадай загадку','Удиви меня']}}
 if(w<=3&&REACT.test(n)){KEEP=true;var has=CTX.ti!=null;if(has)CTX.offer='расскажи еще';else{CTX.ti=null;CTX.offer=null}
  return{html:nr('rc',['Правда-правда! 🧦','Добби и сам иногда удивляется 😄','Ещё как! ✨','Именно так 😊'])+' '+(has?nr('rf',['Рассказать ещё?','Добавить подробностей?','Продолжить?']):nr('rg',['Чем займёмся: аромат, шутка или викторина?','Спросите про аромат или про самого Добби.'])),chips:has&&TM&&TM.c?TM.c:defc()}}
 if(w<=2&&MM.test(n)){KEEP=true;return{html:'Добби слушает 🧦 Говорите, не стесняйтесь.',chips:defc()}}
 if(/^да$/.test(n)){return{html:'Добби слушает 🧦 Что именно?',chips:defc()}}
 if(/^нет$/.test(n)){return{html:'Хорошо 😊 Если что-то понадобится, Добби рядом.',chips:defc()}}
 return null}
function plA(n){var a=n%100,b=n%10;return n+' '+(a>10&&a<20?'ароматов':b===1?'аромат':b>1&&b<5?'аромата':'ароматов')}
function nowS(){var d=new Date(),W=['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'],M=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],m=d.getMinutes();return d.getHours()+':'+(m<10?'0':'')+m+', '+W[d.getDay()]+', '+d.getDate()+' '+M[d.getMonth()]}
var PERSONA=['Добби — свободный эльф, носит носки и обожает ароматы 🧦 Хотите, расскажет свою историю?','Добби немного стесняется говорить о себе 🙈 Но если попросите, расскажет, как стал свободным. Рассказать?','О, спросили про Добби! 😊 Он эльф с большими ушами, добрым сердцем и коллекцией носков. Рассказать, как всё началось?','Добби — помощник ETIB и немножко волшебник ✨ Историю Добби знают немногие. Хотите услышать?','Про себя Добби может говорить долго, но не будет 😄 Короткая версия: свободен, счастлив, помогает. Длинная версия — по запросу. Рассказать?','Добби любит ароматы, носки и добрые слова 💛 А ещё истории, и свою тоже. Начать с самого начала?'];
function pickS(t,w,k){var ss=(t.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g)||[t]).map(function(x){return x.trim()}).filter(Boolean),sc=ss.map(function(x,i){var T=toks(x),c=0;w.forEach(function(y){if(T.indexOf(y.s)>=0)c++});return{i:i,c:c}});
 var top=sc.filter(function(x){return x.c>0}).sort(function(a,b){return b.c-a.c}).slice(0,k);if(!top.length)top=sc.slice(0,k);return top.sort(function(a,b){return a.i-b.i}).map(function(x){return ss[x.i]}).join(' ')}
function qaS(it,p){var ta=toks(it.a),tq=toks(it.q),sc=0;p.w.forEach(function(x){sc+=(tq.indexOf(x.s)>=0?4:0)+(ta.indexOf(x.s)>=0?1.2:0)});return sc}
function dfs(){if(D._df)return;D._df={};D._N=D.qa.length+D.sections.length;var add=function(t){var S={};toks(t).forEach(function(x){S[x]=1});Object.keys(S).forEach(function(x){D._df[x]=(D._df[x]||0)+1})};D.qa.forEach(function(i){add(i.q+' '+i.a)});D.sections.forEach(function(i){add(i.n+' '+i.k+' '+i.x)})}
function idf(t){var d=D._df[t]||0;return d?Math.log(1+D._N/d):0}
function hit(text,p){var T={};toks(text).forEach(function(x){T[x]=1});var sc=0;p.w.forEach(function(x){var b=0;exp(x.s).forEach(function(t,i){if(T[t]){var v=idf(t)*(i?0.6:1);if(v>b)b=v}});sc+=b});return sc}
function findQ(p){dfs();var r=[];D.qa.forEach(function(it){var s=3*hit(it.q,p)+hit(it.a,p);if(s>=5)r.push({it:it,sc:s})});r.sort(function(a,b){return b.sc-a.sc});return r}
function qaCard(r,p){var it=r[0].it,t=it.a.length>520?pickS(it.a,p.w,3):it.a,rest=r.slice(1,3).filter(function(x){return x.sc>=r[0].sc*0.5});
 return nr('qa',['Вот что нашлось в шпаргалке 📖','Есть ответ! 👇','Добби нашёл, читайте 😊','Это есть на сайте — смотрите 👇'])+'<div class="hc"><b>'+esc(it.q)+'</b><small>'+esc(it.sec)+'</small><p>'+esc(cut(t,520))+'</p><a href="'+esc(it.u)+'">Открыть в шпаргалке</a></div>'+(rest.length?'<p class="ot">Ещё по теме: '+rest.map(function(x){return'<a href="'+esc(x.it.u)+'">'+esc(x.it.q)+'</a>'}).join(' · ')+'</p>':'')}
function secCard(S,p){var s=S[0].s,t=s.x?pickS(s.x.replace(s.n,''),p.w,2):'';return nr('sc',['Нашлось на сайте 👇','Вот где это лежит 📚','Смотрите, тут всё есть 😊'])+'<a class="hs" href="'+esc(s.u||'sales.html')+'"><b>'+esc(s.n)+'</b>'+(t?'<small>'+esc(cut(t,260))+'</small>':'')+'</a>'+(S.length>1?'<p class="ot">Ещё: '+S.slice(1,3).map(function(x){return'<a href="'+esc(x.s.u||'sales.html')+'">'+esc(x.s.n)+'</a>'}).join(' · ')+'</p>':'')}
function sched(){var d=new Date(),m=d.getHours()*60+d.getMinutes(),t=720;while(t<1200){var r=t<960?30:15,e=Math.min(t+30,1200);if(m>=t&&m<e)return{on:1,left:e-m};if(e>=1200)break;var e2=Math.min(e+r,1200);if(m>=e&&m<e2)return{on:0,left:e2-m};t=e2}return null}
function blot(){var s=sched(),h='<a href="sales.html#rep/blot">График раздачи</a>';return s?(s.on?'Сейчас раздаём блоттеры! 📄 Ещё '+s.left+' мин, потом перерыв. Улыбка и вперёд 😊':'Сейчас перерыв ☕ Ещё '+s.left+' мин, потом снова раздаём.')+'<p class="ot">'+h+'</p>':'Раздача блоттеров идёт с 12:00 до 20:00, сейчас не наше время 🌙<p class="ot">'+h+'</p>'}
function rep(){var d=new Date(),m=d.getHours()*60+d.getMinutes(),RT=[[700,'11:40'],[820,'13:40'],[940,'15:40'],[1060,'17:40'],[1180,'19:40'],[1320,'22:00']],n=RT.filter(function(x){return x[0]>m})[0];return(n?'Следующий отчёт в '+n[1]+' ⏰':'На сегодня отчётов больше нет 🎉 Завтра первый в 11:40.')+'<p class="ot"><a href="sales.html#rep/rep2h">Отчёты в течение дня</a> · <a href="sales.html#rep/rep2h">калькулятор</a></p>'}
function bonus(q,n){if(!/бонус|кэшбэк|кешбэк|списа|баллы/.test(n))return null;var m=String(q).replace(/(\d)\s(?=\d{3})/g,'$1').match(/\d{3,7}/);if(!m)return null;var sum=+m[0],bs=D.sections.filter(function(x){return x.s==='bs'})[0];if(!bs)return null;
 var re=/(Эксперт|Гуру|Парфюмер)[^%]*?(\d+)%\s*до\s*(\d+)%/g,x,L=[];while((x=re.exec(bs.x)))L.push({l:x[1],c:+x[2],w:+x[3]});if(!L.length)return null;
 var lv=/эксперт/.test(n)?'Эксперт':/гуру/.test(n)?'Гуру':/парфюмер/.test(n)?'Парфюмер':null,f=function(v){return Math.round(v).toLocaleString('ru-RU')},o=L.filter(function(z){return!lv||z.l===lv});
 return'Считаю для чека '+f(sum)+' ₽ 🧮'+o.map(function(z){return'<p><b>'+z.l+'</b>: кэшбэк '+z.c+'% = '+f(sum*z.c/100)+' бонусов, списать можно до '+z.w+'% = '+f(sum*z.w/100)+' бонусов</p>'}).join('')+'<p class="ot">Точный расчёт — в <a href="sales.html#price/bcalc">калькуляторе бонусов</a>.</p>'}
function rnd(a){return a[Math.floor(Math.random()*a.length)]}
function shuf(a){return a.slice().sort(function(){return Math.random()-.5})}
function qzNext(){var P=D.aromas.filter(function(a){return a.top.length&&a.heart.length&&a.base.length}),a=rnd(P),mode=rnd(['num','name','notes']),dis=shuf(P.filter(function(x){return x!==a&&x.c===a.c})).slice(0,3),o=shuf([a].concat(dis)),q,get=mode==='name'?function(x){return x.n}:function(x){return x.nm};
 q=mode==='num'?'Какой аромат под номером <b>'+esc(a.n)+'</b>?':mode==='name'?'Какой номер у <b>'+esc(a.nm)+'</b>?':'Угадайте аромат по нотам 👃<br>Верх: '+esc(a.top.join(', '))+'<br>Сердце: '+esc(a.heart.join(', '))+'<br>База: '+esc(a.base.join(', '));
 var t=QZ?QZ.total:0,ok=QZ?QZ.ok:0,st0=QZ?QZ.streak:0;QZ={a:a,right:o.indexOf(a),ok:ok,total:t,streak:st0,o:o};
 return{html:nr('qz',['Поехали! 🎯','Вопрос! ✨','Следующий! 💫','Лови вопрос 😄'])+'<p>'+q+'</p>'+o.map(function(x,i){return'<button type="button" class="hqo" data-i="'+i+'">'+esc(get(x))+'</button>'}).join(''),chips:['Хватит']}}
function qzAnswer(i){if(!QZ)return{html:'Викторина не запущена. Напишите «викторина» 😊',chips:defc()};QZ.total++;var good=i===QZ.right,a=QZ.a,r;
 if(good){QZ.ok++;QZ.streak++;r=nr('qy',['Верно! 🎉','В точку! 🎯','Браво! 👏','Блестяще! ⭐','Отлично, так держать! 🔥'])+(QZ.streak>=3?' Серия: '+QZ.streak+' подряд! 🔥':'')}
 else{QZ.streak=0;r=nr('qn',['Почти! 💪','Ничего, бывает 🙂','Упс, в следующий раз получится! 🌈'])+' Правильно: <b>'+esc(a.n)+' · '+esc(a.nm)+'</b>'}
 CTX.a=a;return{html:r+(a.how?'<p class="nt">'+esc(cut(a.how,120))+'</p>':''),chips:['Дальше','Хватит'],right:QZ.right}}
function qzEnd(){var q=QZ;QZ=null;if(!q||!q.total)return{html:'Хорошо, отложим 😊 Захотите размяться — напишите «викторина».',chips:defc()};var pc=q.ok/q.total;
 return{html:'Итог: '+q.ok+' из '+q.total+' '+(pc>=.8?'🏆 Вы эксперт!':pc>=.5?'👍 Хороший результат!':'🌱 Неплохое начало!')+' Для полной тренировки откройте <a href="trainer.html">Тренажёр</a>.',chips:defc()}}
function sub(q,n,p,A){var w={pitch:/продат|сказат|фраз|питч|крючок|предложит|презентов/,sim:/похож|аналог|замен|вместо/,notes:/ноты|состав|пирамид|из чего/,whom:/кому|для кого|кто носит|подойд[её]т/,read:/как (читается|произносится|говорить|произнести)|произнош/},k=null;for(var z in w)if(w[z].test(n)){k=z;break}if(!k)return null;
 var a=null,m=String(q).toUpperCase().match(/(?:^|\s)([A-ZА-Я])\s?-?(\d{1,2})(?=\s|$|[?!.,])/);if(m){var c=(LK[m[1]]||m[1])+m[2];a=D.aromas.filter(function(x){return x.n===c})[0]}
 if(!a&&A.length&&A[0].m>0&&A[0].sc>=3)a=A[0].a;if(!a&&(CTX.a&&(!A.length||n.split(' ').length<=4)))a=CTX.a;if(!a)return null;CTX.a=a;var h='<b>'+esc(a.n)+' · '+esc(a.nm)+'</b>',L='<p class="ot"><a href="catalog.html#n='+encodeURIComponent(a.n)+'">Открыть в каталоге</a></p>';
 if(k==='pitch')return{html:nr('pi',['Держите! 💬','Вот что сказать клиенту 😊','Готовая подача 👇'])+'<div class="hc">'+h+(a.pitch?'<p class="ps">💬 '+esc(a.pitch)+'</p>':'')+(a.hooks.length?'<p>Крючки: '+a.hooks.slice(0,3).map(esc).join(' · ')+'</p>':'')+'</div>'+L};
 if(k==='sim')return{html:a.sim.length?'Похожие на <b>'+esc(a.n)+'</b> 👇<div class="hc">'+a.sim.map(function(x){var c=x.split(' ')[0];return'<p><a href="catalog.html#n='+encodeURIComponent(c)+'">'+esc(x)+'</a></p>'}).join('')+'</div>':'Для '+h+' список похожих пока не заполнен 🙈'};
 if(k==='notes')return{html:'Пирамида '+h+' 👃<div class="hc"><p>Верх: '+esc(a.top.join(', '))+'</p><p>Сердце: '+esc(a.heart.join(', '))+'</p><p>База: '+esc(a.base.join(', '))+'</p></div>'+L};
 if(k==='whom')return{html:a.whom?h+': '+esc(a.whom)+L:'Про '+h+' описание «для кого» пока не заполнено 🙈'};
 return{html:a.ru?'Читается так: <b>«'+esc(a.ru)+'»</b> 🗣️':'Подсказка по произношению для '+h+' пока не добавлена 🙈'}}
var FS=['История парфюмерии','Из чего делают ароматы','Нос и память','Факты для разговора с клиентом'];
var RT=[[/дорог|возражен|сомнева|подумаю/,'obj'],[/держится|стойк|шлейф|как долго/,'types'],[/хватает|надолго хватит/,'last'],[/этап/,'stages'],[/одеват|одежд|внешн вид|дресс|форма/,'dress'],[/клубн|селектив/,'club'],[/алфавит/,'alpha'],[/инкасс/,'inkass'],[/промоутер/,'promo'],[/регистр.*клиент|клиент.*регистр/,'reg'],[/приложени|кошел/,'app'],[/обед|перерыв/,'lunch'],[/мотивац|настрой/,'motiv'],
 [/истори.*парфюм|парфюм.*истори|кёльн|кельн|одеколон|грасс/,{n:'История парфюмерии',u:'sales.html#facts/f-hist'}],[/из чего делают|как делают аромат/,{n:'Из чего делают ароматы',u:'sales.html#facts/f-ingr'}],[/нос и память|обоняни/,{n:'Нос и память',u:'sales.html#facts/f-nose'}]];
function route(n){for(var i=0;i<RT.length;i++)if(RT[i][0].test(n)){var t=RT[i][1];if(typeof t==='string'){var x=D.sections.filter(function(z){return z.s===t})[0];if(x)return x}else return{n:t.n,u:t.u,x:'',k:''}}return null}
function factR(){var L=D.qa.filter(function(i){return FS.indexOf(i.sec)>=0}),it=rnd(L);return{html:nr('fa',['Знаете ли вы? 🤓','Интересный факт! ✨','Держите факт для разговора с клиентом 💬'])+'<div class="hc"><b>'+esc(it.q)+'</b><small>'+esc(it.sec)+'</small><p>'+esc(cut(it.a,520))+'</p><a href="'+esc(it.u)+'">Открыть в шпаргалке</a></div>',chips:['Ещё факт','Викторина','Подбодри меня']}}
var FB=['Добби задумался, но ответа пока нет 🧦 Спросите про аромат, ноту, номер или просто скажите «привет»!','Ой, Добби запутался в носках 🧦 Скажите проще: «что-то свежее», «бонусы» или «расскажи шутку».','Добби виноват, Добби не понял! 🙈 Скажите иначе: ноту, номер аромата (A2) или тему из шпаргалки. Добби очень старается!','Ох, Добби в замешательстве 🧦 Напишите чуть иначе, например «свежее для мужчины», «скидка 10%» или просто «шутку».','Добби честно искал, но пока не нашёл 🤔 Попробуйте одно слово («ваниль», «блоттеры», «бонусы») или выберите кнопку ниже.','Простите Добби, это не по его части 🙈 Зато про ароматы, продажи и отчёты Добби знает всё. Спросите что-нибудь из этого!'];
/* ===== Умный слой: понимание реплик, обучение, защита от ложных карточек ===== */
var MEMLS={},SHARED=[],CUR='',LSL='etib_dobby_lessons',LSU='etib_dobby_unknown',NV=null;
function lsGet(k){try{var v=localStorage.getItem(k);return v?JSON.parse(v):[]}catch(e){return MEMLS[k]||[]}}
function lsSet(k,v){MEMLS[k]=v;try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function lk(s){var o=[],S={};norm(s).split(' ').forEach(function(w){if(w.length>1){var x=st(w);if(!S[x]){S[x]=1;o.push(x)}}});return o}
function dice(a,b){if(!a.length||!b.length)return 0;var S={},i=0;a.forEach(function(x){S[x]=1});b.forEach(function(x){if(S[x])i++});return 2*i/(a.length+b.length)}
function fmt(a){return esc(a).replace(/\n/g,'<br>')}
function lessons(){return lsGet(LSL).concat(SHARED)}
/* урок: фраза → ответ; одно слово — только точное совпадение, фразы — по сходству слов */
function learned(n){var k=lk(n);if(!k.length)return null;var best=null,bs=0;
 lessons().forEach(function(l){if(!l||!l.p||!l.a)return;var lkk=l.k||(l.k=lk(l.p));if(lkk.length===1||k.length===1){if(norm(l.p)===n&&1>bs){bs=1;best=l}return}var s=dice(k,lkk);if(s>bs){bs=s;best=l}});
 if(best&&bs>=.8){KEEP=false;return{html:fmt(best.a),chips:defc()}}return null}
function saveLesson(ph,ans){ph=String(ph||'').replace(/\s+/g,' ').trim().slice(0,80);ans=String(ans||'').trim().slice(0,500);
 if(norm(ph).length<2||ans.length<2){KEEP=false;return{html:'Не получилось запомнить: фраза или ответ слишком короткие 🙈 Попробуйте ещё раз: «научить».',chips:['Научить Добби']}}
 var L=lsGet(LSL),np=norm(ph);L=L.filter(function(l){return norm(l.p)!==np});L.push({p:ph,a:ans,t:Date.now()});if(L.length>150)L=L.slice(L.length-150);lsSet(LSL,L);
 lsSet(LSU,lsGet(LSU).filter(function(u){return norm(u.q)!==np}));KEEP=false;
 return{html:'Запомнил! 🧠 Теперь на «'+esc(ph)+'» Добби ответит так:<div class="hc"><p>'+fmt(ans)+'</p></div>Проверьте: напишите эту фразу ещё раз.',chips:[ph.length>26?ph.slice(0,24)+'…':ph,'Научить Добби','Что ты выучил?'].slice(0,3).map(function(x,i){return i===0?ph:x}).slice(0,3)}}
function logUnk(q){var t=String(q).trim().slice(0,80);if(norm(t).length<2)return;var L=lsGet(LSU),k=norm(t),f=null;L.forEach(function(u){if(norm(u.q)===k)f=u});
 if(f){f.c++;f.t=Date.now()}else L.push({q:t,c:1,t:Date.now()});L.sort(function(a,b){return b.t-a.t});lsSet(LSU,L.slice(0,60))}
var TD=/^\s*(?:запомни|научись|выучи|научи(?:ть)?(?: добби)?)\s*[:,—-]?\s*(?:когда (?:я |мне |тебе |вам )?(?:напишу|напишут|скажу|скажут|спрошу|спросят)\s*[:,]?\s*)?[«"“]?(.{2,80}?)[»"”]?\s*(?:=>|->|→|=| — | - |,? ?отвечай:?|,? ?ответь:?|,? ?ответ:)\s*[«"“]?([\s\S]{2,500}?)[»"”]?\s*$/i;
var TD2=/^\s*(?:запомни|научись|выучи|научи(?:ть)?(?: добби)?)\s*[:—-]\s*[«"“]?(.{2,80}?)[»"”]?\s*$/i;
var TS=/^(научи|научить|научи добби|научить добби|обучи|обучить|обучи добби|давай научу|хочу научить|хочу тебя научить|запомни|научись)$/;
var FBK=/^(не то|не так|неправильно|неверно|не верно|ты не понял[а]?|ты меня не понял|мимо|ерунда|чушь|бред|я не об этом|я не про это|не об этом|не про это|ты ошибся|ты ошибаешься|ты тупишь|тупишь|глупый ответ|глупость)( |$)/;
function teachFlow(q,n,more){if(more)return null;var T=CTX.teach;
 if(T&&Date.now()-T.t>240000){CTX.teach=T=null}
 if(T){if(/^(отмена|не надо|стоп|хватит|не хочу|передумал|передумала)( |$)/.test(n)){CTX.teach=null;KEEP=false;return{html:'Хорошо, не учим 😊 Добби рядом.',chips:defc()}}
  if(T.step===1){T.ph=String(q).trim().slice(0,80);T.step=2;T.t=Date.now();KEEP=true;return{html:'Хорошо! Что Добби отвечать на «'+esc(T.ph)+'»? Напишите ответ одним сообщением 💬',chips:['Отмена']}}
  CTX.teach=null;return saveLesson(T.ph,q)}
 var m=TD.exec(String(q));if(m)return saveLesson(m[1],m[2]);
 m=TD2.exec(String(q));if(m){CTX.teach={step:2,ph:m[1].trim(),t:Date.now()};KEEP=true;return{html:'Давайте научим 🧠 Что Добби отвечать на «'+esc(m[1].trim())+'»? Напишите ответ одним сообщением.',chips:['Отмена']}}
 if(TS.test(n)){KEEP=true;if(CUR){CTX.teach={step:2,ph:CUR,t:Date.now()};return{html:'Давайте научим 🧠 Что Добби отвечать на «'+esc(CUR)+'»? Напишите ответ одним сообщением. Другая фраза? Напишите «научи: ваша фраза».',chips:['Отмена']}}
  CTX.teach={step:1,t:Date.now()};return{html:'Давайте 🧠 Напишите фразу, на которую Добби должен отвечать (так, как её напишет коллега или клиент).',chips:['Отмена']}}
 if(!CTX.rid&&!QZ&&FBK.test(n)){KEEP=true;CTX.offer='научить';return{html:nr('fk',['Простите, Добби промахнулся 🙈','Ой, Добби опять запутался в носках 🧦','Понял, не то. Добби не обижается 🙏'])+(CUR?' Хотите научить его, как правильно отвечать на «'+esc(CUR.slice(0,60))+'»?':' Хотите научить его, как отвечать правильно?'),chips:['Научить Добби','Что-то с ванилью','Расскажи шутку']}}
 if(/(что|чему) (ты )?(выучил|научился|запомнил)|твои уроки|покажи уроки|чему я тебя научил/.test(n)){var L=lessons();KEEP=false;
  if(!L.length)return{html:'Пока Добби ничему не научили 🌱 Напишите «научить» и расскажите, как отвечать на ту или иную фразу.',chips:['Научить Добби']};
  return{html:'Добби выучил уроков: '+L.length+' 🧠 Последние:'+L.slice(-5).reverse().map(function(l){return'<p><b>'+esc(l.p)+'</b> → '+esc(String(l.a).slice(0,90))+(l.a.length>90?'…':'')+'</p>'}).join('')+'<p class="ot">«Забудь последний урок» удалит урок на этом телефоне.</p>',chips:['Научить Добби','Что ты не понял?']}}
 if(/что ты не понял|непонят|вопросы без ответа|что (у тебя )?не получилось/.test(n)){var U=lsGet(LSU).slice().sort(function(a,b){return b.c-a.c||b.t-a.t}).slice(0,8);KEEP=false;
  if(!U.length)return{html:'Непонятых фраз пока нет ✨ Когда Добби не поймёт, он запишет это здесь.',chips:defc()};
  return{html:'Вот что Добби не понял 🤔'+U.map(function(u,i){return'<p>'+(i+1)+'. «'+esc(u.q)+'»'+(u.c>1?' × '+u.c:'')+'</p>'}).join('')+'<p class="ot">Чтобы научить, напишите: «научи: фраза», потом ответ.</p>',chips:['Научить Добби','Что ты выучил?']}}
 if(/выгрузи уроки|выгрузить уроки|экспорт уроков|скопируй уроки/.test(n)){var A2=lsGet(LSL).map(function(l){return{p:l.p,a:l.a}});KEEP=false;
  if(!A2.length)return{html:'Выгружать пока нечего: Добби ещё не учили на этом телефоне 🌱',chips:['Научить Добби']};
  return{html:'Уроки готовы 📦 Скопируйте текст и вставьте в файл <b>dobby-learn.json</b> на GitHub: тогда их выучат все.<textarea class="hjs" readonly rows="6" onclick="this.select()">'+esc(JSON.stringify({lessons:A2},null,1))+'</textarea>',chips:defc()}}
 if(/^забудь (последний урок|последнее|последний)$/.test(n)){var L2=lsGet(LSL);KEEP=false;if(!L2.length)return{html:'Забывать нечего: на этом телефоне уроков нет 🙂',chips:defc()};var d=L2.pop();lsSet(LSL,L2);return{html:'Забыл урок про «'+esc(d.p)+'» 🧽',chips:defc()}}
 if(/^забудь (все|всё|все уроки|все выученное)$/.test(n)){lsSet(LSL,[]);KEEP=false;return{html:'Готово, все уроки на этом телефоне стёрты 🧽 Общие уроки из файла остались.',chips:defc()}}
 return null}
/* реплики, обращённые к самому Добби: подарки, комплименты, вопросы про подарок */
var GVR=/(^| )(подарю|дарю|подарим|дарим|подарила|подарил|подарить|принести|купить|привезти|угостить|отдать|принесу|принесла|принес|принесем|куплю|купила|купил|привезу|привезла|привез|отдам|испеку|испекла|свяжу|связала|сделаю|сделала|налью|угощу|угостила|угостил|вручу|вышью|нарисую|сошью)( |$)/;
var ADR=/(^| )(тебе|добби|тебя)( |$)/;
var GDR=/^(я|мы|тебе|тебя|добби|для|тоже|обязательно|непременно|завтра|сегодня|потом|когда|если|вот|же|еще|уже|скоро|хочу|хотела|хотел|хотим|буду|будем|обещаю|все|ты|вам|вас|с|от|души|сердца|как|то)$/;
function objOf(n){var o=[];n.split(' ').forEach(function(w){if(!w||GDR.test(w)||GVR.test(' '+w+' '))return;o.push(w)});while(o.length&&/^(и|а)$/.test(o[0]))o.shift();return o.slice(0,4).join(' ')}
var GF=[];/* реакции на подарки — в dobby-talk.json («gifts») */
var GG=['Для Добби?! 🥹 Он даже не знает, что сказать.','Ох, Добби растроган до кончиков ушей 💛','Это так мило! 🧦 Добби очень тронут.'];
var GG2=['Добби запомнит ваш подарок и не потеряет, в отличие от носков, которые иногда пропадают 😄','Добби будет беречь «{o}» и вспоминать вас каждый раз. Спасибо!','Лучший подарок — внимание, а «{o}» ещё и приятно. Спасибо, вы чудесный человек!'];
function gift(n){var o=objOf(n);for(var i=0;i<GF.length;i++)if(!/ и /.test(' '+o+' ')&&GF[i][0].test(o||n)){var g=GF[i];KEEP=true;CTX.ti=null;CTX.offer=g[2]||null;return{html:nr('gf'+i,g[1])+(g[3]?' '+g[3]:''),chips:g[2]?['Да, давай',defc()[0],'Расскажи шутку']:defc()}}
 KEEP=true;CTX.ti=null;CTX.offer=null;return{html:nr('gg',GG)+' '+(o?nr('gg2',GG2).replace('{o}',esc(o)):'Спасибо!'),chips:defc()}}
var PRA=/^(ты|вы) (очень |такой |такая |так |просто |действительно |самый |самая )?(красив|умн|добр|мил|смешн|классн|хорош|замечательн|прекрасн|симпатичн|забавн|весел|талантлив|полезн|шустр|быстр|супер|крут|золот|чудесн|потрясающ|офигенн|милаш|солнышк|лапочк|зайк)/;
var PRR=['Ой, Добби краснеет до кончиков ушей 🥰 Спасибо! А вы сами просто чудо.','Добби счастлив! 🧦 Такие слова — лучше любого носка. Вы тоже замечательный человек!','Спасибо-спасибо! 🌷 Добби старается ради вас. Давайте найдём что-нибудь приятное: аромат или шутку?','Это самая добрая реплика за день ✨ Добби запомнит. Чем теперь помочь?'];
function smartA(q,n){var Q=String(q);
 if(/что (тебе|добби) (подарить|принести|купить|привезти|подарим)|что (подарить|принести|купить) (тебе|добби)|что (ты )?хочешь (в подарок|получить в подарок)/.test(n)){KEEP=true;return{html:nr('wl',['Добби мечтает о носках 🧦 Но лучший подарок для эльфа — доброе слово и довольный клиент!','Шапка, носки или пирог — Добби будет рад всему 🎩 А главное — чтобы смена прошла хорошо!']),chips:defc()}}
 if(GVR.test(n)&&ADR.test(n)&&!/\?/.test(Q)&&!/^(что|какой|какую|какое|зачем|почему|когда|кому|куда|как|где|можно|а что)( |$)/.test(n))return gift(n);
 if(/болит|заболел|заболела|температур|простуд|тошнит|кружится голова|плохо себя чувств/.test(n)&&!/клиент|покупател/.test(n)){KEEP=true;CTX.ti=null;CTX.offer=null;return{html:nr('hl',['Ох, Добби переживает 🫂 Берегите себя: если совсем плохо, скажите руководителю и отдохните. Работа подождёт.','Добби очень сочувствует 💛 Выпейте тёплого, посидите минутку, а при плохом самочувствии не терпите, сообщите руководителю.']),chips:['Подбодри меня','Расскажи шутку']}}
 if(/^(я|мы) [а-я]+(ла|л|ли|лась|лись|ся)( |$)/.test(n)&&!BIZ.test(n)&&!ADR.test(n)&&n.split(' ').length>=3&&!/\?/.test(Q)){KEEP=true;CTX.ti=null;CTX.offer=null;return{html:nr('sm',SMR),chips:['Научить Добби','Что-то с ванилью','Расскажи шутку']}}
 if(PRA.test(n)&&!/\?/.test(Q)){KEEP=true;CTX.ti=null;CTX.offer=null;return{html:nr('pr2',PRR),chips:defc()}}
 return null}
var BIZ=/аромат|дух|парфюм|флакон|клиент|покупател|продал|продаж|продам|скидк|бонус|смен|отчет|блоттер|касс|план|выручк|акци|цен[аыу]|заказ|размер|мужск|женск|унисекс|нот[аыу]|запах|пахн|ванил|свеж|слад|подар|ищу|хочу|нужен|нужна|нужно|посоветуй|подбери|ищем|порекомендуй|устал|тяжел|груст|скучн|плох|бесит|выжат|нет сил|хам|шпаргалк|каталог|викторин|загадк|шутк/;
var SMR=['Понятно 🧦 Спасибо, что рассказали! Если нужна помощь с ароматом или шпаргалкой, Добби на месте.','Добби слушает с удовольствием ✨ Расскажете ещё? Или вернёмся к делам: аромат, блоттеры, отчёт?','Интересно! 🙂 А Добби пока умеет искать ароматы, отвечать по шпаргалке и шутить. С чего начнём?','Добби всё услышал 🧦 Если хотите, научите его отвечать на такое лучше: напишите «научить».'];
function smartB(q,n){if(/^(я|мы|у меня|у нас|сегодня|вчера|утром|вечером|днем|только что)( |$)/.test(n)&&!BIZ.test(n)&&!ADR.test(n)&&n.split(' ').length>=3&&!/\?/.test(String(q))){logUnk(q);KEEP=true;return{html:nr('sm',SMR),chips:['Научить Добби','Что-то с ванилью','Расскажи шутку']}}return null}
/* когда Добби честно не знает: не показывает карточки наугад, а уточняет и предлагает научить */
var UKM=['Добби не уверен, что понял «{q}» 🤔 Это про аромат, про работу или просто поболтать? А ещё Добби можно научить: напишите «научить».','Хм, «{q}» — Добби такого ещё не слышал 🧦 Подскажете, как на это отвечать? Нажмите «Научить Добби», и он запомнит.','Добби пока не знает, что ответить на «{q}» 🙈 Зато он умеет учиться! Скажите, как правильно, и в следующий раз ответит сам.'];
function unknown(q,pre){logUnk(q);KEEP=true;CTX.offer='научить';var e=esc(String(q).trim().slice(0,60));
 return{html:(pre||'')+nr('uk',UKM).replace('{q}',e),chips:['Научить Добби','Что-то с ванилью','Расскажи шутку']}}
/* опечатки в нотах: «ванилин»→«ваниль», «лаванду»→«лаванда» (правим только слова, которых нет нигде) */
function nvBuild(){NV={};D.aromas.forEach(function(a){Object.keys(a._n).forEach(function(k){NV[k]=1})});Object.keys(SYN).forEach(function(k){NV[k]=1});Object.keys(EM).forEach(function(k){NV[k]=1})}
function ed1(a,b){if(a===b)return 1;var la=a.length,lb=b.length;if(Math.abs(la-lb)>1)return 0;var i=0;while(i<la&&i<lb&&a[i]===b[i])i++;
 if(la===lb){if(a.slice(i+1)===b.slice(i+1))return 1;if(a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(i+2)===b.slice(i+2))return 1;return 0}
 return(la>lb?a.slice(i+1)===b.slice(i):b.slice(i+1)===a.slice(i))?1:0}
function fz(s,raw){if(!D||raw.length<5||s.length<4)return s;if(!NV)nvBuild();dfs();
 if(NV[s]||D._df[s]||SYN[s]||EM[s]||STOP.indexOf(s)>=0)return s;var c=[];Object.keys(NV).forEach(function(k){if(k.length>=4&&k[0]===s[0]&&ed1(s,k))c.push(k)});return c.length===1?c[0]:s}
/* охват: сколько слов запроса реально есть в найденном тексте (одно случайное совпадение не считается) */
function cov(text,p){var T={};toks(text).forEach(function(x){T[x]=1});var c=0;p.w.forEach(function(x){if(exp(x.s).some(function(t){return T[t]}))c++});return c}
function reply(q,more){KEEP=false;var r=reply0(q,more);if(!KEEP){CTX.ti=null;CTX.topic=null;CTX.offer=null}return r}
function reply0(q,more){if(!D)return{html:'Секундочку, Добби достаёт знания… 📚'};prep(D);var n=norm(q),pre='';
 if(!n)return{html:'Напишите, что ищете: ноту, повод, номер аромата или тему 😊'};
 if(CR.test(n))return{html:'Добби очень сочувствует, что вам так тяжело 💛 Вы не одни. Пожалуйста, поговорите сейчас с близким человеком или обратитесь на горячую линию помощи или в экстренную службу вашей страны. Если вы в опасности, звоните немедленно.'};
 var tf=teachFlow(q,n,more);if(tf)return tf;if(!more&&n.length>=4&&!YES.test(n)&&!NO.test(n)&&!CONT.test(n)&&!FBK.test(n))CUR=String(q).trim();
 if(QZ&&/^(дальше|еще|следующий|продолжить|давай еще)/.test(n))return qzNext();if(/^(хватит|стоп|закончить|выход|не хочу больше)/.test(n)&&QZ)return qzEnd();
 var g=/^(привет|здравствуйте|здравствуй|добрый день|доброе утро|добрый вечер|хай|салют|приветик)\s+/,n2=n.replace(g,'');if(n2!==n&&n2.split(' ').length>=2){pre=hello()+'! 😊 ';n=n2;q=n2}
 if(/(любим|лучш|нравится).{0,15}(аромат|духи|парфюм)|какой (аромат|парфюм|запах) (тебе|ты|у тебя)|что бы ты (выбрал|носил|посоветовал себе)/.test(n)&&/(тебе|ты|твой|у тебя)/.test(n)){var rf=reply('удиви меня');rf.html='Добби выбирает сердцем: мой любимчик на сегодня 💖'+rf.html.replace(/^[^<]*/,'');return rf}
 var ch=chat(n);if(ch)return ch;var ls=learned(n);if(ls)return ls;var sa=smartA(q,n);if(sa)return sa;var t=talk(n);if(t)return{html:t,chips:TM&&TM.c?TM.c:defc()};
 if(/викторин|потренируй|спроси меня|проверь меня|давай тест|квиз|тренировк/.test(n)){QZ=null;var r0=qzNext();r0.html='Добби обожает викторины! 🧠 Выбирайте ответ кнопкой.<br>'+r0.html;return r0}
 if(/удиви|случайн|аромат дня|посоветуй что-нибудь|что-нибудь интересн/.test(n)){var a=rnd(D.aromas);CTX.a=a;return{html:nr('rd',['Добби выбрал фаворита дня 🌟','Сюрприз от Добби 🎁','Держите находку! ✨'])+card({a:a,hit:{}},false)+(a.pitch?'<p class="ps">💬 '+esc(a.pitch)+'</p>':''),chips:['Ещё один','Как продать','Похожие']}}
 if(/^ещ[её] (один|раз)/.test(n))return reply('удиви меня');if(/^как продать$/.test(n)&&CTX.a)return sub('как продать',n,{w:[]},[]);if(/^похожие$/.test(n)&&CTX.a)return sub('похожие',n,{w:[]},[]);
 if(/^(ещ[её] )?(расскажи )?(что.нибудь )?(факт|интересн)[а-я]*$/.test(n)||/^ещ[её] факт/.test(n))return factR();
 var rs=route(n);if(rs&&!/сейчас|когда отчет/.test(n)&&!/подар/.test(n))return{html:pre+secCard([{s:rs,sc:9}],{w:[]}),chips:defc()};
 if(/блоттер|раздач/.test(n)&&/сейчас|когда|можно|перерыв|идти|время|ещё|еще/.test(n)&&!/как|правил/.test(n))return{html:blot(),chips:defc()};
 if(/отчет|отчёт/.test(n)&&/когда|сейчас|следующ|во сколько|время/.test(n))return{html:rep(),chips:defc()};
 var bc=bonus(q,n);if(bc)return{html:bc,chips:defc()};
  var lk=n.match(/^(а )?ты (тоже |еще |вообще )?(любишь|обожаешь|предпочитаешь|ценишь) (.+)$/);if(lk){var ob=lk[4],pp=parse(ob),AA=pp.w.length?findA(pp):[];KEEP=true;CTX.ti=null;CTX.topic=null;
   if(AA.length&&Object.keys(AA[0].hit).length){CTX.offer=ob;return{html:nr('lk',['Ещё как! 🧦 Добби к этому неравнодушен.','Конечно, любит! ✨ Это так вкусно пахнет.','О, Добби в восторге от такого! 😊'])+' В ароматах это есть. Показать?',chips:['Да','Нет','Удиви меня']}}
   CTX.offer='расскажи свою историю';return{html:nr('lg2',['Добби любит многое: носки, ароматы, добрые слова 🧦 А что любите вы?','Про это Добби подумает ✨ Зато точно знает: он любит носки, ваниль и людей с улыбкой.','Добби не уверен, что хорошо знает это 🙈 Зато про носки может говорить часами!']),chips:['Расскажи свою историю','Что ты любишь?','Шутка','Удиви меня']}}
 if((/(^| )(ты|тебя|тебе|тобой|твой|твоя|твое|твои|вас|вам)( |$)|про себя|о себе/.test(n))&&!/аромат|нот[аыуе]|духи|парфюм|скидк|бонус|отчет|блоттер|клиент|смен|продаж|возраж|цен[аыуео]|доступн|стоит|подар/.test(n)){KEEP=true;CTX.ti=null;CTX.topic=null;CTX.offer='расскажи свою историю';return{html:nr('pp',PERSONA),chips:['Расскажи свою историю','Какой ты?','Что ты любишь?','Загадай загадку']}}
 var c=code(q),p=parse(q),A=null;if(/подар|(^| )дар(ю|им)( |$)/.test(n)&&p.f.cat)p.w=p.w.filter(function(x){return!/^(дух|парф|флак|арома|запах)/.test(x.s)});if(c){var a2=D.aromas.filter(function(x){return x.n===c})[0];if(a2){CTX.a=a2;return{html:pre+'Нашёлся! ✨ Вот что стоит знать:'+card({a:a2,hit:{}},true),chips:['Как продать','Похожие','Ноты']}}}
 A=findA(p);A.forEach(function(x){x.m=0;p.w.forEach(function(y){if(x.a._m[y.s])x.m++})});var sb=sub(q,n,p,A);if(sb){sb.html=pre+sb.html;sb.chips=sb.chips||['Как продать','Похожие','Ноты'];return sb}
 var need=Math.ceil(p.w.length*.5),Q=(p.w.length?findQ(p):[]).filter(function(r){return cov(r.it.q+' '+r.it.a,p)>=need}),S=(p.w.length?findS(p):[]).filter(function(r){return cov(r.s.n+' '+r.s.k+' '+r.s.x,p)>=need}),bs=A.length?A[0].sc:0,qs=Q.length?Q[0].sc:0,ss=S.length?S[0].sc:0,nh=A.length&&Object.keys(A[0].hit).length>0,asked=/аромат|пахн|нот|для (муж|жен|нее|него)|подар|свеж|сладк|унисекс|духи/.test(n)||p.f.cat||p.f.t.length,giftQ=/подар|(^| )дар(ю|им)( |$)/.test(n)&&!!p.f.cat,sig=!!(nh||asked||p.f.cat||p.f.t.length||(A.length&&A[0].m>0));
 var fact=/факт|что такое|расскажи|правда ли|откуда|почему|зачем|истори|как делают|из чего/.test(n);var skipQS=giftQ||(!!(p.f.cat||p.f.t.length)&&!/факт|что такое|правда ли|откуда|почему|зачем|истори|как делают|из чего|скидк|бонус|отчет|смен|блоттер|цен/.test(n));
 if(!skipQS&&Q.length&&(fact||!A.length||(nh?qs>=bs*4:(!asked&&qs>=4)||qs>=bs)))return{html:pre+qaCard(Q,p),chips:defc()};
 if(!skipQS&&S.length&&(!A.length||(nh?ss>=bs*4:(!asked&&ss>bs*1.5)||(ss>=6&&bs<3))))return{html:pre+secCard(S,p),chips:defc()};
 if(A.length&&sig){CTX.a=A[0].a;var k=more?8:4,list=A.slice(0,k),e='✨',nm=p.w[0]?p.w[0].raw:'';p.w.forEach(function(x){if(EM[x.s]&&e==='✨')e=EM[x.s]});
  if(p.w[0]){var t0=exp(p.w[0].s);['base','heart','top'].forEach(function(z){A[0].a[z].forEach(function(x){if(t0.indexOf(toks(x)[0])===0||toks(x).indexOf(p.w[0].s)>=0)nm=x})})}
  var intro=p.w.length&&!nh?'Такой ноты в пирамидах нет 🤔 Но вот близкое по настроению:':p.w.length&&EM[p.w[0].s]&&nh?e+' '+nm.charAt(0).toUpperCase()+nm.slice(1)+' — '+nr('pr',PR)+'! Вот что стоит показать:':nr('in',['Отличный запрос! ','Есть из чего выбрать! ','С огромным удовольствием, Добби подберёт! ','Класс, смотрим! '])+e+' Вот что подойдёт:';
  return{html:pre+intro+list.map(function(r){return card(r)}).join('')+(A.length>k?'<p class="ot">Всего подходит '+A.length+'.</p>':'')+'<p class="ot">'+nr('ou',OUT)+'</p>',more:A.length>k,chips:A.length>k?['Показать ещё']:['Как продать','Похожие','Ноты']}}
 if(Q.length)return{html:pre+qaCard(Q,p),chips:defc()};if(S.length)return{html:pre+secCard(S,p),chips:defc()};
 if(CTX.ti!=null||CTX.offer||CTX.topic)return{html:nr('ak',ACK),chips:CTX.ti!=null?['Расскажи ещё'].concat(defc().slice(0,3)):defc()};var sb2=smartB(q,n);if(sb2)return sb2;return unknown(q,pre)}
root.ETIBHelper={reply:reply,answer:qzAnswer,load:function(d){D=d},shared:function(l){SHARED=(l||[]).filter(function(x){return x&&x.p&&x.a}).slice(0,300)},lessons:lessons};
if(typeof document==='undefined')return;
var css=[
'#hb{position:fixed;right:14px;bottom:calc(16px + env(safe-area-inset-bottom));width:66px;height:54px;padding:0;border-radius:18px 18px 6px 18px;border:1px solid var(--g-bd,rgba(255,255,255,.9));background:linear-gradient(var(--g-bg,rgba(255,255,255,.55)),var(--g-bg,rgba(255,255,255,.55))),color-mix(in srgb,var(--paper,#fff) 30%,transparent);-webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);color:var(--ink,#15120f);font-size:26px;line-height:1;box-shadow:var(--g-sh,0 8px 28px rgba(60,30,40,.14),inset 0 1px 0 rgba(255,255,255,.95));z-index:50;cursor:pointer;transform-origin:100% 100%;transition:transform .25s cubic-bezier(.2,.8,.2,1),opacity .2s}',
'@keyframes hbin{0%{opacity:0;transform:translateY(34px) scale(.3)}55%{opacity:1;transform:translateY(-7px) scale(1.1)}78%{transform:translateY(2px) scale(.96)}100%{opacity:1;transform:none}}#hb{animation:hbin .8s cubic-bezier(.2,.8,.2,1) 1.2s backwards}',
'#hb.hi{bottom:calc(214px + env(safe-area-inset-bottom))}\n#hb:active{transform:scale(.92)}#hb.off{transform:scale(.4);opacity:0;visibility:hidden;pointer-events:none;transition:transform .25s,opacity .2s,visibility 0s .25s}',
'#hv{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(20,10,14,.4);opacity:0;visibility:hidden;transition:opacity .3s,visibility 0s .3s;z-index:55}#hv.on{opacity:1;visibility:visible;transition:opacity .3s}',
'#hp{position:fixed;left:0;right:0;bottom:0;height:80dvh;max-width:560px;margin:auto;background:color-mix(in srgb,var(--bg,#f7f2f1) 84%,transparent);color:var(--fg,#1d1517);border-radius:20px 20px 0 0;border:1px solid var(--g-bd,rgba(255,255,255,.9));border-bottom:0;-webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);box-shadow:0 -6px 30px #0004,inset 0 1px 0 rgba(255,255,255,.6);z-index:60;display:flex;flex-direction:column;font:16px/1.4 system-ui,sans-serif;',
' transform:translateY(48px) scale(.97);transform-origin:50% 100%;opacity:0;visibility:hidden;pointer-events:none;transition:transform .38s cubic-bezier(.2,.9,.25,1),opacity .25s,visibility 0s .38s}',
'#hp.on{transform:none;opacity:1;visibility:visible;pointer-events:auto;transition:transform .38s cubic-bezier(.2,.9,.25,1),opacity .25s}',
'#hp{--cd:#fff}@media(prefers-color-scheme:dark){#hp{--bg:#1a1216;--fg:#f3eaec;--cd:#2a1e24}}',
'#hh{display:flex;align-items:center;gap:10px;padding:14px 6px 8px 16px;position:relative;touch-action:none}#hh:before{content:"";position:absolute;top:6px;left:50%;width:36px;height:4px;margin-left:-18px;border-radius:2px;background:#8886}',
'.hav{width:38px;height:38px;border-radius:50%;background:var(--cd);border:2px solid var(--accent,#7a2e3f);display:flex;align-items:center;justify-content:center;font-size:19px;flex:none}.ht{flex:1;min-width:0}.ht b{display:block;line-height:1.15}.ht small{opacity:.65;font-size:12px}',
'#hx{min-width:48px;min-height:48px;border:0;background:none;font-size:20px;color:inherit;cursor:pointer}',
'#hl{flex:1;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:4px 12px 8px;display:flex;flex-direction:column;gap:8px}',
'.hm{max-width:92%;padding:10px 12px;border-radius:14px 14px 14px 4px;background:var(--cd);animation:hin .3s cubic-bezier(.2,.8,.2,1) both}.hu{align-self:flex-end;background:var(--accent,#7a2e3f);color:#fff;border-radius:14px 14px 4px 14px}',
'@keyframes hin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
'.hdt{display:flex;gap:5px;padding:13px 14px;width:max-content}.hdt i{width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.3;animation:hdt 1s infinite}.hdt i:nth-child(2){animation-delay:.15s}.hdt i:nth-child(3){animation-delay:.3s}@keyframes hdt{0%,60%,100%{opacity:.3;transform:none}30%{opacity:.9;transform:translateY(-3px)}}',
'.hcr{display:inline-block;width:2px;height:1em;margin-left:1px;vertical-align:-.12em;background:var(--accent,#7a2e3f);animation:hbl .7s steps(1) infinite}@keyframes hbl{50%{opacity:0}}',
'.hc{margin:8px 0;padding:8px 10px;border-radius:10px;border:1px solid #8884;border-left:3px solid var(--accent,#7a2e3f)}.hc small{display:block;opacity:.7}.hc p{margin:4px 0}#hp .nt{font-size:14px}#hp .ps{font-style:italic}.hc a,.hs{color:var(--accent,#7a2e3f);font-weight:600}',
'.hs{display:block;margin:6px 0;padding:8px 10px;border:1px solid #8884;border-radius:10px;text-decoration:none}.hs small{display:block;color:var(--fg,#1d1517);opacity:.7;font-weight:400}#hp .ot{margin:6px 0 0;opacity:.8}',
'.hg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:72px;gap:8px;margin:2px 0 6px;transition:opacity .2s,transform .2s}.hg.go{opacity:0;transform:scale(.96)}',
'.hg button{display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;padding:10px 12px;border-radius:14px;border:1px solid #8886;background:var(--cd);color:inherit;font:600 14px/1.2 system-ui,sans-serif;text-align:left;cursor:pointer;animation:hin .35s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 60ms);transition:transform .15s}',
'.hg button span{font-size:22px;line-height:1}.hg button:active,#hq button:active,.hqo:active{transform:scale(.97)}',
'#hq{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:44px;gap:6px;padding:6px 12px}#hq.off{display:none}',
'#hq button{display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden;padding:0 10px;border-radius:12px;border:1px solid #8886;background:var(--cd);color:inherit;font:inherit;font-size:14px;line-height:1.15;cursor:pointer;animation:hin .3s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 50ms);transition:transform .15s}',
'#hq button:last-child:nth-child(odd){grid-column:1/-1}',
'.hqg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:56px;gap:6px;margin:6px 0}',
'.hqo{display:flex;align-items:center;width:auto;margin:0;min-height:0;overflow:hidden;border-radius:12px;border:1px solid #8886;background:var(--cd);color:inherit;font:inherit;font-size:14px;line-height:1.2;text-align:left;padding:6px 10px;cursor:pointer;transition:transform .15s,background .2s}.hqo.ok{background:#2e7d3240}.hqo.no{background:#b0003a40}',
'#hf{display:flex;gap:8px;padding:6px 12px calc(10px + env(safe-area-inset-bottom))}#hi{flex:1;min-height:48px;border-radius:12px;border:1px solid #8886;padding:0 12px;font:inherit;background:var(--cd);color:inherit}#hs{min-height:48px;min-width:52px;border:0;border-radius:12px;background:var(--accent,#7a2e3f);color:#fff;font-size:20px;cursor:pointer}',
'#hp{--bg:var(--paper,#f7f2f1);--fg:var(--ink,#1a1215);--cd:color-mix(in srgb,var(--card,#fff) 86%,transparent);--ha:var(--k,var(--accent,#7a2e3f));--hb:var(--g-bd,rgba(255,255,255,.9));font-family:var(--sans,system-ui,sans-serif);background:color-mix(in srgb,var(--paper,#f7f2f1) 94%,transparent);border-radius:var(--r-l,22px) var(--r-l,22px) 0 0}',
'#hp .hav{background:var(--g-bg);border:1px solid var(--hb);box-shadow:var(--g-sh);width:42px;height:42px;font-size:21px}#hp .ht b{font:700 19px/1.1 var(--serif,Georgia,serif);letter-spacing:.02em}#hp .ht small{opacity:1;color:var(--mute,#6b5f62);font-size:13px}',
'#hp #hx{min-width:44px;width:44px;min-height:44px;margin-right:6px;border-radius:50%;background:var(--g-bg);border:1px solid var(--hb);box-shadow:var(--g-sh);font-size:16px;display:grid;place-items:center}',
'#hp .hm{max-width:88%;padding:10px 14px;font-size:15px;line-height:1.45;border:1px solid var(--hb);border-radius:18px 18px 18px 6px;background:var(--cd);box-shadow:0 1px 3px rgba(60,30,40,.1);transform-origin:0 100%;animation:hpop .3s cubic-bezier(.34,1.45,.5,1) both}',
'#hp .hu{background:var(--ha);color:var(--paper,#fff);border-color:transparent;border-radius:18px 18px 6px 18px;transform-origin:100% 100%}',
'@keyframes hpop{from{opacity:0;transform:translateY(10px) scale(.9)}to{opacity:1;transform:none}}',
'#hp .hc{margin:8px 0 0;padding:10px 12px;border-radius:14px;border:1px solid color-mix(in srgb,var(--ha) 35%,transparent);border-left:4px solid var(--ha);background:color-mix(in srgb,var(--ha) 7%,transparent)}#hp .hc a,#hp .hs{color:var(--ha)}#hp .hs{border-radius:14px;border-color:color-mix(in srgb,var(--ha) 35%,transparent);background:color-mix(in srgb,var(--ha) 7%,transparent)}',
'#hp .hg button,#hp #hq button,#hp .hqo{background:var(--g-bg);border:1px solid var(--hb);box-shadow:var(--g-sh);font-family:inherit}#hp .hg button{border-radius:var(--r-m,18px)}#hp #hq button{border-radius:999px;font-size:13.5px;font-weight:600;color:var(--ha)}',
'#hp .hqo.ok{background:color-mix(in srgb,#2f7d54 22%,transparent);border-color:#2f7d54}#hp .hqo.no{background:color-mix(in srgb,#b3382c 20%,transparent);border-color:#b3382c}',
'#hp #hf{align-items:center;gap:0;padding:8px 12px calc(10px + env(safe-area-inset-bottom))}',
'#hp #hi{flex:1;min-width:0;min-height:48px;padding:0 18px;border-radius:999px;border:1px solid var(--hb);background:var(--g-bg);color:var(--fg);box-shadow:var(--g-sh);font:16px var(--sans,system-ui,sans-serif);outline:0;transition:border-color .2s,box-shadow .2s}#hp #hi::placeholder{color:var(--mute,#6b5f62);opacity:1}#hp #hi:focus{border-color:var(--ha);box-shadow:0 0 0 3px color-mix(in srgb,var(--ha) 22%,transparent)}',
'#hp #hs{display:grid;place-items:center;flex:none;width:0;min-width:0;height:44px;margin:0;padding:0;border-radius:50%;background:var(--ha);color:var(--paper,#fff);opacity:0;transform:scale(.3);pointer-events:none;overflow:hidden;transition:width .25s cubic-bezier(.34,1.45,.5,1),margin .25s,opacity .2s,transform .25s cubic-bezier(.34,1.45,.5,1)}',
'#hp #hf.has #hs{width:44px;min-width:44px;margin-left:8px;opacity:1;transform:none;pointer-events:auto}#hp #hf.has #hs:active{transform:scale(.9)}',
'#hp :focus-visible{outline:3px solid var(--ha);outline-offset:2px}',
'/* ---- окно Добби = стекло плашки «Каталог ароматов»: та же заливка, рамка и размытие; подложка плотнее, а страница под окном размыта, чтобы текст сзади не мешал чтению ---- */',
'#hv{background:rgba(20,10,14,.24);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}',
'#hp{--cd:color-mix(in srgb,var(--card,#fff) 90%,transparent);background:linear-gradient(var(--g-bg,rgba(255,255,255,.55)),var(--g-bg,rgba(255,255,255,.55))),color-mix(in srgb,var(--paper,#f7f2f1) 68%,transparent);border:1px solid var(--g-bd,rgba(255,255,255,.9));border-bottom:0;-webkit-backdrop-filter:blur(28px) saturate(160%);backdrop-filter:blur(28px) saturate(160%);box-shadow:0 -10px 32px rgba(40,20,28,.16),var(--g-sh,inset 0 1px 0 rgba(255,255,255,.95))}',
'#hp #hf{border-top:1px solid var(--g-bd,rgba(255,255,255,.9))}',
'@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){#hp{background:var(--paper,#f7f2f1)}#hv{background:rgba(20,10,14,.5)}}',
'.hjs{display:block;width:100%;box-sizing:border-box;margin:8px 0 0;padding:8px;border-radius:10px;border:1px solid #8886;background:transparent;color:inherit;font:12px/1.35 ui-monospace,Menlo,monospace;resize:none}',
'@media(prefers-reduced-motion:reduce){#hp,#hp.on,#hv,#hv.on,#hb,#hb.off,.hm,.hg,.hg button,#hq button{transition:none!important;animation:none!important}.hcr{animation:none}}'
].join('');
var s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
var b=document.createElement('button');b.id='hb';if(document.querySelector('a.hero'))b.classList.add('hi');b.setAttribute('aria-label','Добби');b.textContent='🧦';
var V=document.createElement('div');V.id='hv';
var p=document.createElement('div');p.id='hp';p.setAttribute('role','dialog');p.setAttribute('aria-label','Добби · помощник ETIB');p.setAttribute('inert','');
p.innerHTML='<div id="hh"><div class="hav">🧦</div><div class="ht"><b>Добби</b><small>помощник ETIB</small></div><button id="hx" aria-label="Закрыть">✕</button></div><div id="hl"></div><div id="hq" class="off"></div><form id="hf"><input id="hi" placeholder="Например: что-то с ванилью" autocomplete="off" enterkeyhint="send"><button id="hs" aria-label="Отправить"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 19V6M6.5 11.5 12 6l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></form>';
document.body.appendChild(V);document.body.appendChild(b);document.body.appendChild(p);
var L=p.querySelector('#hl'),I=p.querySelector('#hi'),Q=p.querySelector('#hq'),last='',loaded=false,fin=null,G=null;
var TILES=[['🍦','Подобрать аромат','что-то с ванилью'],['🎁','Подарок','подарок маме'],['💬','Возражение «дорого»','возражение «дорого»'],['🎯','Викторина','викторина'],['🧴','Блоттеры сейчас','блоттеры сейчас'],['⏰','Когда отчёт','когда отчёт']];
function still(){try{return matchMedia('(prefers-reduced-motion:reduce)').matches}catch(e){return false}}
function near(){return L.scrollHeight-L.scrollTop-L.clientHeight<70}
function stick(){L.scrollTop=L.scrollHeight}
function add(h,u){var d=document.createElement('div');d.className='hm'+(u?' hu':'');if(u)d.textContent=h;else d.innerHTML=h;L.appendChild(d);stick();return d}
function dots(){var d=document.createElement('div');d.className='hm hdt';d.innerHTML='<i></i><i></i><i></i>';L.appendChild(d);stick();return d}
function group(m){var o=m.querySelectorAll('.hqo');if(!o.length)return;var g=document.createElement('div');g.className='hqg';o[0].parentNode.insertBefore(g,o[0]);[].forEach.call(o,function(x){g.appendChild(x)})}
/* печать текста: структура (карточки, ссылки) сохраняется, буквы появляются по очереди; тап по сообщению дописывает его сразу */
function type(d,done){if(done)done()}
function chips(t){Q.innerHTML='';if(!t||!t.length){Q.className='off';return}
 t.slice(0,4).forEach(function(x,i){var c=document.createElement('button');c.type='button';c.textContent=x;c.style.setProperty('--i',i);c.onclick=function(){say(x)};Q.appendChild(c)});Q.className='';stick()}
function bot(html,ch,delay,cb){
 var rich=/class="(hc|hs|hqg|hqo)/.test(html),ind=null;
 var show=function(){if(ind&&ind.parentNode)ind.parentNode.removeChild(ind);var m=add(html);group(m);if(ch)chips(ch);
  if(m.offsetHeight>L.clientHeight*.6)L.scrollTop=Math.max(0,m.offsetTop-L.offsetTop-8);
  if(cb)cb()};
 /* карточки и быстрые ответы — сразу; обычный текст — короткое «набирает…» и целое сообщение */
 if(rich){show();return}
 ind=dots();var n=String(html).replace(/<[^>]*>/g,'').length;
 setTimeout(show,delay==null?Math.min(900,Math.max(380,260+n*4)):delay)}
function tiles(){G=document.createElement('div');G.className='hg';TILES.forEach(function(t,i){var c=document.createElement('button');c.type='button';c.style.setProperty('--i',i);c.innerHTML='<span>'+t[0]+'</span>'+esc(t[1]);c.onclick=function(){say(t[2])};G.appendChild(c)});L.appendChild(G);stick()}
function dropTiles(){if(!G)return;var g=G;G=null;g.classList.add('go');setTimeout(function(){if(g.parentNode)g.parentNode.removeChild(g)},200)}
function say(t,more){if(fin)fin();dropTiles();add(t,1);I.value='';HF.classList.remove('has');last=t;chips([]);
 var go=function(){var r=reply(t,more);bot(r.html,r.chips||defc())};
 if(D)go();else{var ind=dots();fetch('helper-data.json').then(function(r){return r.json()}).then(function(d){D=d;if(ind.parentNode)ind.parentNode.removeChild(ind);go()}).catch(function(){if(ind.parentNode)ind.parentNode.removeChild(ind);bot('Не удалось загрузить данные. Проверьте интернет и обновите страницу 🙏',defc(),0)})}}
var HF=p.querySelector('#hf');I.addEventListener('input',function(){HF.classList.toggle('has',!!I.value.trim())});
HF.onsubmit=function(e){e.preventDefault();var v=I.value.trim();if(v)say(v)};
L.addEventListener('click',function(e){var b=e.target.closest('.hqo');if(!b||b.disabled)return;var r=ETIBHelper.answer(+b.dataset.i);[].forEach.call(b.parentNode.querySelectorAll('.hqo'),function(x,i){x.disabled=true;if(i===r.right)x.classList.add('ok');else if(x===b)x.classList.add('no')});bot(r.html,r.chips||defc(),300)});
p.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(a)setTimeout(close,0)});
Q.addEventListener('click',function(e){if(e.target.textContent==='Показать ещё'){e.stopImmediatePropagation();Q.innerHTML='';var r=reply(last,true);bot(r.html,defc())}},true);
var fine=false;try{fine=matchMedia('(pointer:fine)').matches}catch(e){}
var sh0=false;function open(){if(!sh0){sh0=true;try{fetch('dobby-learn.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null}).then(function(d){if(d&&d.lessons)ETIBHelper.shared(d.lessons)}).catch(function(){})}catch(e){}}p.removeAttribute('inert');p.classList.add('on');V.classList.add('on');b.classList.add('off');
 if(!loaded){loaded=true;setTimeout(function(){bot(hello()+'! 🧦 Добби приветствует вас! Добби — свободный эльф, а теперь ещё и помощник ETIB. Добби подберёт аромат, найдёт ответ в шпаргалке или сыграет с вами в викторину. С чего начнём?',null,380,tiles)},280)}
 if(fine)setTimeout(function(){I.focus({preventScroll:true})},300)}
function close(){if(fin)fin();p.classList.remove('on');V.classList.remove('on');b.classList.remove('off');p.setAttribute('inert','');if(document.activeElement===I)I.blur()}
b.onclick=open;V.onclick=close;p.querySelector('#hx').onclick=close;
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&p.classList.contains('on'))close()});
/* свайп вниз по шапке закрывает окно */
var hh=p.querySelector('#hh'),y0=null,dy=0;
hh.addEventListener('touchstart',function(e){if(e.target.closest('#hx'))return;y0=e.touches[0].clientY;dy=0;p.style.transition='none'},{passive:true});
hh.addEventListener('touchmove',function(e){if(y0===null)return;dy=Math.max(0,e.touches[0].clientY-y0);p.style.transform='translateY('+dy+'px)'},{passive:true});
hh.addEventListener('touchend',function(){if(y0===null)return;var c=dy>90;y0=null;dy=0;p.style.transition='';p.style.transform='';if(c)close()});
})(typeof window!=='undefined'?window:globalThis);
