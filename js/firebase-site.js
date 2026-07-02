// ==========================================
//  FIREBASE SITE BRIDGE — flowerart-9f72b
//  Real-time sync: onSnapshot on all collections
//  أضفه في كل صفحة عامة قبل </body>:
//  <script type="module" src="js/firebase-site.js"></script>
// ==========================================

import { db } from "./firebase-config.js";
import {
  doc,
  collection,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const PAGE = window.location.pathname.split("/").pop() || "index.html";

// ─── Unsubscribe registry (prevents memory leaks) ───
const _unsubs = [];
function registerListener(unsub) {
  _unsubs.push(unsub);
}
window.addEventListener("beforeunload", () => {
  _unsubs.forEach(fn => { try { fn(); } catch(e){} });
});

// ─── Helper: apply current language ──────
function applyLang() {
  const lang = localStorage.getItem("antigravity_lang") || "en";
  if (lang === "ar") {
    document.body.classList.add("rtl");
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  } else {
    document.body.classList.remove("rtl");
    document.documentElement.setAttribute("dir", "ltr");
    document.documentElement.setAttribute("lang", "en");
  }
}

// ─── Helper: strip Firestore Timestamp ───
function clean(data) {
  const d = { ...data };
  delete d.updatedAt;
  return d;
}

// ─── Helper: safe HTML escape ────────────
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ==========================================
//  COLORS — Realtime listener
// ==========================================
function listenColors() {
  const unsub = onSnapshot(
    doc(db, "colors", "theme"),
    snap => {
      if (!snap.exists()) return;
      Object.entries(snap.data()).forEach(([k, v]) => {
        if (k.startsWith("--") && v)
          document.documentElement.style.setProperty(k, v);
      });
    },
    err => console.warn("[colors listener]", err.message)
  );
  registerListener(unsub);
}

// ==========================================
//  SETTINGS — Realtime listener
// ==========================================
function listenSettings() {
  const unsub = onSnapshot(
    doc(db, "settings", "main"),
    snap => {
      if (!snap.exists()) return;
      const s = snap.data();
      if (s.telegram) document.querySelectorAll('a[aria-label="Telegram"]').forEach(el => el.href = s.telegram);
      if (s.instagram) document.querySelectorAll('a[aria-label="Instagram"]').forEach(el => el.href = s.instagram);
      if (s.youtube)   document.querySelectorAll('a[aria-label="YouTube"]').forEach(el => el.href = s.youtube);
      if (s.copyrightEn) {
        document.querySelectorAll(".footer-bottom .lang-en").forEach(el => {
          if (el.textContent.includes("©")) el.textContent = s.copyrightEn;
        });
      }
      if (s.copyrightAr) {
        document.querySelectorAll(".footer-bottom .lang-ar").forEach(el => {
          if (el.textContent.includes("©")) el.textContent = s.copyrightAr;
        });
      }
    },
    err => console.warn("[settings listener]", err.message)
  );
  registerListener(unsub);
}

// ==========================================
//  PAYMENT METHODS — Realtime listener
//  (was getDocs, now onSnapshot for instant updates)
// ==========================================
function listenPayments() {
  const unsub = onSnapshot(
    doc(db, "payments", "config"),
    snap => {
      if (!snap.exists()) return;
      const cfg = snap.data();
      const map = {
        bank: "Bank Transfer", mada: "Mada", visa: "Visa",
        apple: "Apple Pay",   stc: "STC",   paypal: "PayPal"
      };
      document.querySelectorAll(".payment-method-card").forEach(card => {
        const txt = card.textContent.trim();
        for (const [key, name] of Object.entries(map)) {
          if (txt.includes(name)) {
            card.style.display = cfg[key] === false ? "none" : "";
          }
        }
      });
    },
    err => console.warn("[payments listener]", err.message)
  );
  registerListener(unsub);
}

// ==========================================
//  COURSES — Realtime listener
//  (was getDocs, now onSnapshot — CRITICAL FIX)
// ==========================================
function buildCourseHTML(c) {
  return `
    <div class="glass-card">
      <div class="course-image">
        <span class="course-badge">
          <span class="lang-en">${esc(c.badgeEn || c.levelEn)}</span>
          <span class="lang-ar">${esc(c.badgeAr || c.levelAr)}</span>
        </span>
        <img src="${esc(c.image || "assets/artwork-placeholder.jpg")}"
             alt="${esc(c.titleEn)}"
             loading="lazy"
             onerror="this.src='assets/artwork-placeholder.jpg'">
      </div>
      <div class="course-content">
        <div class="course-meta">
          <span><i class="fa-solid fa-clock"></i> ${esc(c.duration)}</span>
          <span><i class="fa-solid fa-layer-group"></i>
            <span class="lang-en">${esc(c.levelEn)}</span>
            <span class="lang-ar">${esc(c.levelAr)}</span>
          </span>
        </div>
        <h3 class="course-title">
          <span class="lang-en">${esc(c.titleEn)}</span>
          <span class="lang-ar">${esc(c.titleAr)}</span>
        </h3>
        <p class="course-desc">
          <span class="lang-en">${esc(c.descEn)}</span>
          <span class="lang-ar">${esc(c.descAr)}</span>
        </p>
        <div class="course-pricing">
          <div>
            <div class="price-label">
              <span class="lang-en">Price</span>
              <span class="lang-ar">السعر</span>
            </div>
            <div class="price-value">$${esc(c.price || 0)}<span>.00</span></div>
          </div>
        </div>
      </div>
      <div class="course-actions">
        <a href="${esc(c.introUrl || "https://www.instagram.com/reel/DaDKc5vNl44/?igsh=ZDVxamR1YjFwMGEz")}"
           target="_blank" class="btn btn-secondary">
          <span class="lang-en">Intro</span>
          <span class="lang-ar">مقدمة</span>
        </a>
       <a href="#" class="btn btn-primary buy-course-btn"
   data-course-id="${esc(c.id)}"
   data-price="${esc(c.price || 0)}"
   data-title-en="${esc(c.titleEn)}"
   data-title-ar="${esc(c.titleAr)}">
          <span class="lang-en">Get Access</span>
          <span class="lang-ar">شراء الدورة</span>
        </a>
      </div>
    </div>`;
}

function listenCourses() {
  const grids = document.querySelectorAll(".courses-grid");
  if (!grids.length) return;

  const unsub = onSnapshot(
    collection(db, "courses"),
    snap => {
      if (snap.empty) return; // keep static HTML fallback

      const courses = snap.docs.map(d => clean(d.data()));

      grids.forEach(grid => {
        grid.innerHTML = "";
        courses.forEach(c => {
          const el = document.createElement("article");
          el.className = "course-card fade-up visible";
          el.setAttribute("data-category", (c.levelEn || "basics").toLowerCase());
          el.innerHTML = buildCourseHTML(c);
          grid.appendChild(el);
        });
        applyLang();
      });
    },
    err => console.warn("[courses listener]", err.message)
  );
  registerListener(unsub);
}

// ==========================================
//  REVIEWS — Realtime listener
//  (was getDocs, now onSnapshot — CRITICAL FIX)
// ==========================================
function listenReviews() {
  const grid = document.querySelector(".testimonials-grid");
  if (!grid) return;

  const unsub = onSnapshot(
    collection(db, "reviews"),
    snap => {
      if (snap.empty) return; // keep static HTML fallback

      const reviews = snap.docs.map(d => clean(d.data()));
      grid.innerHTML = "";
      reviews.forEach(r => {
        const stars = Array(Math.min(Math.max(Number(r.rating) || 5, 1), 5))
          .fill('<i class="fa-solid fa-star"></i>').join("");
        const avatarSrc = r.photoUrl ? r.photoUrl : "assets/instructor.png";
        const el = document.createElement("article");
        el.className = "glass-card testimonial-card fade-up visible";
        el.innerHTML = `
          <img class="user-avatar" src="${esc(avatarSrc)}" alt="${esc(r.name)}" loading="lazy">
          <div class="user-details">
            <span class="user-name">${esc(r.name)}</span>
            <span class="user-title">
              <span class="lang-en">${esc(r.courseEn)}</span>
              <span class="lang-ar">${esc(r.courseAr)}</span>
            </span>
          </div>
          <div class="testimonial-stars">${stars}</div>
          <p class="testimonial-quote">
            <span class="lang-en">"${esc(r.quoteEn)}"</span>
            <span class="lang-ar">"${esc(r.quoteAr)}"</span>
          </p>`;
        grid.appendChild(el);
      });
      applyLang();
    },
    err => console.warn("[reviews listener]", err.message)
  );
  registerListener(unsub);
}

// ==========================================
//  FAQ — Realtime listener
//  (was getDocs, now onSnapshot — CRITICAL FIX)
// ==========================================
function listenFAQ() {
  const list = document.querySelector(".faq-list");
  if (!list) return;

  const unsub = onSnapshot(
    collection(db, "faq"),
    snap => {
      if (snap.empty) return; // keep static HTML fallback

      const faqs = snap.docs.map(d => clean(d.data()));
      list.innerHTML = "";
      faqs.forEach(f => {
        const el = document.createElement("div");
        el.className = "faq-item glass-card fade-up visible";
        el.innerHTML = `
          <button class="faq-trigger" aria-expanded="false">
            <span>
              <span class="lang-en">${esc(f.questionEn)}</span>
              <span class="lang-ar">${esc(f.questionAr)}</span>
            </span>
            <i class="fa-solid fa-plus faq-icon-indicator"></i>
          </button>
          <div class="faq-panel">
            <div class="faq-content">
              <span class="lang-en">${esc(f.answerEn)}</span>
              <span class="lang-ar">${esc(f.answerAr)}</span>
            </div>
          </div>`;
        list.appendChild(el);
      });

      // Re-bind accordion after each snapshot update
      list.querySelectorAll(".faq-item").forEach(item => {
        const trigger = item.querySelector(".faq-trigger");
        const panel   = item.querySelector(".faq-panel");
        if (!trigger || !panel) return;
        trigger.addEventListener("click", () => {
          const open = item.classList.contains("active");
          list.querySelectorAll(".faq-item").forEach(o => {
            o.classList.remove("active");
            const p = o.querySelector(".faq-panel");
            if (p) p.style.maxHeight = null;
          });
          if (!open) {
            item.classList.add("active");
            panel.style.maxHeight = panel.scrollHeight + "px";
          }
        });
      });
      applyLang();
    },
    err => console.warn("[faq listener]", err.message)
  );
  registerListener(unsub);
}

// ==========================================
//  ARTWORKS — Realtime listener
//  (was getDocs, now onSnapshot — CRITICAL FIX)
// ==========================================
function listenArtworks() {
  const carousel = document.querySelector("#artwork-carousel");
  if (!carousel) return;

  let isFirstLoad = true;

  const unsub = onSnapshot(
    collection(db, "artworks"),
    snap => {
      if (snap.empty) {
        // No data in Firebase — keep static fallback cards, just init carousel
        if (isFirstLoad && window.initCarousel) {
          window.initCarousel();
          isFirstLoad = false;
        }
        return;
      }

      const artworks = snap.docs.map(d => clean(d.data()));

      // Smooth transition: fade out → replace → fade in
      const doUpdate = () => {
        carousel.innerHTML = "";
        artworks.forEach((art, index) => {
          const el = document.createElement("div");
          el.className = "artwork-carousel-card";
          el.style.setProperty("--index", index);
          el.innerHTML = `
            <div class="glass-card">
              <img src="${esc(art.image || "assets/artwork-placeholder.jpg")}"
                   alt="${esc(art.titleEn)}"
                   loading="lazy"
                   onerror="this.src='assets/artwork-placeholder.jpg'">
              <div class="artwork-overlay">
                <span class="artwork-category">
                  <span class="lang-en">${esc(art.categoryEn)}</span>
                  <span class="lang-ar">${esc(art.categoryAr)}</span>
                </span>
                <h4 class="artwork-title">
                  <span class="lang-en">${esc(art.titleEn)}</span>
                  <span class="lang-ar">${esc(art.titleAr)}</span>
                </h4>
              </div>
            </div>`;
          carousel.appendChild(el);
        });
        applyLang();

        // Clear inline opacity so CSS can take over (fixes mobile display)
        carousel.style.transition = "opacity 0.4s ease";
        carousel.style.opacity = "";

        // Re-initialize carousel AFTER cards are in the DOM
        requestAnimationFrame(() => {
          if (window.initCarousel) window.initCarousel();
        });
      };

      if (isFirstLoad) {
        // First load: fade out placeholder → inject real data
        carousel.style.transition = "opacity 0.3s ease";
        carousel.style.opacity = "0";
        setTimeout(doUpdate, 300);
        isFirstLoad = false;
      } else {
        // Subsequent updates (admin changed something): update smoothly
        carousel.style.transition = "opacity 0.2s ease";
        carousel.style.opacity = "0";
        setTimeout(doUpdate, 200);
      }
    },
    err => console.warn("[artworks listener]", err.message)
  );
  registerListener(unsub);
}

// ==========================================
//  INIT — Start all listeners based on page
// ==========================================
function init() {
  // Always listen to colors and settings on every page
  listenColors();
  listenSettings();

  if (PAGE === "index.html" || PAGE === "") {
    listenCourses();
    listenArtworks();
    listenPayments();
  }

  if (PAGE === "plans.html")   listenCourses();
  if (PAGE === "reviews.html") listenReviews();
  if (PAGE === "faq.html")     listenFAQ();
}

init();
