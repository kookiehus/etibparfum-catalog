/* ETIB: кролик-тренер на экране итогов раунда.
   Разные картинки для разных результатов; подряд один и тот же вариант не показывается.
   rabbitArt(процент, ошибок, вопросов) -> html-карточка */
(function(){
'use strict';
var INK='#15120f',FUR='#fbf6ee',PINK='#f4c3cf',COAT='#3b302d',HAT='#4a3d39',HOLE='#1d1715',
    TIE='#b8315d',GOLD='#e8bf6f',GOLD2='#b8935a',BLUE='#2a5d99',GREEN='#3f8a56';
var still=false;try{still=matchMedia('(prefers-reduced-motion:reduce)').matches}catch(e){}
var EASE='calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"';
function S(w,c){return 'stroke="'+(c||INK)+'" stroke-width="'+(w||2)+'" stroke-linecap="round" stroke-linejoin="round"'}
function rot(vals,cx,cy,dur){if(still)return'';
  return '<animateTransform attributeName="transform" type="rotate" values="'+vals.map(function(v){return v+' '+cx+' '+cy}).join(';')+'" dur="'+dur+'s" repeatCount="indefinite" '+(vals.length===3?EASE:'')+'/>'}
function mv(vals,dur,extra){if(still)return'';
  return '<animateTransform attributeName="transform" type="translate" values="'+vals.map(function(v){return v[0]+' '+v[1]}).join(';')+'" dur="'+dur+'s" repeatCount="indefinite" '+(vals.length===3?EASE:'')+(extra||'')+'/>'}
function sc(vals,dur){if(still)return'';
  return '<animateTransform attributeName="transform" type="scale" values="'+vals.join(';')+'" dur="'+dur+'s" repeatCount="indefinite" '+EASE+'/>'}

/* ---------- мелочи ---------- */
function heart(x,y,s,c,cls,anim){return '<g transform="translate('+x+' '+y+') scale('+s+')"><g class="'+(cls||'')+'">'+(anim||'')+'<path d="M0 7C-16-3-10-17 0-9 10-17 16-3 0 7Z" fill="'+(c||'#e0566f')+'" '+S(1.8)+'/></g></g>'}
function flower(x,y,s,c,anim){var p='';for(var i=0;i<5;i++)p+='<circle cx="0" cy="-5.6" r="4.7" fill="'+c+'" '+S(1.2)+' transform="rotate('+(i*72)+')"/>';
  return '<g transform="translate('+x+' '+y+') scale('+s+')"><g>'+(anim||'')+p+'<circle r="3.4" fill="'+GOLD+'" '+S(1.2)+'/></g></g>'}
function spark(x,y,s,d){return '<g transform="translate('+x+' '+y+') scale('+s+')"><path class="tw" style="animation-delay:'+d+'s" d="M0-8L2.2-2.2 8 0 2.2 2.2 0 8-2.2 2.2-8 0-2.2-2.2Z" fill="'+GOLD+'" '+S(1.2,GOLD2)+'/></g>'}
function disc(x,y,c1,c2){return '<g transform="translate('+x+' '+y+')"><circle r="9.5" fill="'+c1+'" '+S(2)+'/><circle r="6.3" fill="none" stroke="'+c2+'" stroke-width="1.6"/><path d="M0-4l1.3 2.8 3 .4-2.2 2.1.6 3L0 2.8l-2.7 1.5.6-3-2.2-2.1 3-.4z" fill="'+c2+'"/></g>'}
function confetti(){var P=[[-52,-6,0,'#b8315d',0],[-30,6,1,GOLD,.7],[-8,-14,0,'#2a5d99',1.4],[14,-4,1,'#1b7253',.3],[38,-18,0,GOLD,1.9],[62,-2,1,'#b8315d',1.1],[84,-12,0,'#6b3fa0',.5],[108,-6,1,'#2a5d99',2.1],[132,-16,0,'#1b7253',.9],[150,2,1,GOLD,1.6],[-64,12,1,'#6b3fa0',2.4],[96,8,0,'#b8315d',2.7]],o='';
  P.forEach(function(p){o+='<g transform="translate('+p[0]+' '+p[1]+')"><g class="cfp" style="animation-delay:'+p[4]+'s">'+(p[2]?'<circle r="3.6" fill="'+p[3]+'"/>':'<rect x="-3.5" y="-3.5" width="7" height="7" rx="1.6" fill="'+p[3]+'"/>')+'</g></g>'});return '<g class="cf">'+o+'</g>'}

/* ---------- кролик ---------- */
function body(){
  return '<path d="M21 152Q20 120 38 113H62Q80 120 79 152Z" fill="'+COAT+'" '+S(2)+'/>'
   +'<path d="M41 113H59L50 131Z" fill="#fffdf9" '+S(1.5)+'/>'
   +'<path d="M38 113L46 128 41 139M62 113L54 128 59 139" fill="none" '+S(1.6)+'/>'
   +'<path d="M46.5 113h7l-1.4 5h-4.2z" fill="'+TIE+'" '+S(1.4)+'/><path d="M47.6 118h4.8l2.2 20-4.6 5-4.6-5z" fill="'+TIE+'" '+S(1.4)+'/>'
   +'<path d="M28 133h7" '+S(2.2,GOLD)+'/><circle cx="50" cy="148.5" r="1.3" fill="'+GOLD+'"/>'}
function mouth(f){
  var smile='<path d="M50 96.4v2.2M50 98.6q-4.2 4-8.4 1M50 98.6q4.2 4 8.4 1" fill="none" '+S(1.8)+'/>',
      grin='<path d="M42.6 98.8q7.4 11.4 14.8 0z" fill="#8b2b3d" '+S(1.8)+'/><path d="M46.4 103.8q3.6-3 7.2 0q-3.6 2.4-7.2 0z" fill="#e58ba0"/><rect x="47" y="99.4" width="3" height="3.6" rx="1" fill="#fff" '+S(1)+'/><rect x="50" y="99.4" width="3" height="3.6" rx="1" fill="#fff" '+S(1)+'/>',
      sad='<path d="M50 96.4v2.2M42.6 103.4q7.4-6.4 14.8 0" fill="none" '+S(1.8)+'/>';
  if(f==='grin')return grin;
  if(f==='sad2ok')return '<g class="m-sad">'+sad+'</g><g class="m-ok">'+smile+'</g>';
  return smile}
function eyes(f){
  var open=function(x){return '<ellipse cx="'+x+'" cy="86" rx="3" ry="3.7" fill="'+INK+'"/><circle cx="'+(x+1)+'" cy="84.6" r="1.1" fill="#fff"/>'},
      arc=function(x){return '<path d="M'+(x-4)+' 87.4q4-5.6 8 0" fill="none" '+S(2)+'/>'};
  if(f==='grin')return arc(40)+arc(60);
  if(f==='wink')return open(40)+arc(60);
  var e=open(40)+open(60);
  if(f==='sad2ok')e+='<g class="brw"><path d="M34.5 83l9-3.4M65.5 83l-9-3.4" fill="none" '+S(2)+'/></g><g class="tear"><path d="M35.6 91.4q-3.4 4.8 0 6.8t3.4-6.8z" fill="#9ccdf0" stroke="#4d86b8" stroke-width="1"/></g>';
  return e}
function head(f){
  return '<ellipse cx="50" cy="88" rx="29" ry="25" fill="'+FUR+'" '+S(2)+'/>'
   +'<circle cx="33" cy="96" r="4.6" fill="'+PINK+'" opacity=".75"/><circle cx="67" cy="96" r="4.6" fill="'+PINK+'" opacity=".75"/>'
   +'<path d="M21.5 92h-9M22 96.4l-8.5 3.2M78.5 92h9M78 96.4l8.5 3.2" fill="none" '+S(1.2)+' opacity=".5"/>'
   +eyes(f)+'<ellipse cx="50" cy="94.4" rx="3" ry="2.2" fill="#e58ba0" '+S(1.2)+'/>'+mouth(f)}
function hat(){
  return '<ellipse cx="50" cy="67" rx="34" ry="8" fill="'+HAT+'" '+S(2)+'/>'
   +'<path d="M28 42V65Q50 71 72 65V42" fill="'+HAT+'" '+S(2)+'/>'
   +'<path d="M28 56Q50 62 72 56V65Q50 71 28 65Z" fill="'+GOLD2+'" '+S(1.4)+'/>'
   +'<ellipse cx="50" cy="42" rx="22" ry="6.2" fill="'+HAT+'" '+S(2)+'/>'
   +'<ellipse cx="40" cy="42" rx="6.6" ry="2.8" fill="'+HOLE+'"/><ellipse cx="60" cy="42" rx="6.6" ry="2.8" fill="'+HOLE+'"/>'}
/* уши проходят сквозь отверстия в шляпе: низ уха прикрыт передним краем отверстия */
function ears(mode){
  var ear=function(cx,ang,anim){return '<g transform="rotate('+ang+' '+cx+' 42)">'+anim+'<ellipse cx="'+cx+'" cy="21.5" rx="6.6" ry="21" fill="'+FUR+'" '+S(2)+'/><ellipse cx="'+cx+'" cy="24" rx="3" ry="14.5" fill="'+PINK+'"/></g>'},
      lip=function(cx){return '<path d="M'+(cx-6.6)+' 42a6.6 2.8 0 0 0 13.2 0z" fill="'+HOLE+'"/>'},
      a=-7,b=7,al='',ar='';
  if(mode==='sad'||mode==='s2'){a=-50;b=50}
  if(mode==='up'&&!still){al=rot([-4,-15,-4],40,42,1.5);ar=rot([4,15,4],60,42,1.5)}
  if(mode==='s2'&&!still){var pk=function(f,t,cx){return '<animateTransform attributeName="transform" type="rotate" values="'+f+' '+cx+' 42;'+t+' '+cx+' 42" begin="1.9s" dur=".6s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".3 0 .3 1"/>'};
    al=pk(-50,-7,40);ar=pk(50,7,60)}
  return ear(40,a,al)+ear(60,b,ar)+lip(40)+lip(60)}
function arm(d,px,py,anim,extra){
  return '<g>'+(anim||'')+'<path d="'+d+'" fill="none" stroke="'+INK+'" stroke-width="13" stroke-linecap="round"/><path d="'+d+'" fill="none" stroke="'+COAT+'" stroke-width="9" stroke-linecap="round"/>'+(extra||'')+'<circle cx="'+px+'" cy="'+py+'" r="6.2" fill="'+FUR+'" '+S(2)+'/></g>'}
var P={
  dnL:['M24 126Q16 138 19 148',19,149],dnR:['M76 126Q84 138 81 148',81,149],
  chL:['M24 124Q7 114 9 91',9,88],chR:['M76 124Q93 114 91 91',91,88],
  hoL:['M24 126Q23 143 41 144',41,144],hoR:['M76 126Q77 143 59 144',59,144],
  clL:['M24 126Q28 142 45 136',45,136],clR:['M76 126Q72 142 55 136',55,136],
  gvR:['M76 126Q92 128 100 118',101,117],
  upR:['M76 124Q94 116 95 94',95,91],
  thR:['M76 126Q93 128 93 108',93,106],
  opL:['M24 124Q4 124 -4 108',-5,105],opR:['M76 124Q96 124 104 108',105,105]};
function A(k,anim,extra){var p=P[k];return arm(p[0],p[1],p[2],anim,extra)}
var SHL=[24,126],SHR=[76,126];
function wave(sh,amp,dur,ph){return rot([-amp,amp,-amp],sh[0],sh[1],dur)}

/* ---------- варианты ---------- */
function ribbonChest(){return '<path d="M37 113H45L56 137 48 139Z" fill="'+BLUE+'" '+S(1.4)+'/><path d="M63 113H55L44 137 52 139Z" fill="#3d78bd" '+S(1.4)+'/>'+disc(50,143,GOLD,GOLD2)}
var V={
 win:[
  {id:'w-medal',face:'grin',ear:'up',hop:1,
   t:['Ты супер класс!','Идеально!','Блестяще!'],d:['10 из 10, ни одной ошибки. Кролик дарит тебе золотую медаль!','Ни одной ошибки. Кролик гордится тобой и вручает медаль.'],
   fxb:confetti(),chest:ribbonChest(),arms:A('chL',wave(SHL,5,.7))+A('chR',wave(SHR,5,.7)),fxf:spark(-22,44,1,0)+spark(122,40,1.1,.5)+spark(-8,86,.8,.9)},
  {id:'w-bouquet',face:'grin',ear:'up',
   t:['Ни одной ошибки!','Это успех!','Супер!'],d:['10 из 10! Кролик дарит тебе букет.','Все ответы верные. Держи цветы от кролика!'],
   chest:'<path d="M50 147L41 130M50 147V126M50 147L59 130" fill="none" '+S(2.4,GREEN)+'/><path d="M37 135H63L53 152H47Z" fill="#f2d6dc" '+S(1.8)+'/>',
   arms:A('hoL')+A('hoR'),
   post:flower(40,128,1,'#f09ab6')+flower(60,128,1,'#c9a3ee')+flower(50,123,1.15,'#fff4d6')+flower(33,137,.8,'#f2c14e')+flower(67,137,.8,'#f09ab6'),
   fxf:heart(-10,70,.9,'#e0566f','fl')+heart(112,60,1,'#f09ab6','fl" style="animation-delay:.8s')+heart(124,96,.7,'#e0566f','fl" style="animation-delay:1.5s')+spark(-24,30,1,0)+spark(120,26,.9,.6)},
  {id:'w-trophy',face:'grin',ear:'up',hop:1,
   t:['Чемпион ароматов!','Победа!','Ты лучший!'],d:['10 из 10, и ни одной ошибки. Кролик вручает кубок!','Безупречный раунд. Этот кубок твой!'],
   fxb:confetti(),
   pre:'<g transform="translate(95 52)"><path d="M-11 4Q-21 3-20 11Q-19 17-10 17M11 4Q21 3 20 11Q19 17 10 17" fill="none" '+S(2.2,GOLD2)+'/><path d="M-11 0H11V9Q11 20 0 22Q-11 20-11 9Z" fill="'+GOLD+'" '+S(2)+'/><rect x="-2.6" y="22" width="5.2" height="8" fill="'+GOLD2+'" '+S(1.6)+'/><rect x="-10" y="30" width="20" height="6" rx="2" fill="'+GOLD2+'" '+S(1.8)+'/><path d="M-6 4V12" '+S(2.4,'#fff')+' opacity=".7"/></g>',
   arms:A('chL',wave(SHL,6,.6))+A('upR'),fxf:spark(115,60,1,0)+spark(76,34,.9,.5)+spark(-20,50,1,.9)+spark(130,100,.8,.3)},
  {id:'w-clap',face:'grin',ear:'up',hop:1,
   t:['Браво!','Аплодисменты!','Безупречно!'],d:['10 из 10. Кролик хлопает в лапки!','Ни одной ошибки, и кролик в полном восторге.'],
   fxb:confetti(),arms:A('clL',mv([[0,0],[5,0],[0,0]],.36))+A('clR',mv([[0,0],[-5,0],[0,0]],.36)),
   post:'<g class="clp"><path d="M50 123V114M43 126L38 120M57 126L62 120" fill="none" '+S(2.2,GOLD2)+'/></g>',fxf:spark(-20,40,1,0)+spark(120,34,1.1,.4)+spark(-6,92,.8,.8)+spark(110,100,.8,.2)}
 ],
 high:[
  {id:'h-flower',face:'grin',ear:'up',
   t:['Почти идеально!','Отличная работа!'],d:['Совсем чуть-чуть до 10 из 10. Держи цветок!','Очень близко к идеалу. Кролик дарит цветок за старание.'],
   pre:'<path d="M101 119V92" fill="none" '+S(2.6,GREEN)+'/><path d="M101 108q9-2 11-9q-9 0-11 9z" fill="'+GREEN+'" '+S(1.2)+'/>'+flower(101,86,1.35,'#f09ab6',rot([-5,5,-5],0,23.7,2.2)),
   arms:A('dnL')+A('gvR'),fxf:spark(-14,46,1,0)+spark(124,60,.9,.6)+spark(-4,100,.8,1)},
  {id:'h-thumb',face:'wink',ear:'up',
   t:['Отличный результат!','Так держать!'],d:['Кролик одобряет. Ещё чуть-чуть, и будет 10 из 10.','Сильный раунд! Большой палец вверх от кролика.'],
   arms:A('dnL')+A('thR',rot([-3,3,-3],SHR[0],SHR[1],.8),'<rect x="89" y="88.5" width="8" height="17" rx="4" fill="'+FUR+'" '+S(1.8)+'/>'),
   fxf:spark(-16,56,1,0)+spark(116,70,1,.4)+spark(110,34,.8,.9)},
  {id:'h-medal',face:'smile',ear:'up',
   t:['Серебряный результат!','Очень достойно!'],d:['Почти идеально. Кролик вручает серебряную медаль.','Совсем чуть-чуть до золота. Держи медаль!'],
   pre:'<g><g>'+rot([-6,6,-6],101,118,2)+'<path d="M97 118H105L108 134H94Z" fill="'+BLUE+'" '+S(1.4)+'/>'+disc(101,142,'#dfe4ea','#8f98a6')+'</g></g>',
   arms:A('dnL')+A('gvR'),fxf:spark(-14,50,1,0)+spark(122,76,.9,.6)}
 ],
 mid:[
  {id:'m-carrot',face:'wink',ear:'up',
   t:['Хороший результат','Неплохо!'],d:['Держи морковку за старания. Ещё раунд, и будет лучше.','Кролик дарит морковку: ещё один раунд закрепит знания.'],
   pre:'<g transform="translate(101 117)"><g>'+rot([-5,5,-5],0,0,2)+'<path d="M0-6Q-9-18-5-26M0-6Q0-20 0-30M0-6Q9-18 5-26" fill="none" '+S(2.8,GREEN)+'/><path d="M-6.5-7Q0-12 6.5-7L0 24Z" fill="#f08a3c" '+S(1.8)+'/><path d="M-3 0H2M-2 8H3" '+S(1.4,'#c9631f')+'/></g></g>',
   arms:A('dnL')+A('gvR'),fxf:spark(-14,56,.9,0)+spark(122,52,.9,.7)},
  {id:'m-heart',face:'smile',ear:'up',
   t:['Ты на верном пути!','Кролик в тебя верит!'],d:['Ещё раунд закрепит знания.','Хороший результат. Ещё раунд, и будет ещё лучше.'],
   arms:A('hoL')+A('hoR'),post:heart(50,127,1.6,'#e0566f','',sc(['1','1.18','1'],1.1)),
   fxf:heart(-8,74,.7,'#f09ab6','fl')+heart(112,66,.8,'#f09ab6','fl" style="animation-delay:1.1s')},
  {id:'m-fist',face:'grin',ear:'up',
   t:['Давай ещё раунд!','Ты справишься!'],d:['Кролик болеет за тебя. Ещё раунд, и результат вырастет.','Уже хорошо, а дальше будет лучше. Вперёд!'],
   arms:A('dnL')+A('upR',rot([-3,3,-3],SHR[0],SHR[1],.6)),
   post:'<g class="clp"><path d="M104 76l5-5M108 92h8M104 108l5 5" fill="none" '+S(2.2,GOLD2)+'/></g>',fxf:spark(-14,56,.9,0)+spark(124,50,.9,.5)}
 ],
 low:[
  {id:'l-cloud',face:'sad2ok',ear:'s2',cls:'s2',
   t:['Бывает!','Не страшно!'],d:['Кролик немного расстроился, но верит в тебя. Повтори ароматы из списка ниже.','Сегодня не вышло, а завтра выйдет. Повтори ароматы ниже и попробуй ещё раз.'],
   fxb:'<g transform="translate(-30 16)"><g class="sunup"><g class="rays">'+[0,45,90,135,180,225,270,315].map(function(a){return '<path d="M0-19V-25" transform="rotate('+a+')" '+S(3,GOLD)+'/>'}).join('')+'</g><circle r="13" fill="'+GOLD+'" '+S(2,GOLD2)+'/></g></g>',
   arms:A('dnL')+A('dnR'),
   fxf:'<g transform="translate(50 11)"><g class="cloud"><path d="M-24 8a9 9 0 0 1 1-17 12 12 0 0 1 23-3 10 10 0 0 1 14 8 8 8 0 0 1-2 12z" fill="#c9d6e6" '+S(2)+'/>'
       +[-12,0,12].map(function(x,i){return '<path class="drop" style="animation-delay:'+(i*.27)+'s" d="M'+x+' 12v7" fill="none" '+S(2.4,'#5b92c7')+'/>'}).join('')+'</g></g>'},
  {id:'l-flower',face:'sad2ok',ear:'s2',cls:'s2',
   t:['Не расстраивайся','Всё получится!'],d:['Кролик дарит цветок. В следующий раз выйдет лучше.','Не вышло с первого раза, так бывает. Повтори ароматы ниже.'],
   pre:'<path d="M101 119V98" fill="none" '+S(2.6,GREEN)+'/>'+flower(101,92,1.1,'#f2c14e',rot([-5,5,-5],0,23.6,2.4)),
   arms:A('dnL')+A('gvR'),fxf:heart(-6,76,.7,'#f09ab6','fl" style="animation-delay:2s')+heart(116,58,.8,'#f09ab6','fl" style="animation-delay:2.8s')},
  {id:'l-tea',face:'sad2ok',ear:'s2',cls:'s2',
   t:['Выдохни','Не беда!'],d:['Чашка чая, и ещё один раунд. Всё получится!','Кролик заварил чай. Повтори ароматы ниже и попробуй снова.'],
   chest:'<g transform="translate(50 128)"><ellipse cy="16.5" rx="14" ry="3.2" fill="#fffdf9" '+S(1.8)+'/><path d="M9 3h3.6q4.4 0 4.4 4.2t-4.4 4.2H8.4" fill="none" '+S(1.8)+'/><path d="M-9 0H9V6.4Q9 15.6 0 15.6T-9 6.4Z" fill="#fffdf9" '+S(1.8)+'/><ellipse rx="9" ry="2" fill="#c98b55" '+S(1.4)+'/>'
      +[-4,2,7].map(function(x,i){return '<path class="steam" style="animation-delay:'+(i*.5)+'s" d="M'+x+' -5q-3-4 0-8t0-8" fill="none" '+S(1.8,'#b9b0a4')+'/>'}).join('')+'</g>',
   arms:A('hoL')+A('hoR')},
  {id:'l-hug',face:'sad2ok',ear:'s2',cls:'s2',
   t:['Иди сюда!','Всё хорошо!'],d:['Кролик обнимает. Повтори ароматы из списка и попробуй ещё раз.','Не вышло сегодня, выйдет в следующий раз. Кролик рядом!'],
   arms:A('opL',rot([-3,3,-3],SHL[0],SHL[1],1.4))+A('opR',rot([3,-3,3],SHR[0],SHR[1],1.4)),
   post:heart(50,128,1.5,'#e0566f','',sc(['1','1.16','1'],1.2)),fxf:heart(-12,70,.7,'#f09ab6','fl" style="animation-delay:2s')+heart(112,60,.7,'#f09ab6','fl" style="animation-delay:2.8s')}
 ]};

function pick(a){return a[Math.floor(Math.random()*a.length)]}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function art(p,er,n,force){
  var m=(er===0&&n>=10)?'win':p>=80?'high':p>=50?'mid':'low',list=V[m],v=null,last={};
  try{last=JSON.parse(localStorage.getItem('etib-rb'))||{}}catch(e){}
  if(force)v=list.filter(function(x){return x.id===force})[0];
  if(!v){var c=list.filter(function(x){return x.id!==last[m]});v=pick(c.length?c:list);last[m]=v.id;try{localStorage.setItem('etib-rb',JSON.stringify(last))}catch(e){}}
  var t=pick(v.t),d=pick(v.d),hop=v.hop&&!still?'<animateTransform attributeName="transform" type="translate" values="0 0;0 -11;0 0;0 -4;0 0" keyTimes="0;.3;.55;.75;1" dur=".95s" repeatCount="indefinite"/>':mv([[0,0],[0,-1.6],[0,0]],3);
  var svg='<svg class="rb '+m+' '+(v.cls||'')+'" viewBox="0 0 240 172" aria-hidden="true"><g transform="translate(70 12)">'+(v.fxb||'')
   +'<g class="rbw">'+hop+(v.pre||'')+body()+(v.chest||'')+head(v.face)+hat()+ears(v.ear)+(v.arms||'')+(v.post||'')+'</g>'+(v.fxf||'')+'</g></svg>';
  return '<div class="panel winpic rbp" role="img" aria-label="'+esc(t)+'">'+svg+'<h2>'+esc(t)+'</h2><p>'+esc(d)+'</p></div>'}
window.rabbitArt=art;window.rabbitVariants=V;
})();
