document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.s2i-kh-header');
  if (!header) return;

  const menuToggle = header.querySelector('[data-s2i-menu-toggle]');
  const mobileMenu = header.querySelector('[data-s2i-mobile]');
  const langToggle = header.querySelector('[data-s2i-lang-toggle]');
  const langMenu = header.querySelector('[data-s2i-lang-menu]');
  const desktopBreakpoint = window.matchMedia('(min-width: 1025px)');

  const closeMobileMenu = () => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.hidden = true;
    mobileMenu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  const openMobileMenu = () => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.hidden = false;
    mobileMenu.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
  };

  const closeLangMenu = () => {
    if (!langMenu || !langToggle) return;
    langMenu.hidden = true;
    langToggle.setAttribute('aria-expanded', 'false');
  };

  const openLangMenu = () => {
    if (!langMenu || !langToggle) return;
    langMenu.hidden = false;
    langToggle.setAttribute('aria-expanded', 'true');
  };

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  if (langToggle && langMenu) {
    langToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = langToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeLangMenu();
      } else {
        openLangMenu();
      }
    });
  }

  document.addEventListener('click', (event) => {
    if (langMenu && langToggle && !header.contains(event.target)) {
      closeLangMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLangMenu();
      closeMobileMenu();
    }
  });

  const handleDesktopChange = (event) => {
    if (event.matches) {
      closeMobileMenu();
    }
  };

  if (desktopBreakpoint.addEventListener) {
    desktopBreakpoint.addEventListener('change', handleDesktopChange);
  } else if (desktopBreakpoint.addListener) {
    desktopBreakpoint.addListener(handleDesktopChange);
  }

  closeLangMenu();
  closeMobileMenu();
});
