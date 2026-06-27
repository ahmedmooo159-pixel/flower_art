/* ==========================================
   SUPABASE DATA LAYER (للقراءة في الصفحات العادية)
   ========================================== */
const SUPABASE_URL = 'https://vuxsbzvkfcozwlutwefc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1eHNienZrZmNvendsdXR3ZWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjE2MDMsImV4cCI6MjA5ODEzNzYwM30.ujV8I4gibeHfmeX4yRqVRwbJTGdokGdScMEc0D7ytOo';

async function dbRead(key) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/site_data?key=eq.${encodeURIComponent(key)}&select=value`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows.length ? rows[0].value : null;
  } catch (e) {
    return null;
  }
}

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

  // تحميل البيانات من Supabase وتطبيقها على الصفحة
  loadSiteDataFromDB();
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
  const animatedElements = document.querySelectorAll('.fade-up');
  
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Stop observing once animated
        }
      });
    }, observerOptions);

    animatedElements.forEach(el => observer.observe(el));
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
function floatLoop() {
  const time = Date.now();
  floatItems.forEach(item => {
    const x = Math.sin(time * item.speedX + item.offsetX) * item.amplitudeX;
    const y = Math.cos(time * item.speedY + item.offsetY) * item.amplitudeY;
    const rotX = Math.sin(time * 0.0005 + item.offsetR) * item.ampRotX;
    const rotY = Math.cos(time * 0.0004 + item.offsetR) * item.ampRotY;
    const rotZ = (time * item.speedRotZ + item.offsetRotZ) % 360;
    item.el.style.transform = `translate3d(${x}px, ${y}px, ${item.baseZ}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
  });
  requestAnimationFrame(floatLoop);
}

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
  const cards = document.querySelectorAll('.glass-card');
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
        purpleGlows.forEach(el => {
          el.style.transform = `translateY(${scrollY * 0.3}px) translateZ(0)`;
        });
        blueGlows.forEach(el => {
          el.style.transform = `translateY(${scrollY * -0.2}px) translateZ(0)`;
        });
        ticked = false;
      });
      ticked = true;
    }
  });
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
  
  const particleCount = 60;
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

/* ==========================================
   تحميل البيانات من Supabase وتطبيقها على كل صفحة
   ========================================== */
async function loadSiteDataFromDB() {
  // 1) تطبيق الألوان المخصصة
  const colors = await dbRead('custom_colors');
  if (colors && Object.keys(colors).length > 0) {
    for (const [key, value] of Object.entries(colors)) {
      document.documentElement.style.setProperty(key, value);
    }
  }

  // 2) تحميل الـ reviews في صفحة reviews.html
  if (document.querySelector('.testimonials-grid') && window.location.pathname.includes('reviews')) {
    await renderReviews();
  }

  // 3) تحميل الـ FAQ في صفحة faq.html
  if (document.querySelector('.faq-list') && window.location.pathname.includes('faq')) {
    await renderFAQ();
  }

  // 4) تحميل الـ courses في صفحة plans.html
  if (document.querySelector('.courses-grid') && window.location.pathname.includes('plans')) {
    await renderCourses();
  }

  // 5) تحميل gallery في index.html
  if (document.querySelector('.artwork-gallery-grid')) {
    await renderGallery();
  }
}

/* ---- رسم الـ Reviews ---- */
async function renderReviews() {
  const reviews = await dbRead('reviews_data');
  if (!reviews || !reviews.length) return;

  const grid = document.querySelector('.testimonials-grid');
  if (!grid) return;

  const isAr = document.body.classList.contains('rtl');
  grid.innerHTML = '';

  reviews.forEach(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const quote = isAr ? r.quoteAr : r.quoteEn;
    const course = isAr ? r.courseAr : r.courseEn;

    const card = document.createElement('article');
    card.className = 'glass-card testimonial-card fade-up';
    card.innerHTML = `
      <div class="testimonial-stars" style="color:#fbbf24;">${stars}</div>
      <p class="testimonial-quote">"${quote}"</p>
      <div class="testimonial-user">
        <img class="user-avatar" src="assets/instructor.png" alt="${r.name}">
        <div>
          <span class="user-name">${r.name}</span>
          <span class="user-title" style="display:block;">${course}</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  // إعادة تشغيل animation observer
  initScrollAnimations();
}

/* ---- رسم الـ FAQ ---- */
async function renderFAQ() {
  const faqs = await dbRead('faq_data');
  if (!faqs || !faqs.length) return;

  const list = document.querySelector('.faq-list');
  if (!list) return;

  const isAr = document.body.classList.contains('rtl');
  list.innerHTML = '';

  faqs.forEach(faq => {
    const q = isAr ? faq.questionAr : faq.questionEn;
    const a = isAr ? faq.answerAr : faq.answerEn;

    const item = document.createElement('div');
    item.className = 'faq-item glass-card fade-up';
    item.innerHTML = `
      <button class="faq-trigger" aria-expanded="false">
        <span>${q}</span>
        <i class="fa-solid fa-plus faq-icon-indicator"></i>
      </button>
      <div class="faq-panel">
        <div class="faq-content">${a}</div>
      </div>
    `;
    list.appendChild(item);
  });

  initFAQAccordion();
  initScrollAnimations();
}

/* ---- رسم الـ Courses في Plans ---- */
async function renderCourses() {
  const courses = await dbRead('courses_data');
  if (!courses || !courses.length) return;

  const grid = document.querySelector('.courses-grid');
  if (!grid) return;

  const isAr = document.body.classList.contains('rtl');
  grid.innerHTML = '';

  courses.forEach(c => {
    const title = isAr ? c.titleAr : c.titleEn;
    const desc = isAr ? (c.descAr || '') : (c.descEn || '');
    const badge = isAr ? c.badgeAr : c.badgeEn;
    const level = isAr ? c.levelAr : c.levelEn;

    const article = document.createElement('article');
    article.className = 'course-card fade-up visible';
    article.setAttribute('data-category', c.levelEn.toLowerCase());
    article.innerHTML = `
      <div class="glass-card">
        <div class="course-image">
          <span class="course-badge">${badge}</span>
          <img src="${c.image}" alt="${title}">
        </div>
        <div class="course-content">
          <div class="course-meta">
            <span><i class="fa-solid fa-clock"></i> ${c.duration}</span>
            <span><i class="fa-solid fa-layer-group"></i> ${level}</span>
          </div>
          <h3 class="course-title">${title}</h3>
          ${desc ? `<p class="course-desc">${desc}</p>` : ''}
          <div class="course-pricing">
            <div>
              <div class="price-label">${isAr ? 'السعر' : 'Price'}</div>
              <div class="price-value">$${c.price}<span>.00</span></div>
            </div>
          </div>
        </div>
        <div class="course-actions">
          <a href="https://www.instagram.com/reel/DaDKc5vNl44/?igsh=ZDVxamR1YjFwMGEz" target="_blank" class="btn btn-secondary">
            ${isAr ? 'مقدمة' : 'Intro'}
          </a>
          <a href="thankyou.html" class="btn btn-primary">
            ${isAr ? 'شراء الدورة' : 'Get Access'}
          </a>
        </div>
      </div>
    `;
    grid.appendChild(article);
  });

  initCategoryFilters();
}

/* ---- رسم الـ Gallery في index.html ---- */
async function renderGallery() {
  const artworks = await dbRead('artworks_data');
  if (!artworks || !artworks.length) return;

  const grid = document.querySelector('.artwork-gallery-grid');
  if (!grid) return;

  const isAr = document.body.classList.contains('rtl');
  grid.innerHTML = '';

  const ratioMap = { '3/4': 'ratio-3-4', '1/1': 'ratio-1-1', '4/3': 'ratio-4-3' };

  artworks.forEach(art => {
    const title = isAr ? art.titleAr : art.titleEn;
    const category = isAr ? art.categoryAr : art.categoryEn;
    const ratioClass = ratioMap[art.ratio] || 'ratio-1-1';

    const card = document.createElement('div');
    card.className = `artwork-card fade-up ${ratioClass}`;
    card.innerHTML = `
      <img src="${art.image}" alt="${title}">
      <div class="artwork-overlay">
        <span class="artwork-category">${category}</span>
        <h4 class="artwork-title">${title}</h4>
      </div>
    `;
    grid.appendChild(card);
  });

  initScrollAnimations();
}
