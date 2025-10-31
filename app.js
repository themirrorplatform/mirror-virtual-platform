// SPA routing + panel slider with edge hover and touch swipe
(function(){
  const routes = document.querySelectorAll('.route');
  const panelsWrap = document.getElementById('panels');
  const panels = document.querySelectorAll('.panel');
  const dots = document.getElementById('dots');
  const left = document.getElementById('edgeLeft');
  const right = document.getElementById('edgeRight');
  let index = 0;
  let hoverTimer = null;
  let touchStartX = null;

  // build dots
  panels.forEach((_, i)=>{
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Go to panel '+(i+1));
    b.addEventListener('click', ()=> goTo(i));
    dots.appendChild(b);
  });

  function updateDots(){
    Array.from(dots.children).forEach((d,i)=>{
      d.classList.toggle('active', i===index);
    });
  }

  function goTo(i){
    index = Math.max(0, Math.min(panels.length-1, i));
    panelsWrap.scrollTo({left: index * panelsWrap.clientWidth, behavior:'smooth'});
    updateDots();
  }

  function next(){ goTo(index+1); }
  function prev(){ goTo(index-1); }

  // edge hover logic (moves after a short hover delay to avoid accidental jumps)
  function scheduleMove(fn){
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(fn, 500);
  }
  left.addEventListener('mouseenter', ()=> scheduleMove(prev));
  right.addEventListener('mouseenter', ()=> scheduleMove(next));
  left.addEventListener('mouseleave', ()=> clearTimeout(hoverTimer));
  right.addEventListener('mouseleave', ()=> clearTimeout(hoverTimer));

  // swipe (mobile)
  panelsWrap.addEventListener('touchstart', (e)=>{
    touchStartX = e.changedTouches[0].clientX;
  }, {passive:true});
  panelsWrap.addEventListener('touchend', (e)=>{
    if(touchStartX==null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if(Math.abs(dx) > 50){
      if(dx < 0) next(); else prev();
    }
    touchStartX = null;
  }, {passive:true});

  // respond to resize to keep alignment
  window.addEventListener('resize', ()=> goTo(index));

  // SPA hash routing
  function setRoute(){
    const hash = (location.hash || '#home').replace('#','');
    routes.forEach(r=>r.classList.remove('active'));
    const active = document.getElementById(hash);
    if(active){ active.classList.add('active'); }
    // when returning home, make sure panels align
    if(hash === 'home'){ goTo(index); }
    // scroll to top for non-home sections
    if(hash !== 'home'){ window.scrollTo({top:0, behavior:'smooth'}); }
  }
  window.addEventListener('hashchange', setRoute);
  setRoute();
  updateDots();
})();
