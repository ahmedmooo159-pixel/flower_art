(function() {
  // 1. Inject canvas elements and helper HTML structures into the DOM
  function injectHTML() {
    // Custom cursor elements
    if (!document.getElementById('cursor-ring')) {
      const ring = document.createElement('div');
      ring.id = 'cursor-ring';
      document.body.appendChild(ring);
    }
    if (!document.getElementById('cursor-dot')) {
      const dot = document.createElement('div');
      dot.id = 'cursor-dot';
      document.body.appendChild(dot);
    }

    // Canvas overlay and layers
    const layers = [
      { id: 'three-canvas', tag: 'canvas' },
      { id: 'fx-canvas', tag: 'canvas' },
      { id: 'doodle-canvas', tag: 'canvas' },
      { id: 'watercolor-bg', tag: 'div' },
      { id: 'splash-overlay', tag: 'div', className: 'splash-overlay' },
      { id: 'float-art-layer', tag: 'div' },
      { id: 'ink-particle-layer', tag: 'div' }
    ];
    layers.forEach(l => {
      if (!document.getElementById(l.id)) {
        const el = document.createElement(l.tag);
        el.id = l.id;
        if (l.className) el.className = l.className;
        document.body.insertBefore(el, document.body.firstChild);
      }
    });

    // Corner strokes SVG
    if (!document.querySelector('.corner-stroke.tl')) {
      const corners = [
        { c: 'tl', path: 'M10 200 Q 40 80 200 10', g1: 'cg1', g2: 'cg2', colors: ['#f9a8d4', '#d8b4fe', '#fbbf24', '#fb7185'], scale: '' },
        { c: 'tr', path: 'M10 200 Q 40 80 200 10', g1: 'cg3', colors: ['#a7f3d0', '#bae6fd'], scale: 'scaleX(-1)' },
        { c: 'bl', path: 'M10 200 Q 40 80 200 10', g1: 'cg5', colors: ['#2dd4bf', '#fef08a'], scale: 'scaleY(-1)' },
        { c: 'br', path: 'M10 200 Q 40 80 200 10', g1: 'cg6', colors: ['#fb7185', '#d8b4fe'], scale: 'scale(-1,-1)' }
      ];
      corners.forEach(item => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', `corner-stroke ${item.c}`);
        svg.setAttribute('width', '220');
        svg.setAttribute('height', '220');
        svg.setAttribute('viewBox', '0 0 220 220');
        svg.setAttribute('fill', 'none');
        if (item.scale) svg.style.transform = item.scale;

        let defsHtml = `<defs><linearGradient id="${item.g1}" x1="0" y1="1" x2="1" y2="0" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="${item.colors[0]}"/><stop offset="1" stop-color="${item.colors[1]}"/></linearGradient>`;
        if (item.colors.length > 2) {
          defsHtml += `<linearGradient id="${item.g2}" x1="0" y1="1" x2="1" y2="0" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="${item.colors[2]}"/><stop offset="1" stop-color="${item.colors[3]}"/></linearGradient>`;
        }
        defsHtml += `</defs>`;
        svg.innerHTML = defsHtml + `<path d="${item.path}" stroke="url(#${item.g1})" stroke-width="22" stroke-linecap="round" fill="none"/>` + 
          (item.colors.length > 2 ? `<path d="M10 180 Q 60 100 180 20" stroke="url(#${item.g2})" stroke-width="12" stroke-linecap="round" fill="none" opacity=".5"/>` : '');
        document.body.insertBefore(svg, document.body.firstChild);
      });
    }
  }

  // 2. Load Three.js dynamically
  function loadThree(callback) {
    if (window.THREE) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = callback;
    document.head.appendChild(script);
  }

  // 3. Initialize background blobs, splashes, cursor and interactive ripples
  function initLivingEnvironment() {
    injectHTML();

    // Cursor tracking
    const ring = document.getElementById('cursor-ring');
    const dot = document.getElementById('cursor-dot');
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (dot) {
        dot.style.left = mx + 'px';
        dot.style.top = my + 'px';
      }
    });

    // Custom cursor scaling on hoverable elements
    const hoverQuery = 'a, button, select, input, textarea, .nav-link, .btn, .hamburger, .swatch, .testimonial-card, .faq-trigger, [role="button"]';
    document.addEventListener('mouseover', e => {
      if (e.target.closest && e.target.closest(hoverQuery)) {
        document.body.classList.add('has-hover');
      }
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest && !e.target.closest(hoverQuery)) {
        document.body.classList.remove('has-hover');
      }
    });

    (function loopCursor() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (ring) {
        ring.style.left = rx + 'px';
        ring.style.top = ry + 'px';
      }
      requestAnimationFrame(loopCursor);
    })();

    // Watercolor blobs
    const wbg = document.getElementById('watercolor-bg');
    if (wbg && wbg.children.length === 0) {
      const blobs = [
        {c:'#f9a8d4',s:500,x:'10%',y:'5%',dur:14,del:0,tx:'40px',ty:'-20px',tx2:'-15px',ty2:'30px'},
        {c:'#d8b4fe',s:600,x:'65%',y:'2%',dur:16,del:3,tx:'-30px',ty:'25px',tx2:'20px',ty2:'-10px'},
        {c:'#bae6fd',s:450,x:'80%',y:'50%',dur:13,del:5,tx:'-25px',ty:'-30px',tx2:'30px',ty2:'15px'},
        {c:'#a7f3d0',s:380,x:'5%',y:'60%',dur:15,del:2,tx:'35px',ty:'20px',tx2:'-20px',ty2:'-25px'},
        {c:'#fcd5b5',s:420,x:'40%',y:'75%',dur:12,del:7,tx:'-20px',ty:'-35px',tx2:'25px',ty2:'15px'},
        {c:'#fef08a',s:300,x:'25%',y:'30%',dur:10,del:1,tx:'30px',ty:'10px',tx2:'-10px',ty2:'-20px'},
        {c:'#fb7185',s:350,x:'55%',y:'85%',dur:17,del:9,tx:'-15px',ty:'-25px',tx2:'20px',ty2:'10px'}
      ];
      blobs.forEach(b => {
        const d = document.createElement('div');
        d.className = 'wc-blob';
        d.style.cssText = `background:${b.c};width:${b.s}px;height:${b.s}px;left:${b.x};top:${b.y};--dur:${b.dur}s;--del:${b.del}s;--tx:${b.tx};--ty:${b.ty};--tx2:${b.tx2};--ty2:${b.ty2};`;
        wbg.appendChild(d);
      });
    }

    // Paint Splashes overlay
    const splashOverlay = document.getElementById('splash-overlay');
    if (splashOverlay && splashOverlay.children.length === 0) {
      const splashColors = ['#f9a8d4','#d8b4fe','#bae6fd','#a7f3d0','#fcd5b5','#fb7185','#a78bfa','#fbbf24','#2dd4bf'];
      for (let i = 0; i < 12; i++) {
        const s = document.createElement('div');
        const w = 90 + Math.random() * 150;
        s.className = 'splash';
        s.style.cssText = `width:${w}px;height:${w*.7}px;left:${Math.random()*95}%;top:${Math.random()*95}%;background:${splashColors[i%splashColors.length]};--op:${(.06+Math.random()*.08).toFixed(2)};--life:${8+Math.random()*10}s;--del:${Math.random()*12}s;border-radius:${30+Math.random()*40}% ${50+Math.random()*30}% ${40+Math.random()*40}% ${30+Math.random()*40}% / ${30+Math.random()*40}% ${40+Math.random()*30}% ${50+Math.random()*30}% ${40+Math.random()*40}%;`;
        splashOverlay.appendChild(s);
      }
    }

    // Floating HTML art objects (leaves, stars, emojis)
    const floatLayer = document.getElementById('float-art-layer');
    if (floatLayer && floatLayer.children.length === 0) {
      const items = [
        {e:'🌸',sz:'1.8rem',op:.8,dur:9,del:0,x:'6%',y:'32%',mx:'25px',my:'-40px',mx2:'-15px',my2:'20px',rot:'15deg',rot2:'-8deg'},
        {e:'🌸',sz:'1.4rem',op:.75,dur:11,del:2,x:'85%',y:'18%',mx:'-20px',my:'-35px',mx2:'15px',my2:'25px',rot:'-12deg',rot2:'6deg'},
        {e:'🎨',sz:'2rem',op:.7,dur:10,del:1,x:'4%',y:'68%',mx:'30px',my:'-20px',mx2:'-10px',my2:'30px',rot:'8deg',rot2:'-15deg'},
        {e:'✏️',sz:'1.6rem',op:.7,dur:8,del:3,x:'84%',y:'52%',mx:'-25px',my:'-45px',mx2:'20px',my2:'15px',rot:'-20deg',rot2:'10deg'},
        {e:'🌺',sz:'1.5rem',op:.85,dur:12,del:.5,x:'18%',y:'14%',mx:'15px',my:'-50px',mx2:'-20px',my2:'10px',rot:'5deg',rot2:'-3deg'},
        {e:'🌱',sz:'1.3rem',op:.8,dur:9,del:4,x:'72%',y:'82%',mx:'-10px',my:'-40px',mx2:'15px',my2:'5px',rot:'-5deg',rot2:'8deg'},
        {e:'🦋',sz:'1.6rem',op:.8,dur:14,del:2,x:'12%',y:'82%',mx:'60px',my:'-20px',mx2:'-40px',my2:'10px',rot:'-15deg',rot2:'20deg'},
        {e:'🦋',sz:'1.4rem',op:.7,dur:11,del:7,x:'78%',y:'38%',mx:'-50px',my:'-15px',mx2:'30px',my2:'25px',rot:'20deg',rot2:'-10deg'},
        {e:'⭐',sz:'1rem',op:.6,dur:7,del:1,x:'58%',y:'10%',mx:'-10px',my:'-20px',mx2:'8px',my2:'15px',rot:'0deg',rot2:'10deg'},
        {e:'💧',sz:'1.2rem',op:.7,dur:9,del:4,x:'26%',y:'48%',mx:'10px',my:'-30px',mx2:'-8px',my2:'20px',rot:'5deg',rot2:'-5deg'}
      ];
      items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'float-art';
        el.textContent = item.e;
        el.style.cssText = `--sz:${item.sz};--op:${item.op};--dur:${item.dur}s;--del:${item.del}s;--mx:${item.mx};--my:${item.my};--mx2:${item.mx2};--my2:${item.my2};--rot:${item.rot};--rot2:${item.rot2};left:${item.x};top:${item.y};font-size:${item.sz};`;
        floatLayer.appendChild(el);
      });
    }

    // Interactive scroll parallax on float objects
    window.addEventListener('scroll', () => {
      const sy = window.scrollY;
      const fArts = document.querySelectorAll('.float-art');
      fArts.forEach((f, idx) => {
        const factor = (idx % 3 + 1) * 0.05;
        f.style.transform = `translateY(${sy * factor}px)`;
      });
    });

    // Ink Particles (random drift)
    const inkLayer = document.getElementById('ink-particle-layer');
    if (inkLayer && inkLayer.children.length === 0) {
      const inkColors = ['#f9a8d4','#d8b4fe','#bae6fd','#a7f3d0','#fb7185','#fbbf24','#2dd4bf'];
      for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'ink-particle';
        const sz = (4 + Math.random() * 6).toFixed(1) + 'px';
        p.style.cssText = `--sz:${sz};--c:${inkColors[i%inkColors.length]};--dur:${4+Math.random()*4}s;--del:${Math.random()*8}s;--tx:${(Math.random()*60-30).toFixed(0)}px;--ty:${(-30-Math.random()*40).toFixed(0)}px;left:${(Math.random()*100).toFixed(1)}%;top:${(30+Math.random()*60).toFixed(1)}%;width:${sz};height:${sz};background:${inkColors[i%inkColors.length]};`;
        inkLayer.appendChild(p);
      }
    }

    // Doodle Canvas background drawings
    initDoodles();

    // 2D FX Canvas setup (ripples + mouse paint dust trail)
    initFXCanvas();

    // Load Three.js 3D scene
    loadThree(init3D);
  }

  // Doodle Drawing Logic
  function initDoodles() {
    const canvas = document.getElementById('doodle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colors = ['#d8b4fe','#f9a8d4','#bae6fd','#a7f3d0','#fbbf24','#fb7185','#a78bfa'];

    function drawStar(cx, cy, r, col) {
      ctx.save(); ctx.translate(cx, cy); ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI / 5) - Math.PI / 2;
        const b = (i * 4 * Math.PI / 5 + 2 * Math.PI / 5) - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(b) * r * .4, Math.sin(b) * r * .4);
      }
      ctx.closePath(); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    }

    function drawHeart(cx, cy, s, col) {
      ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.beginPath();
      ctx.moveTo(0, -1); ctx.bezierCurveTo(1, -2, 3, .5, 0, 3); ctx.bezierCurveTo(-3, .5, -1, -2, 0, -1);
      ctx.strokeStyle = col; ctx.lineWidth = 1 / s; ctx.stroke(); ctx.restore();
    }

    function drawAll() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width, h = canvas.height;
      for (let i = 0; i < 24; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const col = colors[i % colors.length];
        const type = Math.floor(Math.random() * 5);
        ctx.globalAlpha = 0.2 + Math.random() * 0.25;
        if (type === 0) drawStar(x, y, 6 + Math.random() * 10, col);
        else if (type === 1) drawHeart(x, y, 5 + Math.random() * 6, col);
        else if (type === 2) {
          ctx.beginPath(); ctx.moveTo(x, y);
          for (let j = 0; j < 4; j++) ctx.quadraticCurveTo(x + (j * 15) - 30, y + (j % 2 === 0 ? -15 : 15), x + (j + 1) * 15 - 30, y);
          ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.stroke();
        } else if (type === 3) {
          ctx.beginPath(); ctx.arc(x, y, 5 + Math.random() * 8, 0, Math.PI * 2);
          ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke();
        } else {
          ctx.save(); ctx.translate(x, y); ctx.rotate(Math.random() * Math.PI / 4);
          const r2 = 5 + Math.random() * 6; ctx.beginPath();
          ctx.moveTo(-r2, 0); ctx.lineTo(r2, 0); ctx.moveTo(0, -r2); ctx.lineTo(0, r2);
          ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawAll();
    }
    window.addEventListener('resize', resize);
    resize();
  }

  // 2D FX Canvas Logic (Cursor paint ripples + spark/dust trail)
  function initFXCanvas() {
    const canvas = document.getElementById('fx-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let ripples = [];
    let paintDust = [];
    let airStrokes = [];
    const dustColors = ['#f9a8d4','#d8b4fe','#bae6fd','#fb7185','#a78bfa','#fbbf24','#a7f3d0'];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Spawn paint trail on mouse move
    document.addEventListener('mousemove', e => {
      if (Math.random() < 0.35) {
        paintDust.push({
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + (Math.random() - 0.5) * 20,
          r: 2 + Math.random() * 4,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 2,
          life: 1,
          color: dustColors[Math.floor(Math.random() * dustColors.length)]
        });
      }
    });

    // Big click ripple
    document.addEventListener('click', e => {
      const cols = ['rgba(167,139,250,', 'rgba(249,168,212,', 'rgba(251,113,133,', 'rgba(251,191,36,', 'rgba(45,212,180,'];
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        r: 0,
        alpha: 1,
        color: cols[Math.floor(Math.random() * cols.length)]
      });
    });

    // Subtle random paint strokes in coordinates
    setInterval(() => {
      if (document.hidden) return;
      const x1 = Math.random() * window.innerWidth;
      const y1 = Math.random() * window.innerHeight;
      const bc = ['rgba(249,168,212,', 'rgba(216,180,254,', 'rgba(186,230,253,', 'rgba(167,243,208,', 'rgba(251,113,133,'];
      airStrokes.push({
        x1, y1,
        x2: x1 + (Math.random() - 0.5) * 260,
        y2: y1 + (Math.random() - 0.5) * 60,
        alpha: 0,
        growing: true,
        col: bc[Math.floor(Math.random() * bc.length)],
        w: 3 + Math.random() * 6
      });
    }, 4000);

    // Hover button custom splash animations
    const interactiveQuery = '.btn, button, .nav-link, .artwork-carousel-card, .swatch';
    document.addEventListener('mouseover', e => {
      const target = e.target && e.target.closest && e.target.closest(interactiveQuery);
      if (target && !target._splashHoverBound) {
        target._splashHoverBound = true;
        target.addEventListener('mouseenter', ev => {
          const rect = target.getBoundingClientRect();
          const col = dustColors[Math.floor(Math.random() * dustColors.length)];
          for (let k = 0; k < 6; k++) {
            paintDust.push({
              x: rect.left + rect.width / 2 + (Math.random() - 0.5) * rect.width,
              y: rect.top + rect.height / 2 + (Math.random() - 0.5) * rect.height,
              r: 1.5 + Math.random() * 3,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              life: 0.8 + Math.random() * 0.4,
              color: col
            });
          }
        });
      }
    });

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Air strokes
      airStrokes = airStrokes.filter(s => s.alpha > 0);
      airStrokes.forEach(s => {
        if (s.growing) {
          s.alpha += 0.015;
          if (s.alpha >= 0.35) s.growing = false;
        } else {
          s.alpha -= 0.006;
        }
        ctx.save(); ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2);
        ctx.strokeStyle = s.col + s.alpha + ')'; ctx.lineWidth = s.w; ctx.lineCap = 'round';
        ctx.stroke(); ctx.restore();
      });

      // Paint dust
      paintDust = paintDust.filter(d => d.life > 0);
      paintDust.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        d.vy += 0.03; // gravity
        d.life -= 0.022;
        ctx.save(); ctx.globalAlpha = Math.max(0, d.life); ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fillStyle = d.color;
        ctx.fill(); ctx.restore();
      });

      // Ripples
      ripples = ripples.filter(r => r.alpha > 0);
      ripples.forEach(r => {
        r.r += 3.2; r.alpha -= 0.022;
        ctx.save(); ctx.globalAlpha = Math.max(0, r.alpha); ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.strokeStyle = r.color + '1)';
        ctx.lineWidth = 2.5; ctx.stroke();
        if (r.r < 25) {
          ctx.beginPath(); ctx.arc(r.x, r.y, r.r * .5, 0, Math.PI * 2);
          ctx.fillStyle = r.color + '.2)'; ctx.fill();
        }
        ctx.restore();
      });

      requestAnimationFrame(draw);
    }
    draw();
  }

  // 4. Three.js 3D Scene Integration
  function init3D() {
    const canvas3 = document.getElementById('three-canvas');
    if (!canvas3) return;
    const renderer = new THREE.WebGLRenderer({ canvas: canvas3, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, 100);
    camera.position.set(0, 0, 8);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, .85));
    const dir = new THREE.DirectionalLight(0xfff0f5, 1.2); dir.position.set(5, 8, 5); scene.add(dir);
    const pl1 = new THREE.PointLight(0xd8b4fe, 1.4, 30); pl1.position.set(-6, 4, 4); scene.add(pl1);
    const pl2 = new THREE.PointLight(0xfcd5b5, 1.1, 30); pl2.position.set(6, -4, 4); scene.add(pl2);

    const mat = (hex, r = .3, m = .1) => new THREE.MeshStandardMaterial({ color: hex, roughness: r, metalness: m });

    // ── floating brushes
    const brushes = [];
    function mkBrush(x, y, z, col, rz) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1.5, 12), mat(0xc8a882, .6, 0)));
      const fer = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .15, 12), mat(0xc0c0c0, .3, .8)); fer.position.y = .82; g.add(fer);
      const bri = new THREE.Mesh(new THREE.ConeGeometry(.038, .32, 12), mat(col, .85, 0)); bri.position.y = 1.05; g.add(bri);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 8), mat(col, .15, .05)); tip.position.y = 1.23; g.add(tip);
      g.position.set(x, y, z); g.rotation.z = rz;
      g.userData = { ox: x, oy: y, oz: z, phase: Math.random() * Math.PI * 2, speed: .3 + Math.random() * .3 };
      scene.add(g); brushes.push(g);
    }
    // Set brushes positioned nicely at sides to wrap content
    mkBrush(-5, 2, -1, 0xf9a8d4, -.3);
    mkBrush(-3.5, 3.8, -2, 0xa78bfa, .25);
    mkBrush(5, 2.5, -1, 0xfbbf24, .35);
    mkBrush(4, -2.5, -2, 0x34d399, -.15);
    mkBrush(-4.5, -3, -1, 0xfb7185, .4);
    mkBrush(5.5, -0.5, -3, 0xbae6fd, -.3);

    // ── paint tubes
    const tubes = [];
    function mkTube(x, y, z, col) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .8, 16), mat(col, .4, .05)));
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.06, .1, .18, 12), mat(0x888888, .3, .7)); cap.position.y = .48; g.add(cap);
      const crimp = new THREE.Mesh(new THREE.BoxGeometry(.2, .08, .12), mat(col, .5, 0)); crimp.position.y = -.45; g.add(crimp);
      g.position.set(x, y, z); g.rotation.z = (Math.random() - 0.5) * 1.0;
      g.userData = { ox: x, oy: y, oz: z, phase: Math.random() * Math.PI * 2, speed: .25 + Math.random() * .25 };
      scene.add(g); tubes.push(g);
    }
    mkTube(-5.8, -0.5, -2, 0xf9a8d4);
    mkTube(5.8, 0.8, -2, 0xfbbf24);
    mkTube(4.8, -3.8, -3, 0xfb7185);
    mkTube(-5.2, -4.2, -3, 0xbae6fd);

    // ── wooden artist palette
    const palettes = [];
    function mkPalette() {
      const sh = new THREE.Shape();
      sh.moveTo(0, 0); sh.quadraticCurveTo(1.2, -.4, 2, .4); sh.quadraticCurveTo(2.6, 1.2, 2, 1.8);
      sh.quadraticCurveTo(1.6, 2.4, .8, 2.2); sh.quadraticCurveTo(-.4, 2.6, -.6, 1.4); sh.quadraticCurveTo(-.8, .4, 0, 0);
      const pal = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat(0xdeb887, .5, .05));
      pal.scale.set(.7, .7, .7);
      pal.position.set(-4.2, -2.5, -2.5);
      pal.rotation.x = -0.4;
      scene.add(pal);
      palettes.push(pal);

      // Spots on palette
      [0xf87171, 0xfbbf24, 0x34d399, 0x818cf8, 0xf472b6, 0xffffff].forEach((c, idx) => {
        const angle = (idx / 6) * Math.PI * 2;
        const b = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 10), mat(c, .15, .08));
        b.position.set(.9 + Math.cos(angle) * .4, .9 + Math.sin(angle) * .4, .06);
        b.scale.set(1, 1, .3);
        pal.add(b);
      });
    }
    mkPalette();

    // ── crayons / pencils / markers
    const pencils = [];
    function mkPencil(x, y, z, col, isMark = false) {
      const g = new THREE.Group(), bW = isMark ? .06 : .045;
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(bW, bW, 1.2, isMark ? 16 : 6), mat(col, .5, 0)));
      if (!isMark) {
        const tip = new THREE.Mesh(new THREE.ConeGeometry(bW, .18, 6), mat(0xffe4b5, .6, 0)); tip.position.y = -.68; g.add(tip);
        const gr = new THREE.Mesh(new THREE.ConeGeometry(.018, .06, 4), mat(0x333333, .9, 0)); gr.position.y = -.82; g.add(gr);
      } else {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(.075, .06, .22, 16), mat(col, .3, 0)); cap.position.y = .7; g.add(cap);
        const nib = new THREE.Mesh(new THREE.ConeGeometry(.035, .12, 8), mat(0x333333, .8, 0)); nib.position.y = -.7; nib.rotation.x = Math.PI; g.add(nib);
      }
      g.position.set(x, y, z); g.rotation.set((Math.random() - .5) * .6, 0, (Math.random() - .5) * .8);
      g.userData = { ox: x, oy: y, oz: z, phase: Math.random() * Math.PI * 2, speed: .3 + Math.random() * .3 };
      scene.add(g); pencils.push(g);
    }
    mkPencil(-3.8, 4.2, -2, 0xfbbf24);
    mkPencil(-2.5, 4.6, -2, 0xfb7185);
    mkPencil(3.2, 4.2, -2, 0xa78bfa);
    mkPencil(2.2, 4.8, -2, 0x34d399, true);
    mkPencil(-4.2, 3.2, -2, 0xbae6fd, true);

    // ── sketchbooks
    const books = [];
    function mkBook(x, y, z) {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, .1), mat(0xfaf9f6, .45, 0)));
      const pg = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, .06), mat(0xfffff0, .6, 0)); pg.position.x = .04; pg.position.z = .07; g.add(pg);
      const det = new THREE.Mesh(new THREE.BoxGeometry(.02, 1.35, .11), mat(0xd8b4fe, .35, 0)); det.position.x = -.52; g.add(det);
      g.position.set(x, y, z); g.rotation.set(-.1, (Math.random() - .5) * .3, (Math.random() - .5) * .25);
      g.userData = { ox: x, oy: y, oz: z, phase: Math.random() * Math.PI * 2, speed: .2 + Math.random() * .25 };
      scene.add(g); books.push(g);
    }
    mkBook(4.2, -3.2, -3);
    mkBook(-4.5, -4.5, -3);

    // ── watercolor drops
    const drops = [];
    const dCols = [0xf9a8d4, 0xd8b4fe, 0xbae6fd, 0xa7f3d0, 0xfbbf24, 0xfb7185];
    for (let i = 0; i < 15; i++) {
      const d = new THREE.Mesh(
        new THREE.SphereGeometry(.05 + Math.random() * .08, 10, 10),
        new THREE.MeshStandardMaterial({ color: dCols[i % dCols.length], roughness: .04, metalness: .1, transparent: true, opacity: .65 + Math.random() * .2 })
      );
      d.position.set((Math.random() - .5) * 13, (Math.random() - .5) * 9, (Math.random() - .5) * 3 - 1);
      d.userData = { phase: Math.random() * Math.PI * 2, speed: .25 + Math.random() * .4, ox: d.position.x, oy: d.position.y, oz: d.position.z };
      scene.add(d); drops.push(d);
    }

    // ── sparkling glowing particles
    const N = 120, pGeo = new THREE.BufferGeometry(), pPos = new Float32Array(N * 3), pCol = new Float32Array(N * 3);
    const pCols = [
      [249 / 255, 168 / 255, 212 / 255], [216 / 255, 180 / 255, 254 / 255], [186 / 255, 230 / 255, 253 / 255],
      [167 / 255, 243 / 255, 208 / 255], [251 / 255, 113 / 255, 133 / 255], [167 / 255, 139 / 255, 250 / 255],
      [251 / 255, 191 / 255, 36 / 255]
    ];
    for (let i = 0; i < N; i++) {
      pPos[i * 3] = (Math.random() - .5) * 15;
      pPos[i * 3 + 1] = (Math.random() - .5) * 10;
      pPos[i * 3 + 2] = (Math.random() - .5) * 4 - 1;
      const c = pCols[i % pCols.length]; pCol[i * 3] = c[0]; pCol[i * 3 + 1] = c[1]; pCol[i * 3 + 2] = c[2];
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: .12, vertexColors: true, transparent: true, opacity: .7, sizeAttenuation: true }));
    scene.add(particles);

    // ── falling flower petals & flowers
    const petals = [];
    const petCols = [0xf9a8d4, 0xfcd5b5, 0xd8b4fe, 0xfb7185, 0xfef08a];
    for (let i = 0; i < 20; i++) {
      const sh2 = new THREE.Shape(); sh2.moveTo(0, 0); sh2.quadraticCurveTo(.12, .25, 0, .4); sh2.quadraticCurveTo(-.12, .25, 0, 0);
      const pe = new THREE.Mesh(new THREE.ShapeGeometry(sh2), new THREE.MeshStandardMaterial({ color: petCols[i % petCols.length], roughness: .75, metalness: 0, transparent: true, opacity: .7, side: THREE.DoubleSide }));
      pe.position.set((Math.random() - .5) * 14, 4 + Math.random() * 5, (Math.random() - .5) * 4);
      pe.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      pe.userData = { vy: .007 + Math.random() * .01, vx: (Math.random() - .5) * .004, vr: (Math.random() - .5) * .02, vry: (Math.random() - .5) * .015, vrz: (Math.random() - .5) * .02 };
      scene.add(pe); petals.push(pe);
    }

    // ── butterflies flying organically
    const butterflies = [];
    const bfCols = [0xf9a8d4, 0xd8b4fe, 0xbae6fd, 0xa7f3d0, 0xfbbf24];
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      const wsh = new THREE.Shape(); wsh.moveTo(0, 0); wsh.quadraticCurveTo(.4, .5, .6, .15); wsh.quadraticCurveTo(.7, -.15, .3, -.3); wsh.quadraticCurveTo(.1, -.15, 0, 0);
      const wm = new THREE.MeshStandardMaterial({ color: bfCols[i % bfCols.length], roughness: .5, metalness: 0, transparent: true, opacity: .75, side: THREE.DoubleSide });
      const lW = new THREE.Mesh(new THREE.ShapeGeometry(wsh), wm); const rW = new THREE.Mesh(new THREE.ShapeGeometry(wsh), wm.clone()); rW.scale.x = -1;
      g.add(lW); g.add(rW);
      const bo = new THREE.Mesh(new THREE.CylinderGeometry(.025, .018, .4, 8), mat(0x1e1b4b, .8, 0)); bo.rotation.x = Math.PI / 2; g.add(bo);
      g.scale.setScalar(.3); g.position.set((Math.random() - .5) * 12, (Math.random() - .5) * 7, (Math.random() - .5) * 2);
      g.userData = { path: { cx: (Math.random() - .5) * 8, cy: (Math.random() - .5) * 5, rx: 1.2 + Math.random() * 1.5, ry: .6 + Math.random() * .8, phase: Math.random() * Math.PI * 2, speed: .3 + Math.random() * .2 }, flapPhase: Math.random() * Math.PI * 2, lW, rW };
      scene.add(g); butterflies.push(g);
    }

    // Mouse drifting movement influence
    let mx3 = 0, my3 = 0, scrollY3 = window.scrollY;
    document.addEventListener('mousemove', e => {
      mx3 = (e.clientX / window.innerWidth - .5) * 2;
      my3 = (e.clientY / window.innerHeight - .5) * 2;
    });
    window.addEventListener('scroll', () => {
      scrollY3 = window.scrollY;
    });
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const clock = new THREE.Clock();
    function anim() {
      requestAnimationFrame(anim);
      if (document.hidden) return;
      const t = clock.getElapsedTime();

      // Camera drift + parallax
      camera.position.x = mx3 * .4;
      camera.position.y = -my3 * .3 + Math.sin(t * .1) * .15;
      camera.position.z = 8 + Math.sin(t * .06) * .2 - scrollY3 * .0015;
      camera.lookAt(scene.position);

      // Light drifts
      pl1.position.x = Math.sin(t * .4) * 5; pl1.position.y = Math.cos(t * .3) * 3.5;
      pl2.position.x = -Math.sin(t * .3) * 5;

      // Update objects
      brushes.forEach(b => { const p = b.userData.phase + t * b.userData.speed; b.position.x = b.userData.ox + Math.sin(p) * .3 + mx3 * .2; b.position.y = b.userData.oy + Math.cos(p * .6) * .4 + my3 * .2; b.rotation.z = Math.sin(p * .4) * .15 + mx3 * .03; b.rotation.x = Math.cos(p * .3) * .08; });
      tubes.forEach(tb => { const p = tb.userData.phase + t * tb.userData.speed; tb.position.x = tb.userData.ox + Math.cos(p) * .3 + mx3 * .18; tb.position.y = tb.userData.oy + Math.sin(p * .5) * .35 + my3 * .12; tb.rotation.y = t * .4 + tb.userData.phase; tb.rotation.z = Math.sin(p * .35) * .12; });
      pencils.forEach(pc => { const p = pc.userData.phase + t * pc.userData.speed; pc.position.x = pc.userData.ox + Math.sin(p) * .25 + mx3 * .15; pc.position.y = pc.userData.oy + Math.cos(p * .7) * .3 + my3 * .1; pc.rotation.z = Math.sin(p * .45) * .1 + mx3 * .03; });
      books.forEach(bk => { const p = bk.userData.phase + t * bk.userData.speed; bk.position.x = bk.userData.ox + Math.sin(p * .4) * .2 + mx3 * .1; bk.position.y = bk.userData.oy + Math.cos(p * .3) * .25 + my3 * .08; bk.rotation.y = Math.sin(p * .2) * .08; });
      drops.forEach(d => { const p = d.userData.phase + t * d.userData.speed; d.position.x = d.userData.ox + Math.sin(p) * .4 + mx3 * .3; d.position.y = d.userData.oy + Math.cos(p * .6) * .3 + my3 * .2; d.position.z = d.userData.oz + Math.sin(p * .4) * .15; });
      palettes.forEach(pal => { pal.position.x = -4.2 + mx3 * .15; pal.position.y = -2.5 + my3 * .1 + Math.sin(t * .4) * .08; });

      // Particles
      particles.rotation.y = t * .02; particles.rotation.x = t * .01;
      const pa = particles.geometry.attributes.position.array;
      for (let i = 0; i < N; i++) pa[i * 3 + 1] += Math.sin(t + i * .4) * .0008;
      particles.geometry.attributes.position.needsUpdate = true;

      // Petals
      petals.forEach(pe => { pe.position.y -= pe.userData.vy; pe.position.x += pe.userData.vx + Math.sin(t + pe.userData.vy * 80) * .002; pe.rotation.x += pe.userData.vr; pe.rotation.y += pe.userData.vry; pe.rotation.z += pe.userData.vrz; if (pe.position.y < -6) { pe.position.y = 5 + Math.random() * 2; pe.position.x = (Math.random() - .5) * 14; } });

      // Butterflies
      butterflies.forEach(bf => { const pd = bf.userData.path; pd.phase += pd.speed * .01; bf.position.x = pd.cx + Math.cos(pd.phase) * pd.rx + mx3 * .3; bf.position.y = pd.cy + Math.sin(pd.phase) * pd.ry + my3 * .2; bf.rotation.y = Math.atan2(-Math.sin(pd.phase) * pd.ry, -Math.sin(pd.phase) * pd.rx * .5); bf.userData.flapPhase += .16; const fa = Math.sin(bf.userData.flapPhase) * .55; bf.userData.lW.rotation.y = fa; bf.userData.rW.rotation.y = -fa; });

      renderer.render(scene, camera);
    }
    anim();
  }

  // Kickoff on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLivingEnvironment);
  } else {
    initLivingEnvironment();
  }
})();
