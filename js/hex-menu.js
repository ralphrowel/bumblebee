/* Hive navigation: one transition at a time, with scroll-aware reveals. */
(function () {
  'use strict';
  const hero = document.getElementById('hero');
  const menu = document.getElementById('hex-menu');
  const panel = document.getElementById('section-panel');
  const content = document.getElementById('panel-content');
  const back = document.getElementById('panel-back-btn');
  const home = document.getElementById('home-btn');
  const enter = document.getElementById('start-btn');
  const cells = Array.from(menu.querySelectorAll('.hex-node'));
  const links = Array.from(menu.querySelectorAll('.hex-ring'));
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let state = 'hero', busy = false, active = null, observer;
  const duration = value => motion.matches ? 0 : value;
  function visible(el, show) {
    el.inert = !show;
    el.setAttribute('aria-hidden', String(!show));
  }
  function bloom(focus) {
    visible(menu, true);
    menu.classList.add('is-visible');
    const tl = gsap.timeline({ onComplete() { busy = false; (focus || links[0]).focus(); } });
    tl.fromTo(cells, { opacity:0, scale:motion.matches ? 1 : .72 }, { opacity:1, scale:1, duration:duration(.55), stagger:motion.matches ? 0 : .045, ease:'back.out(1.5)' });
    tl.fromTo(menu.querySelector('.menu-heading'), { opacity:0, y:motion.matches ? 0 : 12 }, { opacity:1, y:0, duration:duration(.35) }, 0);
  }
  function toMenu() {
    if (busy || state !== 'hero') return;
    busy = true; state = 'menu'; visible(hero, false);
    home.classList.add('is-visible'); home.inert = false;
    gsap.to(hero, { opacity:0, duration:duration(.35), onComplete() { bloom(); } });
    gsap.to('#bee-stage', { opacity:.18, duration:duration(.6) });
  }
  function toHome() {
    if (busy) return;
    if (state === 'panel') { closePanel(true); return; }
    if (state !== 'menu') return;
    busy = true; state = 'hero'; visible(menu, false);
    gsap.to(cells, { opacity:0, scale:motion.matches ? 1 : .8, duration:duration(.25), onComplete() {
      menu.classList.remove('is-visible'); visible(hero, true);
      gsap.to(hero, { opacity:1, duration:duration(.45), onComplete() { busy=false; enter.focus(); } });
    } });
    gsap.to('#bee-stage', { opacity:1, duration:duration(.5) });
    home.classList.remove('is-visible'); home.inert = true;
  }
  function revealSection() {
    if (observer) observer.disconnect();
    const elements = content.querySelectorAll('.hive-eyebrow, .panel-title, .section-deck, .panel-bio, .panel-photo-wrap, .panel-certs, .skill-category, .panel-exp-card, .panel-project-card, .panel-pub-card, .panel-contact-intro, .panel-contact-item, .section-next');
    if (motion.matches || !('IntersectionObserver' in window)) return;
    elements.forEach(el => el.classList.add('reveal-ready'));
    observer = new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach((entry, index) => {
        entry.target.style.setProperty('--reveal-delay', Math.min(index * 65, 260) + 'ms');
        entry.target.classList.add('revealed'); observer.unobserve(entry.target);
      });
    }, { root:content, threshold:.08 });
    elements.forEach(el => observer.observe(el));
  }
  function loadSection(hex) {
    const id = hex.dataset.section;
    content.replaceChildren(document.getElementById('tpl-' + id).content.cloneNode(true));
    content.scrollTop = 0;
    panel.dataset.section = id;
    panel.setAttribute('aria-label', hex.getAttribute('aria-label'));
    content.querySelectorAll('.panel-cert-btn').forEach(btn => {
      btn.setAttribute('aria-label', 'Preview ' + btn.querySelector('img').alt);
      btn.addEventListener('click', () => { const img=btn.querySelector('img'); window.openLightbox(img.src,img.alt); });
    });
    content.querySelectorAll('.skill-badges-panel .badge').forEach((el,i) => el.style.setProperty('--cell-delay', (i % 6) * 60 + 'ms'));
    const next = links[(links.indexOf(hex) + 1) % links.length];
    const footer = document.createElement('button');
    footer.type='button'; footer.className='section-next';
    footer.innerHTML='<span><small>CONTINUE EXPLORING</small>' + next.getAttribute('aria-label') + '</span><span aria-hidden="true">↗</span>';
    footer.addEventListener('click', () => switchSection(next));
    content.querySelector('.panel-section').appendChild(footer);
  }
  function openPanel(hex) {
    if (busy || state !== 'menu') return;
    busy=true; state='panel'; active=hex;
    const rect=hex.getBoundingClientRect();
    const origin=((rect.left+rect.width/2)/innerWidth*100)+'% '+((rect.top+rect.height/2)/innerHeight*100)+'%';
    loadSection(hex); visible(menu,false); visible(panel,true);
    panel.classList.add('is-open'); content.classList.add('is-visible'); back.classList.add('is-visible');
    gsap.set(content,{opacity:1}); gsap.set(back,{opacity:1}); revealSection();
    gsap.fromTo(panel,{opacity:1,clipPath:motion.matches?'none':'circle(0% at '+origin+')'}, {clipPath:motion.matches?'none':'circle(150% at '+origin+')',duration:duration(.6),ease:'power3.inOut',onComplete() {
      menu.classList.remove('is-visible'); busy=false; back.focus();
    }});
    gsap.to('#bee-stage',{opacity:.04,duration:duration(.4)});
  }
  function switchSection(hex) {
    if(busy) return; busy=true;
    if(observer) observer.disconnect();
    gsap.to(content,{opacity:0,duration:duration(.18),onComplete() {
      active=hex; loadSection(hex); gsap.set(content,{opacity:1}); revealSection(); busy=false; back.focus();
    }});
  }
  function closePanel(goHome=false) {
    if(busy || state !== 'panel') return;
    busy=true; if(observer) observer.disconnect(); visible(panel,false);
    gsap.to(panel,{opacity:0,duration:duration(.3),onComplete() {
      panel.classList.remove('is-open'); content.replaceChildren(); state='menu';
      if(goHome) { busy=false; toHome(); } else { bloom(active); }
    }});
    gsap.to('#bee-stage',{opacity:.18,duration:duration(.4)});
  }
  enter.addEventListener('click',toMenu); home.addEventListener('click',toHome);
  back.addEventListener('click',()=>closePanel());
  links.forEach(hex=>hex.addEventListener('click',()=>openPanel(hex)));
  document.addEventListener('keydown',e=>{
    if(document.getElementById('cert-lightbox').classList.contains('is-open')) return;
    if(e.key==='Escape') { if(state==='panel') closePanel(); else toHome(); }
    if(e.key==='Tab' && state==='panel') {
      const items=Array.from(panel.querySelectorAll('button,a[href]'));
      if(e.shiftKey && document.activeElement===items[0]) { e.preventDefault(); items[items.length-1].focus(); }
      else if(!e.shiftKey && document.activeElement===items[items.length-1]) { e.preventDefault(); items[0].focus(); }
    }
  });
  motion.addEventListener('change',()=>{ if(motion.matches && observer) { observer.disconnect(); content.querySelectorAll('.reveal-ready').forEach(el=>el.classList.add('revealed')); } });
  visible(menu,false); visible(panel,false); home.inert=true;
  window.closePanel=closePanel; window.collapseHexMenu=toHome;
})();
