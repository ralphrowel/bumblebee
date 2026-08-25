gsap.registerPlugin(ScrollTrigger);

var introPlayed = false;

function playIntro() {
  if (introPlayed || !window.gsap) return;
  introPlayed = true;
  console.log('wordmark tween started');
  gsap.fromTo('.hero-wordmark',
    { scale: 0.8, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: 'back.out(1.7)',
      onComplete: function () { console.log('wordmark tween complete'); }
    }
  );
}

window.__playIntro = playIntro;

if (!document.getElementById('loading-screen')) {
  playIntro();
}

document.querySelectorAll('.header-nav a').forEach(function (link) {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    var target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

var heroSection = document.getElementById('hero');
var aboutSection = document.getElementById('about');

gsap.timeline({
  scrollTrigger: {
    trigger: '.scene-layer',
    start: 'top top',
    end: function () {
      return '+=' + ((heroSection.offsetHeight + aboutSection.offsetHeight) * 0.45);
    },
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: function (self) {
      window.__beeScrollProgress = self.progress;
    }
  }
})
.fromTo(['.hero-wordmark', '.hero-quote'], { opacity: 1 }, { opacity: 0, ease: 'none', duration: 0.4, immediateRender: false }, 0)
.fromTo('.about-content', { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.55, immediateRender: false }, 0.35);

gsap.timeline({
  scrollTrigger: {
    trigger: '#about',
    start: 'top 68%',
    once: true
  }
})
.fromTo('.about-heading', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', immediateRender: true }, 0)
.fromTo('.about-title', { opacity: 0, y: 28, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: 'back.out(1.45)', immediateRender: true }, 0.12)
.fromTo('.about-bio', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', immediateRender: true }, 0.28)
.fromTo('.rule-partial', { opacity: 0, scaleX: 0, transformOrigin: 'left center' }, { opacity: 1, scaleX: 1, duration: 0.5, ease: 'power2.out', immediateRender: true }, 0.38)
.fromTo('.skill-badges .badge', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.42, ease: 'power3.out', stagger: 0.04, immediateRender: true }, 0.46)
.fromTo('.cert-img', { opacity: 0, y: 24, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.2)', stagger: 0.1, immediateRender: true }, 0.7)
.fromTo('.about-photo', { opacity: 0, x: 42 }, { opacity: 1, x: 0, duration: 0.75, ease: 'power3.out', immediateRender: true }, 0.2)
.fromTo('.part2-photo', { y: 24, scale: 0.94 }, { y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.15)', immediateRender: true }, 0.2);

gsap.fromTo('.about-title',
  { opacity: 1, scale: 1 },
  {
    opacity: 0,
    scale: 0.9,
    ease: 'none',
    immediateRender: false,
    scrollTrigger: {
      trigger: '#about',
      start: 'top -20%',
      end: 'top -90%',
      scrub: true
    }
  }
);

var certLightbox = document.getElementById('cert-lightbox');
var lightboxImg = document.getElementById('lightbox-img');

function openLightbox(src, alt) {
  if (!certLightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  certLightbox.classList.add('is-open');
  certLightbox.setAttribute('aria-hidden', 'false');
  if (window.gsap) {
    gsap.fromTo(lightboxImg, { scale: 0.88, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' });
  }
}

function closeLightbox() {
  if (!certLightbox || !certLightbox.classList.contains('is-open')) return;
  if (window.gsap) {
    gsap.to(lightboxImg, {
      scale: 0.94,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: function () {
        certLightbox.classList.remove('is-open');
        certLightbox.setAttribute('aria-hidden', 'true');
        lightboxImg.src = '';
      }
    });
  } else {
    certLightbox.classList.remove('is-open');
    certLightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
  }
}

document.querySelectorAll('.cert-img').forEach(function (img) {
  img.addEventListener('click', function () {
    openLightbox(this.src, this.alt);
  });
});

var lightboxCloseBtn = document.getElementById('lightbox-close');
if (lightboxCloseBtn) {
  lightboxCloseBtn.addEventListener('click', closeLightbox);
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeLightbox();
});
