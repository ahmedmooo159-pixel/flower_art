// ==========================================
//  FIREBASE SITE BRIDGE — flowerart-9f72b
//  أضفه في كل صفحة عامة قبل </body>:
//  <script type="module" src="js/firebase-site.js"></script>
// ==========================================

import { db } from "./firebase-config.js";
import {
  doc, getDoc,
  collection, getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const PAGE = window.location.pathname.split("/").pop() || "index.html";

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

// ==========================================
//  COLORS — Realtime listener
// ==========================================
function listenColors() {
  onSnapshot(doc(db, "colors", "theme"), snap => {
    if (!snap.exists()) return;
    Object.entries(snap.data()).forEach(([k, v]) => {
      if (k.startsWith("--") && v)
        document.documentElement.style.setProperty(k, v);
    });
  });
}

// ==========================================
//  SETTINGS — Realtime listener
// ==========================================
function listenSettings() {
  onSnapshot(doc(db, "settings", "main"), snap => {
    if (!snap.exists()) return;
    const s = snap.data();
    if (s.telegram) document.querySelectorAll('a[aria-label="Telegram"]').forEach(el => el.href = s.telegram);
    if (s.instagram) document.querySelectorAll('a[aria-label="Instagram"]').forEach(el => el.href = s.instagram);
    if (s.youtube)   document.querySelectorAll('a[aria-label="YouTube"]').forEach(el => el.href = s.youtube);
    // Footer copyright
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
  });
}

// ==========================================
//  PAYMENT METHODS (index.html)
// ==========================================
async function loadPayments() {
  const snap = await getDoc(doc(db, "payments", "config"));
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
}

// ==========================================
//  COURSES (index.html + plans.html)
// ==========================================
async function loadCourses() {
  const snap = await getDocs(collection(db, "courses"));
  if (snap.empty) return;

  const courses = snap.docs.map(d => clean(d.data()));

  document.querySelectorAll(".courses-grid").forEach(grid => {
    grid.innerHTML = "";
    courses.forEach(c => {
      const el = document.createElement("article");
      el.className = "course-card fade-up visible";
      el.setAttribute("data-category", (c.levelEn || "basics").toLowerCase());
      el.innerHTML = `
        <div class="glass-card">
          <div class="course-image">
            <span class="course-badge">
              <span class="lang-en">${c.badgeEn || c.levelEn || ""}</span>
              <span class="lang-ar">${c.badgeAr || c.levelAr || ""}</span>
            </span>
            <img src="${c.image || "assets/artwork-placeholder.jpg"}"
                 alt="${c.titleEn || ""}"
                 onerror="this.src='assets/artwork-placeholder.jpg'">
          </div>
          <div class="course-content">
            <div class="course-meta">
              <span><i class="fa-solid fa-clock"></i> ${c.duration || ""}</span>
              <span><i class="fa-solid fa-layer-group"></i>
                <span class="lang-en">${c.levelEn || ""}</span>
                <span class="lang-ar">${c.levelAr || ""}</span>
              </span>
            </div>
            <h3 class="course-title">
              <span class="lang-en">${c.titleEn || ""}</span>
              <span class="lang-ar">${c.titleAr || ""}</span>
            </h3>
            <p class="course-desc">
              <span class="lang-en">${c.descEn || ""}</span>
              <span class="lang-ar">${c.descAr || ""}</span>
            </p>
            <div class="course-pricing">
              <div>
                <div class="price-label">
                  <span class="lang-en">Price</span>
                  <span class="lang-ar">السعر</span>
                </div>
                <div class="price-value">$${c.price || 0}<span>.00</span></div>
              </div>
            </div>
          </div>
          <div class="course-actions">
            <a href="${c.introUrl || "https://www.instagram.com/reel/DaDKc5vNl44/?igsh=ZDVxamR1YjFwMGEz"}"
               target="_blank" class="btn btn-secondary">
              <span class="lang-en">Intro</span>
              <span class="lang-ar">مقدمة</span>
            </a>
            <a href="thankyou.html" class="btn btn-primary">
              <span class="lang-en">Get Access</span>
              <span class="lang-ar">شراء الدورة</span>
            </a>
          </div>
        </div>`;
      grid.appendChild(el);
    });
    applyLang();
  });
}

// ==========================================
//  REVIEWS (reviews.html)
// ==========================================
async function loadReviews() {
  const snap = await getDocs(collection(db, "reviews"));
  if (snap.empty) return;

  const reviews = snap.docs.map(d => clean(d.data()));
  const grid = document.querySelector(".testimonials-grid");
  if (!grid) return;

  grid.innerHTML = "";
  reviews.forEach(r => {
    const stars = Array(Number(r.rating) || 5)
      .fill('<i class="fa-solid fa-star"></i>').join("");
    const el = document.createElement("article");
    el.className = "glass-card testimonial-card fade-up";
    el.innerHTML = `
      <div class="testimonial-stars">${stars}</div>
      <p class="testimonial-quote">
        <span class="lang-en">"${r.quoteEn || ""}"</span>
        <span class="lang-ar">"${r.quoteAr || ""}"</span>
      </p>
      <div class="testimonial-user">
        <img class="user-avatar" src="assets/instructor.png" alt="${r.name || ""}">
        <div>
          <span class="user-name">${r.name || ""}</span>
          <span class="user-title">
            <span class="lang-en">${r.courseEn || ""}</span>
            <span class="lang-ar">${r.courseAr || ""}</span>
          </span>
        </div>
      </div>`;
    grid.appendChild(el);
  });
  applyLang();
}

// ==========================================
//  FAQ (faq.html)
// ==========================================
async function loadFAQ() {
  const snap = await getDocs(collection(db, "faq"));
  if (snap.empty) return;

  const faqs = snap.docs.map(d => clean(d.data()));
  const list = document.querySelector(".faq-list");
  if (!list) return;

  list.innerHTML = "";
  faqs.forEach(f => {
    const el = document.createElement("div");
    el.className = "faq-item glass-card fade-up";
    el.innerHTML = `
      <button class="faq-trigger" aria-expanded="false">
        <span>
          <span class="lang-en">${f.questionEn || ""}</span>
          <span class="lang-ar">${f.questionAr || ""}</span>
        </span>
        <i class="fa-solid fa-plus faq-icon-indicator"></i>
      </button>
      <div class="faq-panel">
        <div class="faq-content">
          <span class="lang-en">${f.answerEn || ""}</span>
          <span class="lang-ar">${f.answerAr || ""}</span>
        </div>
      </div>`;
    list.appendChild(el);
  });

  // إعادة تشغيل الـ accordion
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
}

// ==========================================
//  ARTWORKS (index.html gallery)
// ==========================================
async function loadArtworks() {
  const snap = await getDocs(collection(db, "artworks"));
  if (snap.empty) return;

  const artworks = snap.docs.map(d => clean(d.data()));
  const gallery  = document.querySelector(".artwork-gallery-grid");
  if (!gallery) return;

  gallery.innerHTML = "";
  artworks.forEach(art => {
    const ratio = (art.ratio || "1/1").replace("/", "-");
    const el = document.createElement("div");
    el.className = `artwork-card fade-up ratio-${ratio}`;
    el.innerHTML = `
      <img src="${art.image || "assets/artwork-placeholder.jpg"}"
           alt="${art.titleEn || ""}"
           onerror="this.src='assets/artwork-placeholder.jpg'">
      <div class="artwork-overlay">
        <span class="artwork-category">
          <span class="lang-en">${art.categoryEn || ""}</span>
          <span class="lang-ar">${art.categoryAr || ""}</span>
        </span>
        <h4 class="artwork-title">
          <span class="lang-en">${art.titleEn || ""}</span>
          <span class="lang-ar">${art.titleAr || ""}</span>
        </h4>
      </div>`;
    gallery.appendChild(el);
  });
  applyLang();
}

// ==========================================
//  INIT
// ==========================================
async function init() {
  listenColors();
  listenSettings();

  if (PAGE === "index.html" || PAGE === "") {
    await Promise.all([loadCourses(), loadArtworks(), loadPayments()]);
  }
  if (PAGE === "plans.html")   await loadCourses();
  if (PAGE === "reviews.html") await loadReviews();
  if (PAGE === "faq.html")     await loadFAQ();
}

init().catch(console.error);
