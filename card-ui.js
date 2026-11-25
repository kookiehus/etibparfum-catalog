/* Карточка аромата в стиле «Новинки»: открывается по нажатию на фото или на кнопку «Карточка аромата». Данные — cards.js (window.CARDS). */
(function(){
  const C=window.CARDS||{},e=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const PL={top:'Верхние',heart:'Средние',base:'Базовые',all:'Ноты'};
  window.cardOf=d=>C[d.category+'|'+d.number];
  window.isNew=d=>{const c=cardOf(d);return !!(c&&c.new)};
  window.openCard=k=>{
    const c=C[k],d=DATA.find(x=>x.category+'|'+x.number===k);if(!c||!d)return;
    const ph=[0,1,2].map(i=>c.ph[i]?`<img src="${e(c.ph[i])}" alt="" loading="lazy" onerror="this.replaceWith(document.createElement('i'))">`:'<i></i>').join('');
    const pyr=(c.pyr||[]).map(([t,v])=>`<p><b>${PL[t]||e(t)}:</b> ${e(v)}</p>`).join('');
    const tip=window.TIPS&&TIPS[k];
    $('dCard').className='c-'+(c.col||'green');
    $('dCard').innerHTML=`<div class="nc">
<div class="nc-top"><div class="nc-ph">${ph}</div><h2>${e(d.nm)}</h2>${c.new?'<span class="nc-new">Новинка</span>':''}<button class="x" type="button" data-close aria-label="Закрыть" autofocus>×</button></div>
<div class="nc-mid">${c.bt?`<img class="nc-bt" src="${e(c.bt)}" alt="" onerror="this.remove()">`:''}<p class="nc-no">${e(d.number)}</p><span></span>
<div class="nc-info"><p><b>Направление:</b> ${e(c.dir)}</p>${c.brand?`<p><b>Производитель:</b> ${e(c.brand)}</p>`:''}<p><b>Пол:</b> ${e(c.sex)}</p></div>
${pyr?`<div class="nc-pyr">${pyr}</div>`:''}</div>
<div class="nc-box"><div class="nc-two"><div><h3>Кому подойдёт</h3><p><b>Сезон:</b> ${e(c.season)}</p><p><b>Случай:</b> ${e(c.occ)}</p>${c.style?`<p><b>Стиль:</b> ${e(c.style)}</p>`:''}</div>
<div><h3>Как звучит</h3><p>${e(c.sound)}</p></div></div>
${c.mkt?`<div class="nc-mk"><h3>Маркетинговое описание</h3><p>${e(c.mkt)}</p></div>`:''}</div>
${c.ok||!(typeof admin!=='undefined'&&admin)?'':'<p class="nc-dr">Черновик: текст составлен по нотам, проверьте перед использованием.</p>'}
<div class="nc-act">${tip?`<button class="btn" type="button" data-ctip="${e(k)}">Как продать</button>`:''}<button class="btn sec" type="button" data-close>Закрыть</button></div></div>`;
    $('dCard').showModal();$('dCard').querySelector('.nc').scrollTop=0};
  /* «Новинки» — отдельная кнопка рядом с «Закладками» */
  const nn=Object.values(C).filter(x=>x.new).length,nt=document.createElement('button');
  nt.type='button';nt.className='favtog newtog';window.onlyNew=false;
  const sync=()=>{nt.innerHTML=`<span>${window.onlyNew?'Показать все ароматы':'Новинки'}</span><b>${nn}</b>`;nt.setAttribute('aria-pressed',window.onlyNew)};
  nt.onclick=()=>{window.onlyNew=!window.onlyNew;sync();render()};sync();
  const at=document.getElementById('notes');if(at&&nn)at.insertAdjacentElement('afterend',nt);
  document.addEventListener('click',ev=>{
    const t=ev.target;
    const ob=t.closest&&t.closest('[data-card]');if(ob){ev.preventDefault();ev.stopPropagation();openCard(ob.dataset.card);return}
    const tb=t.closest&&t.closest('[data-ctip]');if(tb){$('dCard').close();openTip(tb.dataset.ctip);return}
    const bt=t.closest&&t.closest('.nc-bt');if(bt){$('zImg').src=bt.src;$('dZoom').showModal();return}
    if(t.closest&&t.closest('#dCard [data-close]'))$('dCard').close();
    if(t.id==='dCard')$('dCard').close()},true);
})();
