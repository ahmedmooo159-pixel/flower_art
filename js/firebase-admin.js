// ==========================================
//  FIREBASE ADMIN BRIDGE — flower-5f122
//  أضفه في admin.html قبل </body>:
//  <script type="module" src="js/firebase-admin.js"></script>
// ==========================================

import { db, storage } from "./firebase-config.js";
import {
  doc, setDoc, getDoc,
  collection, getDocs,
  deleteDoc, onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  ref, uploadBytesResumable, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

// ==========================================
//  IMAGE UPLOAD — Firebase Storage
// ==========================================
async function uploadImage(file, folder, inputId) {
  const progressWrap = document.getElementById(inputId + "-progress-wrap");
  const progressBar  = document.getElementById(inputId + "-progress");
  const btn          = document.getElementById(inputId + "-upload-btn");

  return new Promise((resolve, reject) => {
    const fileName  = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    if (progressWrap) progressWrap.style.display = "block";

    uploadTask.on("state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (progressBar) progressBar.style.width = pct + "%";
      },
      (error) => {
        if (progressWrap) progressWrap.style.display = "none";
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        if (progressWrap) progressWrap.style.display = "none";
        if (progressBar)  progressBar.style.width = "0%";
        resolve(url);
      }
    );
  });
}

function wireUploadButton(inputId, folder) {
  const btn       = document.getElementById(inputId + "-upload-btn");
  const fileInput = document.getElementById(inputId + "-file");
  const textInput = document.getElementById(inputId);
  if (!btn || !fileInput || !textInput) return;

  btn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الرفع...';
    try {
      const url = await uploadImage(file, folder, inputId);
      textInput.value = url;
      toast("✅ تم رفع الصورة بنجاح", "success");
    } catch (e) {
      toast("❌ فشل رفع الصورة: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-upload"></i> رفع صورة';
      fileInput.value = "";
    }
  });
}

// ─── Collection names ───────────────────
const C = {
  ARTWORKS : "artworks",
  COURSES  : "courses",
  REVIEWS  : "reviews",
  FAQ      : "faq",
  SETTINGS : "settings",
  PAYMENTS : "payments",
  COLORS   : "colors",
};

// ─── Toast helper ────────────────────────
function toast(msg, type = "success") {
  if (window.AdminApp?.showToast) window.AdminApp.showToast(msg, type);
  else console.log(`[${type}]`, msg);
}

// ─── Generic save ────────────────────────
async function saveDoc(col, id, data) {
  // حذف حقل updatedAt من البيانات لو موجود عشان مشاكل الـ serverTimestamp
  const clean = { ...data };
  delete clean.updatedAt;
  try {
    await setDoc(doc(db, col, String(id)), {
      ...clean,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (e) {
    console.error("saveDoc:", e);
    return false;
  }
}

// ─── Delete helper ───────────────────────
async function delDoc(col, id) {
  try {
    await deleteDoc(doc(db, col, String(id)));
    return true;
  } catch (e) {
    console.error("delDoc:", e);
    return false;
  }
}

// ==========================================
//  LOAD Firebase → localStorage  (عند فتح الأدمن)
// ==========================================
async function pullFromFirebase() {
  try {
    const loaders = [
      { col: C.ARTWORKS,  key: "artworks_data",           many: true  },
      { col: C.COURSES,   key: "courses_data",            many: true  },
      { col: C.REVIEWS,   key: "reviews_data",            many: true  },
      { col: C.FAQ,       key: "faq_data",                many: true  },
      { col: C.SETTINGS,  key: "site_settings",           many: false, id: "main"   },
      { col: C.PAYMENTS,  key: "payment_methods_config",  many: false, id: "config" },
      { col: C.COLORS,    key: "custom_colors",           many: false, id: "theme"  },
    ];

    await Promise.all(loaders.map(async ({ col, key, many, id }) => {
      if (many) {
        const snap = await getDocs(collection(db, col));
        if (!snap.empty) {
          const data = snap.docs.map(d => {
            const d2 = { ...d.data() };
            delete d2.updatedAt; // Timestamp object مش JSON-safe
            return d2;
          });
          localStorage.setItem(key, JSON.stringify(data));
        }
      } else {
        const snap = await getDoc(doc(db, col, id));
        if (snap.exists()) {
          const d2 = { ...snap.data() };
          delete d2.updatedAt;
          localStorage.setItem(key, JSON.stringify(d2));
        }
      }
    }));

    console.log("✅ Firebase → localStorage sync done");
    return true;
  } catch (e) {
    console.error("pullFromFirebase:", e);
    return false;
  }
}

// ==========================================
//  PATCH AdminApp after DOMContentLoaded
// ==========================================
window.addEventListener("DOMContentLoaded", async () => {

  // انتظر AdminApp يبدأ
  await new Promise(r => setTimeout(r, 800));

  const A = window.AdminApp;
  if (!A) { console.warn("AdminApp not found"); return; }

  // ── مزامنة أوّلية ──────────────────────
  const synced = await pullFromFirebase();
  if (synced) {
    A.loadAllPanels();
    A.renderOverviewPanel();
  }

  // ── ربط أزرار رفع الصور ──────────────────
  wireUploadButton("gallery-image", "artworks");
  wireUploadButton("course-image",  "courses");

  // ==========================================
  //  ARTWORK — save
  // ==========================================
  const _saveArtwork = A.saveArtwork.bind(A);
  A.saveArtwork = async function () {
    _saveArtwork();
    const arts = A.getData("artworks_data", A.defaultArtworks);

    // هل كنا في edit mode؟
    const editId = document.getElementById("gallery-edit-id").value;
    const target = editId
      ? arts.find(a => String(a.id) === String(editId))
      : arts[arts.length - 1];

    if (target) {
      const ok = await saveDoc(C.ARTWORKS, target.id, target);
      toast(ok ? "✅ تم حفظ اللوحة على Firebase" : "❌ فشل حفظ اللوحة", ok ? "success" : "error");
    }
  };

  // ARTWORK — delete
  const _deleteArtwork = A.deleteArtwork.bind(A);
  A.deleteArtwork = async function (id) {
    _deleteArtwork(id);
    const ok = await delDoc(C.ARTWORKS, id);
    toast(ok ? "✅ تم حذف اللوحة من Firebase" : "❌ فشل الحذف", ok ? "success" : "error");
  };

  // ==========================================
  //  COURSE — save
  // ==========================================
  const _saveCourse = A.saveCourse.bind(A);
  A.saveCourse = async function () {
    _saveCourse();
    const courses = A.getData("courses_data", A.defaultCourses);

    const editId = document.getElementById("course-edit-id").value;
    const target = editId
      ? courses.find(c => String(c.id) === String(editId))
      : courses[courses.length - 1];

    if (target) {
      const ok = await saveDoc(C.COURSES, target.id, target);
      toast(ok ? "✅ تم حفظ الكورس على Firebase" : "❌ فشل حفظ الكورس", ok ? "success" : "error");
    }
  };

  // COURSE — delete
  const _deleteCourse = A.deleteCourse.bind(A);
  A.deleteCourse = async function (id) {
    _deleteCourse(id);
    const ok = await delDoc(C.COURSES, id);
    toast(ok ? "✅ تم حذف الكورس من Firebase" : "❌ فشل الحذف", ok ? "success" : "error");
  };

  // ==========================================
  //  REVIEW — save / delete
  // ==========================================
  const _saveReview = A.saveReview.bind(A);
  A.saveReview = async function () {
    _saveReview();
    const reviews = A.getData("reviews_data", A.defaultReviews);
    const last = reviews[reviews.length - 1];
    if (last) {
      const ok = await saveDoc(C.REVIEWS, last.id, last);
      toast(ok ? "✅ تم حفظ التقييم على Firebase" : "❌ فشل", ok ? "success" : "error");
    }
  };

  const _deleteReview = A.deleteReview.bind(A);
  A.deleteReview = async function (id) {
    _deleteReview(id);
    const ok = await delDoc(C.REVIEWS, id);
    toast(ok ? "✅ تم حذف التقييم من Firebase" : "❌ فشل الحذف", ok ? "success" : "error");
  };

  // ==========================================
  //  FAQ — save / delete
  // ==========================================
  const _saveFAQ = A.saveFAQ.bind(A);
  A.saveFAQ = async function () {
    _saveFAQ();
    const faqs = A.getData("faq_data", A.defaultFaqs);
    const last = faqs[faqs.length - 1];
    if (last) {
      const ok = await saveDoc(C.FAQ, last.id, last);
      toast(ok ? "✅ تم حفظ السؤال على Firebase" : "❌ فشل", ok ? "success" : "error");
    }
  };

  const _deleteFAQ = A.deleteFAQ.bind(A);
  A.deleteFAQ = async function (id) {
    _deleteFAQ(id);
    const ok = await delDoc(C.FAQ, id);
    toast(ok ? "✅ تم حذف السؤال من Firebase" : "❌ فشل الحذف", ok ? "success" : "error");
  };

  // ==========================================
  //  SETTINGS FORM
  // ==========================================
  document.getElementById("settings-form")?.addEventListener("submit", async () => {
    await new Promise(r => setTimeout(r, 150));
    const settings = A.getData("site_settings", {});
    const ok = await saveDoc(C.SETTINGS, "main", settings);
    toast(ok ? "✅ تم حفظ الإعدادات على Firebase" : "❌ فشل الحفظ", ok ? "success" : "error");
  });

  // ==========================================
  //  PAYMENT CONFIG
  // ==========================================
  document.getElementById("save-payments-btn")?.addEventListener("click", async () => {
    await new Promise(r => setTimeout(r, 150));
    const config = A.getData("payment_methods_config", {});
    const ok = await saveDoc(C.PAYMENTS, "config", config);
    toast(ok ? "✅ تم حفظ الدفع على Firebase" : "❌ فشل الحفظ", ok ? "success" : "error");
  });

  // ==========================================
  //  COLORS
  // ==========================================
  document.getElementById("preview-colors-btn")?.addEventListener("click", async () => {
    await new Promise(r => setTimeout(r, 150));
    const colors = A.getData("custom_colors", {});
    const ok = await saveDoc(C.COLORS, "theme", colors);
    toast(ok ? "✅ تم حفظ الألوان على Firebase" : "❌ فشل الحفظ", ok ? "success" : "error");
  });

  console.log("✅ Firebase Admin Bridge ready");
});
