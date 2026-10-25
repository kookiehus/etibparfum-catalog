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
var OUT=['Хотите уточнить — для мужчины, свежее, на вечер? Просто напишите 😊','Могу подобрать ещё: напишите ноту, повод или номер аромата 🌸','Не то? Скажите чуть подробнее, и найдём лучше ✨'];
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function prep(d){if(d._p)return;d.aromas.forEach(function(a){a._n={};['top','heart','base'].forEach(function(k){a[k].forEach(function(p){toks(p).forEach(function(t){a._n[t]=Math.max(a._n[t]||0,k==='top'?2:3)})})});
 a._m={};toks(a.nm+' '+a.ru+' '+a.n).forEach(function(t){a._m[t]=1});a._t={};toks(a.how+' '+a.whom+' '+a.hooks.join(' ')).forEach(function(t){a._t[t]=1})});
 d.qa=d.qa||[];d.sections.forEach(function(s){s._n={};toks(s.n).forEach(function(t){s._n[t]=1});s._k={};toks(s.k).forEach(function(t){s._k[t]=1});s._x={};toks(s.x).forEach(function(t){s._x[t]=1})});d._p=1}
function code(q){var m=String(q).trim().toUpperCase().match(/^([A-ZА-Я])\s?-?(\d{1,2})$/);if(!m)return null;return(LK[m[1]]||m[1])+m[2]}
function parse(q){var raw=norm(q).split(' ').filter(Boolean),f={cat:null,t:[]},w=[];
 raw.forEach(function(r){var s=st(r);
  if(/^женск|унисе|премиу|мужск/.test(r)){f.cat=r.indexOf('жен')===0?'ЖЕНСКИЕ':r.indexOf('муж')===0?'МУЖСКИЕ':r.indexOf('уни')===0?'УНИСЕКС':'ПРЕМИУМ';return}
  if(FEM.indexOf(s)>=0){f.cat='ЖЕНСКИЕ';return}if(MAS.indexOf(s)>=0){f.cat='МУЖСКИЕ';return}
  if(s===S_FRESH||s===S_SWEET){f.t.push(s);return}
  if(STOP.indexOf(s)<0&&s.length>1)w.push({s:s,raw:r})});return{f:f,w:w}}
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
var POOL=['что-то с ванилью','свежее для мужчины','подарок маме','викторина','расскажи шутку','блоттеры сейчас','бонусы','возражение «дорого»','удиви меня','когда отчёт','факт про розу','подбодри меня'];
function defc(){return POOL.slice().sort(function(){return Math.random()-.5}).slice(0,5)}
var CR=/не хочу жить|хочу умереть|покончить с собой|убить себя|навредить себе|суицид/;
var TALK=[
[/^(привет|здравствуй|здравствуйте|добрый день|доброе утро|добрый вечер|хай|салют|ку|hello|hi|приветик)( |$)/,['{h}! ☀️ Добби очень рад вас видеть! Добби подскажет аромат, найдёт ответ в шпаргалке или устроит викторину. С чего начнём?','Привет-привет! 🧦 Добби уже на месте и готов помогать. Что ищем?','{h}! 😊 Добби ждал вас! Спрашивайте про ароматы, бонусы, отчёты — или просто поболтаем.','О, привет! ✨ Добби сегодня в отличном настроении. А у вас? Чем помочь?']],
[/как (у вас |твои |ваши )?(дела|жизнь|ты|сам|настроение)/,['У Добби всё чудесно, ведь вокруг столько ароматов! 🌺 А как вы?','Добби бодр и полон идей! ⚡ Расскажите, как у вас, или сразу подберём что-нибудь клиенту.','Лучше всех: Добби сегодня уже кому-то пригодился 😄 А ваши дела как?']],
[/^(хорошо|отлично|нормально|прекрасно|замечательно|бодро|отлично все|все хорошо)( |$)/,['Добби в восторге! 🎉 Пусть так и продолжается. Чем помочь?','Ура! 🌟 С таким настроем продажи идут сами. Что ищем?','Как здорово! 😊 Тогда добавим веселья: викторина или подбор аромата?']],
[/кто ты|ты кто|как тебя зовут|ты бот|ты человек|ты робот|ты ии|ты нейросеть|как тебя звать/,['Я Добби! 🧦 Верный помощник ETIB PARFUM. Не нейросеть и не настоящий эльф, зато каталог, шпаргалку и тренажёр знаю наизусть!','Добби — помощник этого сайта 🤖 Знает всё про ароматы, продажи и отчёты. Спросите что-нибудь! ✨']],
[/что (ты )?умеешь|что можешь|чем (поможешь|можешь помочь)|^помощь$|^помоги$|как (тобой )?пользоваться/,['Добби умеет много! 💫 Подбирает аромат по ноте или поводу («что-то с ванилью», «подарок маме»), отвечает по шпаргалке («клиент говорит дорого», «бонусы для гуру 5000»), подсказывает, когда раздаём блоттеры и сдаём отчёт, устраивает викторину, шутит и поднимает настроение 😄']],
[/спасибо|благодар|спс|^(супер|круто|класс|молодец|отлично)( |$)/,['Добби счастлив помочь! 🌷 Обращайтесь ещё.','Это лучшая награда для Добби! 🥰','Всегда пожалуйста! ⭐ Добби рядом, если что.','Это вам спасибо за хорошие вопросы 😊']],
[/^(пока|до свидания|до завтра|до встречи|всего доброго|хорошего дня|удачи)( |$)/,['Пока-пока! 👋 Лёгкой смены и много продаж!','До встречи! 🌸 Добби будет ждать.','Хорошего дня! ✨ Улыбка — лучший аромат для клиента.']],
[/устал|тяжело|нет сил|выжат|надоел|скучно|грустно|тоска|плохое настроение|плохо на душе|бесит|не хочу работать|тошно/,['Добби понимает, бывают такие дни 🫂 Сделайте медленный вдох-выдох и улыбнитесь: клиент ответит тем же, и станет легче обоим. Хотите шутку, аромат дня или викторину?','Спасибо, что поделились 💛 Добби уверен: вы справляетесь лучше, чем думаете. Давайте отвлечёмся: хотите шутку или приятный аромат дня?','Держитесь! 🌈 Смена закончится, а вы останетесь молодцом. Добби может рассмешить или подкинуть аромат для настроения.']],
[/нет продаж|не продаю|никто не покупает|пустой зал|мало покупател|не идут продажи|нет покупател|план не/,['Бывает, и это не про вас 💪 Затишье сменяется приливом. Улыбка, открытая поза, пара вопросов вошедшему, и всё закрутится. Напишите «этапы», Добби напомнит 8 этапов продаж.','Не переживайте! 🌟 Попробуйте предложить блоттер всем проходящим и спросить: «Для себя или в подарок?» Это отлично разгоняет разговор.','Тишина перед бурей 🌊 Пока никого нет, можно освежить знания: хотите викторину?']],
[/нахамил|хамит|грубый клиент|скандал|накричал|обидел|грубо/,['Добби очень сочувствует 🫂 Это не про вас: у человека, видимо, плохой день. Сохраняйте спокойствие и вежливость, а потом выдохните и сделайте паузу. Напишите «возражения», Добби подскажет, как отвечать.','Не принимайте близко к сердцу 💛 Вы профессионал. Спокойный тон, пара глубоких вдохов и слова «давайте вместе разберёмся» творят чудеса.']],
[/продал|продажа удалась|я молодец|выполнил план|закрыл план|получилось|успех|ура/,['Ура! 🎉 Добби в восторге! Вот это результат, так держать!','Браво! 👏 Пусть таких продаж будет ещё больше.','Супер! 🌟 Расскажите потом коллегам, как получилось: ваш приём может пригодиться всем.']],
[/шутк|анекдот|рассмеши|пошути|смешное|развесели|прикол/,['Добби проверил: у блоттера нет карманов, а у Добби есть носок. Хороший день для обоих! 🧦','Хороший продавец как заклинание: нужны правильные слова и улыбка, и клиент уходит с покупкой! ✨','Говорят, в Хогвартсе есть зелье счастья. А у нас оно во флаконе, да ещё и с бонусами! 🧪','Добби не нужна палочка: хватит блоттера и хорошего настроения! 🪄','Клиент спросил: «А есть аромат, как у волшебника?» Добби ответил: «Есть! Только мантии-невидимки в комплекте нет» 😄','Шляпа распределяет студентов по факультетам, а Добби распределяет ароматы: сладкие в уют, свежие в бодрость! 🎩','Носок — лучший подарок для эльфа. А для клиента аромат! Добби проверил: оба счастливы 🧦🎁']],
[/комплимент|похвали|приятное|подбодри|мотивац|вдохнови|поддержи/,['Добби считает вас настоящим волшебником продаж! ✨ Сегодня у вас точно получится.','Добби гордится работой с вами 🌟 Вы умеете находить подход к людям, а это редкий дар.','Каждая продажа начинается с улыбки, а у вас она точно красивая 😊','Вы выбрали работу, где людям дарят радость. Это здорово! 💐']],
[/ты лучший|люблю тебя|ты классный|ты умный|ты крутой|ты молодец/,['Ой, Добби краснеет 🥰 Спасибо, это очень приятно!','Добби счастлив! 🌹 А вы супер, вместе мы сила.']],
[/дурак|тупой|идиот|ужасный бот|плохой бот|ты бесполезен/,['Добби понял, бывает 🙈 Давайте попробуем ещё раз: напишите проще, например, одно слово.','Простите, если Добби не помог 🙏 Напишите, что нужно, и он постарается лучше.']]];
function talk(n){for(var i=0;i<TALK.length;i++)if(TALK[i][0].test(n))return nr('t'+i,TALK[i][1]).replace('{h}',hello());return null}
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
var FB=['Добби старался, но пока не нашёл 🤔 Попробуйте проще: одно слово («ваниль», «блоттеры», «бонусы»), номер аромата (A2) или повод («подарок маме»).','Тут Добби растерялся 🙈 Скажите иначе: ноту, номер аромата или тему из шпаргалки. А ещё можем сыграть в викторину!','Добби не поймал мысль 😅 Напишите короче: например «скидка 10%», «свежее для мужчины» или просто «шутку».'];
function reply(q,more){if(!D)return{html:'Секундочку, Добби достаёт знания… 📚'};prep(D);var n=norm(q),pre='';
 if(!n)return{html:'Напишите, что ищете: ноту, повод, номер аромата или тему 😊'};
 if(CR.test(n))return{html:'Мне очень жаль, что вам так тяжело 💛 Вы не одни. Пожалуйста, поговорите сейчас с близким человеком или обратитесь на горячую линию помощи или в экстренную службу вашей страны. Если вы в опасности, звоните немедленно.'};
 if(QZ&&/^(дальше|еще|следующий|продолжить|давай еще)/.test(n))return qzNext();if(/^(хватит|стоп|закончить|выход|не хочу больше)/.test(n)&&QZ)return qzEnd();
 var g=/^(привет|здравствуйте|здравствуй|добрый день|доброе утро|добрый вечер|хай|салют|приветик)\s+/,n2=n.replace(g,'');if(n2!==n&&n2.split(' ').length>=2){pre=hello()+'! 😊 ';n=n2;q=n2}
 var t=talk(n);if(t)return{html:t,chips:defc()};
 if(/викторин|потренируй|спроси меня|проверь меня|давай тест|квиз|тренировк/.test(n)){QZ=null;var r0=qzNext();r0.html='Добби обожает викторины! 🧠 Выбирайте ответ кнопкой.<br>'+r0.html;return r0}
 if(/удиви|случайн|аромат дня|посоветуй что-нибудь|что-нибудь интересн/.test(n)){var a=rnd(D.aromas);CTX.a=a;return{html:nr('rd',['Добби выбрал фаворита дня 🌟','Сюрприз от Добби 🎁','Держите находку! ✨'])+card({a:a,hit:{}},false)+(a.pitch?'<p class="ps">💬 '+esc(a.pitch)+'</p>':''),chips:['Ещё один','Как продать','Похожие']}}
 if(/^ещ[её] (один|раз)/.test(n))return reply('удиви меня');if(/^как продать$/.test(n)&&CTX.a)return sub('как продать',n,{w:[]},[]);if(/^похожие$/.test(n)&&CTX.a)return sub('похожие',n,{w:[]},[]);
 if(/^(ещ[её] )?(расскажи )?(что.нибудь )?(факт|интересн)[а-я]*$/.test(n)||/^ещ[её] факт/.test(n))return factR();
 var rs=route(n);if(rs&&!/сейчас|когда отчет/.test(n))return{html:pre+secCard([{s:rs,sc:9}],{w:[]}),chips:defc()};
 if(/блоттер|раздач/.test(n)&&/сейчас|когда|можно|перерыв|идти|время|ещё|еще/.test(n)&&!/как|правил/.test(n))return{html:blot(),chips:defc()};
 if(/отчет|отчёт/.test(n)&&/когда|сейчас|следующ|во сколько|время/.test(n))return{html:rep(),chips:defc()};
 var bc=bonus(q,n);if(bc)return{html:bc,chips:defc()};
 var c=code(q),p=parse(q),A=null;if(c){var a2=D.aromas.filter(function(x){return x.n===c})[0];if(a2){CTX.a=a2;return{html:pre+'Нашёлся! ✨ Вот что стоит знать:'+card({a:a2,hit:{}},true),chips:['Как продать','Похожие','Ноты']}}}
 A=findA(p);A.forEach(function(x){x.m=0;p.w.forEach(function(y){if(x.a._m[y.s])x.m++})});var sb=sub(q,n,p,A);if(sb){sb.html=pre+sb.html;sb.chips=sb.chips||['Как продать','Похожие','Ноты'];return sb}
 var Q=p.w.length?findQ(p):[],S=p.w.length?findS(p):[],bs=A.length?A[0].sc:0,qs=Q.length?Q[0].sc:0,ss=S.length?S[0].sc:0,nh=A.length&&Object.keys(A[0].hit).length>0,asked=/аромат|пахн|нот|для (муж|жен|нее|него)|подар|свеж|сладк|унисекс|духи/.test(n)||p.f.cat||p.f.t.length;
 var fact=/факт|что такое|расскажи|правда ли|откуда|почему|зачем|истори|как делают|из чего/.test(n);
 if(Q.length&&(fact||!A.length||(nh?qs>=bs*4:(!asked&&qs>=4)||qs>=bs)))return{html:pre+qaCard(Q,p),chips:defc()};
 if(S.length&&(!A.length||(nh?ss>=bs*4:(!asked&&ss>bs*1.5)||(ss>=6&&bs<3))))return{html:pre+secCard(S,p),chips:defc()};
 if(A.length){CTX.a=A[0].a;var k=more?8:4,list=A.slice(0,k),e='✨',nm=p.w[0]?p.w[0].raw:'';p.w.forEach(function(x){if(EM[x.s]&&e==='✨')e=EM[x.s]});
  if(p.w[0]){var t0=exp(p.w[0].s);['base','heart','top'].forEach(function(z){A[0].a[z].forEach(function(x){if(t0.indexOf(toks(x)[0])===0||toks(x).indexOf(p.w[0].s)>=0)nm=x})})}
  var intro=p.w.length&&!nh?'Такой ноты в пирамидах нет 🤔 Но вот близкое по настроению:':p.w.length&&EM[p.w[0].s]&&nh?e+' '+nm.charAt(0).toUpperCase()+nm.slice(1)+' — '+nr('pr',PR)+'! Вот что стоит показать:':nr('in',['Отличный запрос! ','Есть из чего выбрать! ','С удовольствием подберу! ','Класс, смотрим! '])+e+' Вот что подойдёт:';
  return{html:pre+intro+list.map(function(r){return card(r)}).join('')+(A.length>k?'<p class="ot">Всего подходит '+A.length+'.</p>':'')+'<p class="ot">'+nr('ou',OUT)+'</p>',more:A.length>k,chips:A.length>k?['Показать ещё']:['Как продать','Похожие','Ноты']}}
 if(Q.length)return{html:pre+qaCard(Q,p),chips:defc()};if(S.length)return{html:pre+secCard(S,p),chips:defc()};
 return{html:nr('fb',FB),chips:defc()}}
root.ETIBHelper={reply:reply,answer:qzAnswer,load:function(d){D=d}};
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
function open(){p.removeAttribute('inert');p.classList.add('on');V.classList.add('on');b.classList.add('off');
 if(!loaded){loaded=true;setTimeout(function(){bot(hello()+'! 🧦 Я Добби, помощник ETIB. Подберу аромат, найду ответ в шпаргалке или сыграю в викторину. С чего начнём?',null,380,tiles)},280)}
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
