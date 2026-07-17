let floatItems = [];

document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initMobileMenu();
  initScrollHeader();
  initScrollAnimations();
  initActiveNavLink();
  initVideoModal();
  initCategoryFilters();
  initScrollProgress();
  initFAQAccordion();
  initHero3DFloat();
  initCard3DTilt();
  initPageEntry3D();
  initScrollParallax();
  initPetals();
  initMuseumDecorations();
  if (window.initCarousel) window.initCarousel();

  // Load premium 3D living art studio environment dynamically on all pages
  const artScript = document.createElement('script');
  artScript.src = 'js/art-studio.js';
  document.body.appendChild(artScript);
});

/* ==========================================
   PERSISTENT LANGUAGE SYSTEM
   ========================================== */
function initLanguage() {
  const langToggles = document.querySelectorAll('.lang-toggle');
  
  // Set initial language from local storage or default to English
  const savedLang = localStorage.getItem('antigravity_lang') || 'en';
  setLanguage(savedLang);

  langToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const currentLang = localStorage.getItem('antigravity_lang') || 'en';
      const newLang = currentLang === 'en' ? 'ar' : 'en';
      setLanguage(newLang);
    });
  });
}

function setLanguage(lang) {
  localStorage.setItem('antigravity_lang', lang);
  
  const body = document.body;
  const html = document.documentElement;

  if (lang === 'ar') {
    body.classList.add('rtl');
    html.setAttribute('dir', 'rtl');
    html.setAttribute('lang', 'ar');
  } else {
    body.classList.remove('rtl');
    html.setAttribute('dir', 'ltr');
    html.setAttribute('lang', 'en');
  }
}

/* ==========================================
   MOBILE HAMBURGER MENU
   ========================================== */
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!hamburger || !navMenu) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close menu when link clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
    }
  });
}

/* ==========================================
   HEADER SCROLL EFFECT
   ========================================== */
function initScrollHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  const checkScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  };

  window.addEventListener('scroll', checkScroll);
  checkScroll(); // Run once in case page loaded scrolled
}

/* ==========================================
   SCROLL FADE-UP ANIMATIONS (Intersection Observer)
   ========================================== */
function initScrollAnimations() {
  // Only observe elements that haven't been manually made visible in HTML
  const animatedElements = document.querySelectorAll('.fade-up:not(.visible)');
  
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -20px 0px',
      threshold: 0.05
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add a small requestAnimationFrame delay to ensure paint happens before transition
          requestAnimationFrame(() => {
            entry.target.classList.add('visible');
          });
          observer.unobserve(entry.target); // Stop observing once animated
        }
      });
    }, observerOptions);

    animatedElements.forEach(el => {
      // If already in viewport on load, animate immediately without waiting for scroll
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('visible');
      } else {
        observer.observe(el);
      }
    });
  } else {
    // Fallback if browser doesn't support IntersectionObserver
    animatedElements.forEach(el => el.classList.add('visible'));
  }
}

/* ==========================================
   ACTIVE NAV LINK HIGHLIGHT
   ========================================== */
function initActiveNavLink() {
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPath = window.location.pathname;
  
  // Get filename (e.g. index.html) from path
  const filename = currentPath.substring(currentPath.lastIndexOf('/') + 1);

  navLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    
    // Check if filename matches link href, or defaults to index.html if blank/root
    if (linkHref === filename || (filename === '' && linkHref === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* ==========================================
   VIDEO TEASER MODAL POPUP
   ========================================== */
function initVideoModal() {
  const modal = document.querySelector('.modal');
  const openButtons = document.querySelectorAll('.open-teaser');
  const closeButton = document.querySelector('.modal-close');
  const overlay = document.querySelector('.modal-overlay');
  const iframe = document.querySelector('.modal-body iframe');

  if (!modal || !closeButton || !overlay || !iframe) return;

  const openModal = (videoUrl) => {
    // Use Vimeo / YouTube embed structure
    iframe.src = videoUrl;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Disable scroll
  };

  const closeModal = () => {
    modal.classList.remove('active');
    iframe.src = '';
    document.body.style.overflow = ''; // Restore scroll
  };

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Default fallback demo teaser: a cool design showcase video
      const videoUrl = btn.getAttribute('data-video-url') || 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';
      openModal(videoUrl);
    });
  });

  closeButton.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  // Close on ESC key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* ==========================================
   CATEGORY FILTERS FOR PLANS
   ========================================== */
function initCategoryFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const courseCards = document.querySelectorAll('.course-card');

  if (!filterBtns.length || !courseCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      courseCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = '';
          // Force a slight delay to trigger entry transition if desired
          setTimeout(() => {
            card.classList.add('visible');
          }, 50);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================
   SCROLL PROGRESS BAR
   ========================================== */
function initScrollProgress() {
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress-bar';
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = scrollPercent + '%';
  });
}

/* ==========================================
   FAQ ACCORDION TOGGLE
   ========================================== */
function initFAQAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const panel = item.querySelector('.faq-panel');
    
    if (!trigger || !panel) return;
    
    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all other open items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherPanel = otherItem.querySelector('.faq-panel');
          if (otherPanel) otherPanel.style.maxHeight = null;
        }
      });
      
      // Toggle current item
      if (isActive) {
        item.classList.remove('active');
        panel.style.maxHeight = null;
      } else {
        item.classList.add('active');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

/* ==========================================================================
   3D ANIMATIONS & INTERACTIONS
   ========================================================================== */

/* Shared 3D Floating Animation Loop */
let isFloatVisible = true;
function floatLoop() {
  if (isFloatVisible) {
    const time = Date.now();
    floatItems.forEach(item => {
      const x = Math.sin(time * item.speedX + item.offsetX) * item.amplitudeX;
      const y = Math.cos(time * item.speedY + item.offsetY) * item.amplitudeY;
      const rotX = Math.sin(time * 0.0005 + item.offsetR) * item.ampRotX;
      const rotY = Math.cos(time * 0.0004 + item.offsetR) * item.ampRotY;
      const rotZ = (time * item.speedRotZ + item.offsetRotZ) % 360;
      item.el.style.transform = `translate3d(${x}px, ${y}px, ${item.baseZ}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
    });
  }
  requestAnimationFrame(floatLoop);
}

// Pause floating when scrolled away
window.addEventListener('scroll', () => {
  isFloatVisible = window.scrollY < window.innerHeight + 200;
}, { passive: true });

/* ANIMATION A — 3D Floating Art Tools on Hero Section */
function initHero3DFloat() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  
  const shapes = ['palette-knife', 'paint-blob', 'texture-stamp', 'sparkle'];
  for (let i = 0; i < 8; i++) {
    const shapeType = shapes[i % shapes.length];
    const el = document.createElement('div');
    el.className = 'float-tool-element';
    
    const size = Math.floor(Math.random() * 30) + 20; // 20px to 50px
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = (Math.random() * 80 + 10) + '%';
    el.style.top = (Math.random() * 80 + 10) + '%';
    
    if (shapeType === 'palette-knife') {
      el.style.width = Math.floor(size / 3) + 'px';
      el.style.height = size + 'px';
      el.style.background = 'var(--gradient-primary)';
      el.style.opacity = '0.2';
      el.style.borderRadius = '4px';
    } else if (shapeType === 'paint-blob') {
      el.style.background = 'var(--accent-blue)';
      el.style.opacity = '0.2';
      el.style.borderRadius = '40% 60% 70% 30% / 40% 50% 60% 50%';
    } else if (shapeType === 'texture-stamp') {
      el.style.border = '2px dotted var(--accent-purple)';
      el.style.opacity = '0.25';
      el.style.borderRadius = '4px';
    } else if (shapeType === 'sparkle') {
      el.style.background = '#E8C97E';
      el.style.opacity = '0.25';
      el.style.clipPath = 'polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%)';
    }
    
    hero.appendChild(el);
    
    floatItems.push({
      el: el,
      speedX: (Math.random() * 0.0004) + 0.0002,
      speedY: (Math.random() * 0.0004) + 0.0002,
      speedRotZ: (Math.random() * 0.05) + 0.02,
      offsetX: Math.random() * Math.PI * 2,
      offsetY: Math.random() * Math.PI * 2,
      offsetR: Math.random() * Math.PI * 2,
      offsetRotZ: Math.random() * 360,
      amplitudeX: (Math.random() * 20) + 10,
      amplitudeY: (Math.random() * 20) + 10,
      ampRotX: (Math.random() * 15) + 5,
      ampRotY: (Math.random() * 15) + 5,
      baseZ: Math.floor(Math.random() * 40) - 20
    });
  }
  
  if (!window.isFloatLoopRunning) {
    window.isFloatLoopRunning = true;
    requestAnimationFrame(floatLoop);
  }
}

/* ANIMATION B — 3D Card Tilt on .glass-card (mouse parallax) */
function initCard3DTilt() {
  // Disable on mobile/touch devices for performance and UX
  if (window.innerWidth < 768 || ('ontouchstart' in window)) return;
  
  // Don't apply to carousel cards or nested elements
  const cards = document.querySelectorAll('.glass-card:not(.artwork-carousel-card .glass-card)');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cardWidth = rect.width;
      const cardHeight = rect.height;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const xPercent = (mouseX / cardWidth) * 2 - 1;
      const yPercent = (mouseY / cardHeight) * 2 - 1;
      
      const tiltX = -(yPercent * 8).toFixed(2);
      const tiltY = (xPercent * 8).toFixed(2);
      
      card.style.transition = 'transform 0.1s ease';
      card.style.transform = `translateY(-5px) perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.6s ease';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    });
  });
}

/* ANIMATION D — 3D Page Entry Animation */
function initPageEntry3D() {
  const cards = document.querySelectorAll('.glass-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.animation = `card-enter-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s forwards`;
    
    card.addEventListener('animationend', function handler() {
      card.style.opacity = '1';
      card.style.animation = '';
      card.removeEventListener('animationend', handler);
    });
  });
}

/* ANIMATION E — 3D Scroll Parallax Layers */
function initScrollParallax() {
  const purpleGlows = document.querySelectorAll('.bg-glow-purple');
  const blueGlows = document.querySelectorAll('.bg-glow-blue');
  
  purpleGlows.forEach(el => el.style.willChange = 'transform');
  blueGlows.forEach(el => el.style.willChange = 'transform');
  
  let ticked = false;
  
  window.addEventListener('scroll', () => {
    if (!ticked) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        // Only run parallax if near top for performance
        if (scrollY < window.innerHeight * 1.5) {
          purpleGlows.forEach(el => {
            el.style.transform = `translateY(${scrollY * 0.3}px) translateZ(0)`;
          });
          blueGlows.forEach(el => {
            el.style.transform = `translateY(${scrollY * -0.2}px) translateZ(0)`;
          });
        }
        ticked = false;
      });
      ticked = true;
    }
  }, { passive: true });
}

/* ANIMATION F — Floating Rose Petals (Creamy theme version) */
function initPetals() {
  const colors = ['rgba(212, 165, 165, 0.25)', 'rgba(201, 116, 143, 0.2)'];
  for (let i = 0; i < 10; i++) {
    const petal = document.createElement('div');
    petal.className = 'creamy-petal';
    const size = Math.floor(Math.random() * 12) + 8; // 8px to 20px
    petal.style.width = size + 'px';
    petal.style.height = size + 'px';
    petal.style.left = (Math.random() * 100) + 'vw';
    petal.style.top = '-30px';
    
    const color = colors[i % colors.length];
    petal.innerHTML = `
      <svg viewBox="0 0 30 30" width="100%" height="100%">
        <path d="M15 3 C20 10 27 18 27 22 A12 12 0 0 1 3 22 C3 18 10 10 15 3 Z" fill="${color}"/>
      </svg>
    `;
    
    petal.style.animationDuration = (Math.random() * 12 + 10) + 's';
    petal.style.animationDelay = (Math.random() * 15) + 's';
    
    document.body.appendChild(petal);
  }
}

/* ==========================================================================
   TASK 3 — MUSEUM HERO DECORATIONS
   ========================================================================== */

function initMuseumDecorations() {
  const hero = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-content');
  if (!hero) return;
  
  buildOrnateFrames(hero);
  buildBackgroundSVG(hero);
  if (heroContent) buildNameplate(heroContent);
  buildWatermarkWords(hero);
  initMuseumParticles(hero);
  buildWaveDivider(hero);
}

function buildOrnateFrames(hero) {
  const frameContent = `
    <rect x="10" y="10" width="180" height="380" stroke="#C9748F" stroke-width="1.5" fill="none" opacity="0.25"/>
    <rect x="15" y="15" width="170" height="370" stroke="#C9748F" stroke-width="1.5" fill="none" opacity="0.25"/>
    
    <!-- Top & Bottom Dots -->
    <line x1="30" y1="20" x2="170" y2="20" stroke="#C9748F" stroke-width="2" stroke-dasharray="1,8" stroke-linecap="round" opacity="0.25"/>
    <line x1="30" y1="380" x2="170" y2="380" stroke="#C9748F" stroke-width="2" stroke-dasharray="1,8" stroke-linecap="round" opacity="0.25"/>
    
    <!-- Side Center Diamond Flourish -->
    <g transform="translate(100, 200)">
      <path d="M0,-15 L15,0 L0,15 L-15,0 Z" stroke="#C9748F" stroke-width="1.5" fill="none" opacity="0.25"/>
      <line x1="0" y1="-25" x2="0" y2="25" stroke="#C9748F" stroke-width="1" opacity="0.2"/>
      <line x1="-25" y1="0" x2="25" y2="0" stroke="#C9748F" stroke-width="1" opacity="0.2"/>
    </g>

    <!-- Corner Flourishes -->
    <!-- Top Left -->
    <g transform="translate(25, 25)">
      <path d="M0,0 Q15,-15 30,0 Q15,15 0,30 Q-15,15 0,0" stroke="#C9748F" fill="none" stroke-width="1.5" opacity="0.3"/>
      <circle cx="0" cy="0" r="3" fill="#C9748F" opacity="0.3"/>
      <line x1="0" y1="30" x2="0" y2="60" stroke="#C9748F" stroke-width="1" opacity="0.2" stroke-dasharray="3,4"/>
    </g>
    <!-- Top Right -->
    <g transform="translate(175, 25) scale(-1, 1)">
      <path d="M0,0 Q15,-15 30,0 Q15,15 0,30 Q-15,15 0,0" stroke="#C9748F" fill="none" stroke-width="1.5" opacity="0.3"/>
      <circle cx="0" cy="0" r="3" fill="#C9748F" opacity="0.3"/>
      <line x1="0" y1="30" x2="0" y2="60" stroke="#C9748F" stroke-width="1" opacity="0.2" stroke-dasharray="3,4"/>
    </g>
    <!-- Bottom Left -->
    <g transform="translate(25, 375) scale(1, -1)">
      <path d="M0,0 Q15,-15 30,0 Q15,15 0,30 Q-15,15 0,0" stroke="#C9748F" fill="none" stroke-width="1.5" opacity="0.3"/>
      <circle cx="0" cy="0" r="3" fill="#C9748F" opacity="0.3"/>
      <line x1="0" y1="30" x2="0" y2="60" stroke="#C9748F" stroke-width="1" opacity="0.2" stroke-dasharray="3,4"/>
    </g>
    <!-- Bottom Right -->
    <g transform="translate(175, 375) scale(-1, -1)">
      <path d="M0,0 Q15,-15 30,0 Q15,15 0,30 Q-15,15 0,0" stroke="#C9748F" fill="none" stroke-width="1.5" opacity="0.3"/>
      <circle cx="0" cy="0" r="3" fill="#C9748F" opacity="0.3"/>
      <line x1="0" y1="30" x2="0" y2="60" stroke="#C9748F" stroke-width="1" opacity="0.2" stroke-dasharray="3,4"/>
    </g>
  `;

  // Left Frame
  const leftSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  leftSVG.setAttribute('width', '200');
  leftSVG.setAttribute('height', '400');
  leftSVG.setAttribute('viewBox', '0 0 200 400');
  leftSVG.className = 'ornate-frame-svg';
  leftSVG.style.left = '10px';
  leftSVG.innerHTML = frameContent;
  hero.appendChild(leftSVG);

  // Right Frame
  const rightSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  rightSVG.setAttribute('width', '200');
  rightSVG.setAttribute('height', '400');
  rightSVG.setAttribute('viewBox', '0 0 200 400');
  rightSVG.className = 'ornate-frame-svg';
  rightSVG.style.right = '10px';
  rightSVG.innerHTML = frameContent;
  hero.appendChild(rightSVG);
}

function buildBackgroundSVG(hero) {
  const w = hero.clientWidth || window.innerWidth;
  const h = hero.clientHeight || window.innerHeight;
  
  const bgSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  bgSVG.setAttribute('width', '100%');
  bgSVG.setAttribute('height', '100%');
  bgSVG.style.position = 'absolute';
  bgSVG.style.inset = '0';
  bgSVG.style.zIndex = '0';
  bgSVG.style.pointerEvents = 'none';
  
  let content = `
    <defs>
      <radialGradient id="blobGradient1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#D4A5A5" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#D4A5A5" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="blobGradient2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#C9748F" stop-opacity="0.06"/>
        <stop offset="100%" stop-color="#C9748F" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="blobGradient3" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#E8C97E" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="#E8C97E" stop-opacity="0"/>
      </radialGradient>
    </defs>
  `;
  
  const blobs = [
    { cx: w * 0.15, cy: h * 0.2, rx: 250, ry: 200, grad: 'url(#blobGradient1)' },
    { cx: w * 0.8, cy: h * 0.15, rx: 300, ry: 220, grad: 'url(#blobGradient2)' },
    { cx: w * 0.5, cy: h * 0.5, rx: 280, ry: 280, grad: 'url(#blobGradient3)' },
    { cx: w * 0.2, cy: h * 0.8, rx: 220, ry: 260, grad: 'url(#blobGradient2)' },
    { cx: w * 0.85, cy: h * 0.75, rx: 260, ry: 200, grad: 'url(#blobGradient1)' },
    { cx: w * 0.35, cy: h * 0.4, rx: 200, ry: 180, grad: 'url(#blobGradient3)' }
  ];
  blobs.forEach(b => {
    content += `<ellipse class="watercolor-blob" cx="${b.cx}" cy="${b.cy}" rx="${b.rx}" ry="${b.ry}" fill="${b.grad}"/>`;
  });
  
  for (let x = 80; x < w; x += 80) {
    content += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="rgba(160, 82, 45, 0.04)" stroke-width="0.5"/>`;
  }
  for (let y = 80; y < h; y += 80) {
    content += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="rgba(160, 82, 45, 0.04)" stroke-width="0.5"/>`;
  }
  
  const cornerFlourishLeftTop = `
    <g opacity="0.9">
      <path d="M0,80 C20,60 40,20 80,0" stroke="#D4A5A5" stroke-width="1" fill="none" opacity="0.3"/>
      <path d="M0,50 C15,35 35,15 50,0" stroke="#C9748F" stroke-width="0.8" fill="none" opacity="0.2"/>
      <circle cx="10" cy="65" r="2" fill="#D4A5A5" opacity="0.25"/>
      <circle cx="20" cy="50" r="2" fill="#D4A5A5" opacity="0.25"/>
      <circle cx="32" cy="38" r="2" fill="#D4A5A5" opacity="0.25"/>
      <circle cx="50" cy="20" r="2" fill="#D4A5A5" opacity="0.25"/>
      <circle cx="65" cy="10" r="2" fill="#D4A5A5" opacity="0.25"/>
      <path d="M10,70 Q40,40 70,10 Q40,30 10,70" fill="rgba(212,165,165,0.08)" stroke="#D4A5A5" stroke-width="0.8"/>
    </g>
  `;
  
  content += `<g transform="translate(0, 0)">${cornerFlourishLeftTop}</g>`;
  content += `<g transform="translate(${w}, 0) scale(-1, 1)">${cornerFlourishLeftTop}</g>`;
  content += `<g transform="translate(0, ${h}) scale(1, -1)">${cornerFlourishLeftTop}</g>`;
  content += `<g transform="translate(${w}, ${h}) scale(-1, -1)">${cornerFlourishLeftTop}</g>`;
  
  bgSVG.innerHTML = content;
  hero.appendChild(bgSVG);
  
  const shapesData = [
    `<svg width="40" height="32" viewBox="0 0 40 32">
      <rect width="40" height="32" rx="2" stroke="#C9748F" stroke-width="1.2" fill="rgba(212,165,165,0.05)" opacity="0.4"/>
      <rect x="4" y="4" width="32" height="24" stroke="#D4A5A5" stroke-width="0.6" fill="none" opacity="0.3"/>
     </svg>`,
    `<svg width="40" height="40" viewBox="0 0 40 40">
      <path d="M20,5 C30,2 38,10 36,20 C34,28 26,32 20,30 C14,28 8,22 10,15 C12,8 15,7 20,5 Z" fill="rgba(201,116,143,0.08)" stroke="#C9748F" stroke-width="1" opacity="0.35"/>
      <circle cx="14" cy="18" r="3" fill="rgba(212,165,165,0.2)"/>
      <circle cx="22" cy="26" r="2.5" fill="rgba(232,201,126,0.2)"/>
      <circle cx="28" cy="16" r="2" fill="rgba(201,116,143,0.2)"/>
     </svg>`,
    `<svg width="40" height="40" viewBox="0 0 40 40">
      <path d="M20,0 L40,20 L20,40 L0,20 Z" stroke="#D4A5A5" stroke-width="1" fill="rgba(212,165,165,0.05)" opacity="0.3"/>
      <path d="M20,8 L32,20 L20,32 L8,20 Z" stroke="#C9748F" stroke-width="0.7" fill="none" opacity="0.2"/>
      <circle cx="20" cy="20" r="3" fill="rgba(232,201,126,0.3)" opacity="0.4"/>
     </svg>`,
    `<svg width="40" height="40" viewBox="0 0 40 40">
      <path d="M0,20 C10,0 30,5 40,15 C50,25 45,38 30,35 C15,32 5,25 10,15" stroke="#D4A5A5" stroke-width="1.5" fill="none" opacity="0.25" stroke-linecap="round"/>
     </svg>`,
    `<svg width="30" height="30" viewBox="0 0 30 30">
      <polygon points="15,0 18,11 30,15 18,19 15,30 12,19 0,15 12,11" fill="rgba(232,201,126,0.15)" stroke="#E8C97E" stroke-width="0.8" opacity="0.3"/>
     </svg>`
  ];
  
  for (let s = 0; s < 5; s++) {
    for (let c = 0; c < 3; c++) {
      const el = document.createElement('div');
      el.className = 'float-tool-element';
      el.style.left = (Math.random() * 80 + 10) + '%';
      el.style.top = (Math.random() * 80 + 10) + '%';
      el.innerHTML = shapesData[s];
      hero.appendChild(el);
      
      floatItems.push({
        el: el,
        speedX: (Math.random() * 0.0003) + 0.0002,
        speedY: (Math.random() * 0.0003) + 0.0002,
        speedRotZ: (Math.random() * 0.04) + 0.01,
        offsetX: Math.random() * Math.PI * 2,
        offsetY: Math.random() * Math.PI * 2,
        offsetR: Math.random() * Math.PI * 2,
        offsetRotZ: Math.random() * 360,
        amplitudeX: (Math.random() * 15) + 10,
        amplitudeY: (Math.random() * 25) + 15,
        ampRotX: (Math.random() * 10) + 5,
        ampRotY: (Math.random() * 10) + 5,
        baseZ: Math.floor(Math.random() * 30) - 15
      });
    }
  }
}

function buildNameplate(heroContent) {
  const h1 = heroContent.querySelector('h1.hero-title');
  if (!h1) return;
  
  const createDivider = () => {
    const div = document.createElement('div');
    div.className = 'museum-nameplate';
    div.innerHTML = `
      <svg width="280" height="12" viewBox="0 0 280 12">
        <defs>
          <linearGradient id="nameplateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#C9748F" stop-opacity="0"/>
            <stop offset="30%" stop-color="#C9748F" stop-opacity="0.5"/>
            <stop offset="50%" stop-color="#E8C97E" stop-opacity="0.8"/>
            <stop offset="70%" stop-color="#C9748F" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#C9748F" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <line x1="0" y1="6" x2="280" y2="6" stroke="url(#nameplateGrad)" stroke-width="2"/>
        <polygon points="140,2 144,6 140,10 136,6" fill="#E8C97E" opacity="0.8"/>
      </svg>
    `;
    return div;
  };

  const topDivider = createDivider();
  const bottomDivider = createDivider();
  
  h1.parentNode.insertBefore(topDivider, h1);
  h1.parentNode.insertBefore(bottomDivider, h1.nextSibling);
}

function buildWatermarkWords(hero) {
  const words = [
    { text: "ART", lang: "en" },
    { text: "فن", lang: "ar" },
    { text: "TEXTURE", lang: "en" },
    { text: "ملمس", lang: "ar" },
    { text: "CREATE", lang: "en" },
    { text: "إبداع", lang: "ar" },
    { text: "BEAUTY", lang: "en" },
    { text: "جمال", lang: "ar" }
  ];
  
  const posPresets = [
    { left: '5%', top: '15%' },
    { left: '80%', top: '12%' },
    { left: '10%', top: '80%' },
    { left: '75%', top: '82%' },
    { left: '4%', top: '50%' },
    { left: '83%', top: '55%' },
    { left: '20%', top: '8%' },
    { left: '60%', top: '88%' }
  ];
  
  words.forEach((w, idx) => {
    const span = document.createElement('span');
    span.className = 'watermark-word';
    span.textContent = w.text;
    span.style.position = 'absolute';
    
    const pos = posPresets[idx];
    span.style.left = pos.left;
    span.style.top = pos.top;
    
    span.style.fontSize = (Math.random() * 60 + 60) + 'px';
    if (w.lang === 'ar') {
      span.style.color = 'rgba(201, 116, 143, 0.04)';
      span.style.fontFamily = 'var(--font-heading-ar)';
    } else {
      span.style.color = 'rgba(160, 82, 45, 0.04)';
      span.style.fontFamily = 'var(--font-heading-en)';
    }
    
    const rot = Math.floor(Math.random() * 30) - 15;
    span.style.transform = `rotate(${rot}deg)`;
    hero.appendChild(span);
    
    floatItems.push({
      el: span,
      speedX: 0.0001,
      speedY: 0.0001,
      speedRotZ: 0,
      offsetX: Math.random() * Math.PI * 2,
      offsetY: Math.random() * Math.PI * 2,
      offsetR: 0,
      offsetRotZ: rot,
      amplitudeX: 5,
      amplitudeY: 5,
      ampRotX: 0,
      ampRotY: 0,
      baseZ: 0
    });
  });
}

function initMuseumParticles(hero) {
  const canvas = document.createElement('canvas');
  canvas.className = 'gold-dust-canvas';
  hero.insertBefore(canvas, hero.firstChild);
  
  const ctx = canvas.getContext('2d');
  
  const resizeCanvas = () => {
    canvas.width = hero.clientWidth || window.innerWidth;
    canvas.height = hero.clientHeight || window.innerHeight;
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  const particleCount = window.innerWidth < 768 ? 20 : 60;
  const particles = [];
  
  const colorTemplates = [
    (o) => `rgba(232, 201, 126, ${o})`,
    (o) => `rgba(212, 165, 165, ${o})`,
    (o) => `rgba(201, 116, 143, ${o})`
  ];
  
  for (let i = 0; i < particleCount; i++) {
    const opacity = Math.random() * 0.3 + 0.1;
    const colorTemplate = colorTemplates[Math.floor(Math.random() * colorTemplates.length)];
    
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() * 0.6) - 0.3,
      vy: (Math.random() * 0.6) - 0.3,
      size: Math.random() * 2 + 1,
      color: colorTemplate(opacity)
    });
  }
  
  function drawParticles() {
    if (isFloatVisible) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
    }
    
    requestAnimationFrame(drawParticles);
  }
  
  requestAnimationFrame(drawParticles);
}

function buildWaveDivider(hero) {
  const divider = document.createElement('div');
  divider.style.position = 'relative';
  divider.style.display = 'block';
  divider.style.marginTop = '-1px';
  divider.style.width = '100%';
  divider.style.height = '60px';
  divider.style.pointerEvents = 'none';
  divider.style.zIndex = '2';
  
  let diamonds = '';
  for (let x = 150; x < 1800; x += 300) {
    diamonds += `<polygon points="${x},26 ${x+4},30 ${x},34 ${x-4},30" fill="#E8C97E" opacity="0.4"/>`;
  }
  
  divider.innerHTML = `
    <svg class="museum-divider-svg" viewBox="0 0 1800 60" preserveAspectRatio="none" width="100%" height="100%">
      <path d="M0,30 C200,10 400,50 600,30 C800,10 1000,50 1200,30 C1400,10 1600,50 1800,30 L1800,60 L0,60 Z" fill="rgba(212,165,165,0.08)"/>
      <path d="M0,40 C150,20 350,55 600,38 C850,20 1050,55 1200,38 C1400,20 1600,55 1800,40" stroke="#C9748F" stroke-width="1" fill="none" opacity="0.2"/>
      ${diamonds}
    </svg>
  `;
  
  hero.parentNode.insertBefore(divider, hero.nextSibling);
}

/* ==========================================================================
   NEW CAROUSEL — 3D CIRCULAR CAROUSEL & AUTO-SCROLL
   ========================================================================== */

let carouselAngle = 0;
let carouselAnimationFrameId = null;
let isCarouselHovered = false;
let isMobileCarousel = false;
let mobileScrollInterval = null;
let mobileIsScrolling = false;

window.initCarousel = function() {
  const carousel = document.querySelector("#artwork-carousel");
  if (!carousel) return;

  const wrapper = document.querySelector(".artwork-carousel-wrapper");
  let cards = carousel.querySelectorAll(".artwork-carousel-card");
  if (!cards.length) return;

  // Clean up any existing loops before starting a new one
  if (carouselAnimationFrameId) {
    cancelAnimationFrame(carouselAnimationFrameId);
    carouselAnimationFrameId = null;
  }
  if (mobileScrollInterval) {
    clearInterval(mobileScrollInterval);
    mobileScrollInterval = null;
  }

  // Check if we need to duplicate the cards (e.g. if loaded dynamically from Firebase without clones)
  const hasClones = carousel.querySelectorAll(".artwork-carousel-card.artwork-clone").length > 0;
  if (!hasClones) {
    cards.forEach((card, index) => {
      const clone = card.cloneNode(true);
      clone.classList.add("artwork-clone");
      clone.style.setProperty("--index", cards.length + index);
      carousel.appendChild(clone);
    });
    // Re-query cards to include the newly appended clones
    cards = carousel.querySelectorAll(".artwork-carousel-card");
  }

  // Calculate half of the scroll width (since cards are duplicated)
  let halfScrollWidth = carousel.scrollWidth / 2;
  const updateDimensions = () => {
    halfScrollWidth = carousel.scrollWidth / 2;
  };

  // Wait for images to load to get accurate dimensions
  cards.forEach(card => {
    const img = card.querySelector("img");
    if (img) {
      if (img.complete) {
        updateDimensions();
      } else {
        img.addEventListener("load", updateDimensions);
      }
    }
  });

  // State variables for auto-scroll and manual drag
  if (!carousel._carouselState) {
    carousel._carouselState = {
      isPaused: false,
      isDragging: false,
      startX: 0,
      startScrollLeft: 0,
      resumeTimeout: null
    };

    const state = carousel._carouselState;

    // Pause on hover over the wrapper, resume after 1.5s
    if (wrapper) {
      wrapper.addEventListener("mouseenter", () => {
        if (state.resumeTimeout) clearTimeout(state.resumeTimeout);
        state.isPaused = true;
      });
      wrapper.addEventListener("mouseleave", () => {
        if (state.resumeTimeout) clearTimeout(state.resumeTimeout);
        state.resumeTimeout = setTimeout(() => {
          state.isPaused = false;
        }, 1500);
      });
    }

    // Bind card hover events (hover scale & overlay) and mobile tap toggles
    cards.forEach(card => {
      card.addEventListener("mouseenter", () => {
        carousel.classList.add("has-hovered-card");
        card.classList.add("hovered");
      });
      card.addEventListener("mouseleave", () => {
        carousel.classList.remove("has-hovered-card");
        card.classList.remove("hovered");
      });

      // Mobile click toggle zoom
      card.addEventListener("click", (e) => {
        if (window.innerWidth < 768) {
          e.stopPropagation();
          const isAlreadyZoomed = card.classList.contains("hovered");
          cards.forEach(c => c.classList.remove("hovered"));
          carousel.classList.remove("has-hovered-card");

          if (!isAlreadyZoomed) {
            card.classList.add("hovered");
            carousel.classList.add("has-hovered-card");
          }
        }
      });
    });

    // Close hovered card on click outside on mobile
    document.addEventListener("click", () => {
      if (window.innerWidth < 768) {
        cards.forEach(c => c.classList.remove("hovered"));
        carousel.classList.remove("has-hovered-card");
      }
    });

    // Mobile touch drag events
    carousel.addEventListener("touchstart", (e) => {
      state.isDragging = true;
      state.isPaused = true;
      if (state.resumeTimeout) clearTimeout(state.resumeTimeout);
      state.startX = e.touches[0].clientX;
      state.startScrollLeft = carousel.scrollLeft;
    }, { passive: true });

    carousel.addEventListener("touchmove", (e) => {
      if (!state.isDragging) return;
      const dx = state.startX - e.touches[0].clientX;
      carousel.scrollLeft = state.startScrollLeft + dx;
    }, { passive: true });

    carousel.addEventListener("touchend", () => {
      state.isDragging = false;
      if (state.resumeTimeout) clearTimeout(state.resumeTimeout);
      state.resumeTimeout = setTimeout(() => {
        state.isPaused = false;
      }, 1500);
    }, { passive: true });

    // Desktop mouse drag events for premium scroll interaction
    let isMouseDown = false;
    carousel.addEventListener("mousedown", (e) => {
      state.isDragging = true;
      state.isPaused = true;
      isMouseDown = true;
      if (state.resumeTimeout) clearTimeout(state.resumeTimeout);
      state.startX = e.pageX - carousel.offsetLeft;
      state.startScrollLeft = carousel.scrollLeft;
      carousel.style.cursor = "grabbing";
    });

    carousel.addEventListener("mousemove", (e) => {
      if (!isMouseDown) return;
      e.preventDefault();
      const x = e.pageX - carousel.offsetLeft;
      const walk = state.startX - x;
      carousel.scrollLeft = state.startScrollLeft + walk;
    });

    const stopMouseDrag = () => {
      if (isMouseDown) {
        isMouseDown = false;
        state.isDragging = false;
        carousel.style.cursor = "grab";
        if (state.resumeTimeout) clearTimeout(state.resumeTimeout);
        state.resumeTimeout = setTimeout(() => {
          state.isPaused = false;
        }, 1500);
      }
    };

    carousel.addEventListener("mouseup", stopMouseDrag);
    carousel.addEventListener("mouseleave", stopMouseDrag);
  }

  // Animation Loop (requestAnimationFrame)
  function scrollLoop() {
    const state = carousel._carouselState;
    if (!state.isPaused && !state.isDragging) {
      const isRTL = document.body.classList.contains("rtl");
      let currentScroll = carousel.scrollLeft;

      // Safeguard halfScrollWidth calculation
      if (halfScrollWidth <= 0) {
        halfScrollWidth = carousel.scrollWidth / 2;
      }

      if (halfScrollWidth > 0) {
        if (isRTL) {
          currentScroll -= 1; // Scroll left-to-right (reverse)
        } else {
          currentScroll += 1; // Scroll right-to-left (default)
        }

        // Seamless infinite wrap around midpoint
        if (currentScroll < 0) {
          currentScroll = (currentScroll % halfScrollWidth) + halfScrollWidth;
        } else if (currentScroll >= halfScrollWidth) {
          currentScroll = currentScroll % halfScrollWidth;
        }

        carousel.scrollLeft = currentScroll;
      }
    }
    carouselAnimationFrameId = requestAnimationFrame(scrollLoop);
  }

  // Start the auto-scroll loop
  carouselAnimationFrameId = requestAnimationFrame(scrollLoop);
}

// Window resize listener
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (window.initCarousel) {
      window.initCarousel();
    }
  }, 250);
});
