/* =============================================================
   main.js — Bumblebee Portfolio
   Handles: loading → centered wordmark → START
   ============================================================= */

/* ─── Intro: BUMBLEBEE wordmark fade-in ─────────────────────── */
var introPlayed = false;
var lightboxReturnFocus = null;
var reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

function playIntro() {
  if (introPlayed || !window.gsap) return;
  introPlayed = true;

  gsap.fromTo('.hero-wordmark',
    { scale: 0.85, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: reducedMotion.matches ? 0 : 0.9,
      ease: 'back.out(1.7)',
      onComplete: function () {
        var startBtn = document.getElementById('start-btn');
        startBtn.classList.add('is-visible');
        gsap.to(startBtn, { opacity: 1, duration: reducedMotion.matches ? 0 : 0.4 });
      }
    }
  );
}

window.__playIntro = playIntro;

if (!document.getElementById('loading-screen')) {
  playIntro();
}

/* ─── Cert lightbox ─────────────────────────────────────────── */
var certLightbox  = document.getElementById('cert-lightbox');
var lightboxImg   = document.getElementById('lightbox-img');

function openLightbox(src, alt) {
  if (!certLightbox || !lightboxImg) return;
  lightboxReturnFocus = document.activeElement;
  document.getElementById('section-panel').inert = true;
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  certLightbox.classList.add('is-open');
  certLightbox.setAttribute('aria-hidden', 'false');
  document.getElementById('lightbox-close').focus();
  document.body.style.overflow = 'hidden';
  if (window.gsap) {
    gsap.fromTo(lightboxImg,
      { scale: 0.88, opacity: 0 },
      { scale: 1, opacity: 1, duration: reducedMotion.matches ? 0 : 0.35, ease: 'power3.out' }
    );
  }
}

function closeLightbox() {
  if (!certLightbox || !certLightbox.classList.contains('is-open')) return;
  document.body.style.overflow = '';
  document.getElementById('section-panel').inert = false;
  if (lightboxReturnFocus) lightboxReturnFocus.focus();
  if (window.gsap) {
    gsap.to(lightboxImg, {
      scale: 0.94,
      opacity: 0,
      duration: reducedMotion.matches ? 0 : 0.25,
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

// Expose globally so hex-menu.js panel can wire up cert buttons
window.openLightbox  = openLightbox;
window.closeLightbox = closeLightbox;

var lightboxCloseBtn = document.getElementById('lightbox-close');
if (lightboxCloseBtn) {
  lightboxCloseBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    closeLightbox();
  });
}

var lightboxDialog = certLightbox && certLightbox.querySelector('.lightbox-dialog');
if (lightboxDialog) {
  lightboxDialog.addEventListener('click', function (e) { e.stopPropagation(); });
}

if (certLightbox) {
  certLightbox.addEventListener('click', closeLightbox);
}

document.addEventListener('keydown', function (e) {
  if (!certLightbox || !certLightbox.classList.contains('is-open')) return;
  if (e.key === 'Escape') { e.stopImmediatePropagation(); closeLightbox(); }
  if (e.key === 'Tab') { e.preventDefault(); lightboxCloseBtn.focus(); }
});
