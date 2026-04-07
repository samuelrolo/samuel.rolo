/**
 * header-scroll.js — Toggles .navbar-scrolled on the navbar when
 * the user scrolls past 50px. This hides the logo and language toggle
 * on mobile, leaving only the hamburger menu.
 */
(function () {
  var nav = document.querySelector('.navbar');
  if (!nav) return;
  var THRESHOLD = 50;
  var last = false;
  function onScroll() {
    var scrolled = window.scrollY > THRESHOLD;
    if (scrolled !== last) {
      nav.classList.toggle('navbar-scrolled', scrolled);
      last = scrolled;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load in case page is already scrolled
})();
