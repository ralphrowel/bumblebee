gsap.registerPlugin(ScrollTrigger);

console.log('wordmark tween started');
gsap.fromTo('.hero-wordmark',
  { opacity: 0 },
  {
    opacity: 1, duration: 1, ease: 'power3.out',
    onComplete: function () { console.log('wordmark tween complete'); }
  }
);

document.querySelectorAll('.header-nav a').forEach(function (link) {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    var target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
