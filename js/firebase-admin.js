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
//  IMAGE UPLOAD — ImgBB
// ==========================================
const IMGBB_API_KEY = "58ae2ef23658ae0c33a83f35b73b2e7d";

async function uploadImage(file, folder, inputId) {
  const progressWrap = document.getElementById(inputId + "-progress-wrap");
  const progressBar  = document.getElementById(inputId + "-progress");

  if (progressWrap) progressWrap.style.display = "block";
  if (progressBar)  progressBar.style.width = "50%";

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  if (progressWrap) progressWrap.style.display = "none";
  if (progressBar)  progressBar.style.width = "0%";

  if (data.success) {
    return data.data.url;
  } else {
    throw new Error(data.error?.message || "فشل رفع الصورة");
  }
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
  //  COURSE VIDEO UPLOAD & LESSONS MANAGEMENT
  // ==========================================
  let currentCourseLessons = [];
  window.newCourseId = null;

  // Helper to render lessons list
  function renderLessonsList() {
    const listUl = document.getElementById("lessons-list-ul");
    const noLessonsText = document.getElementById("no-lessons-text");
    if (!listUl) return;

    listUl.innerHTML = "";
    
    // Sort lessons by order ascending
    currentCourseLessons.sort((a, b) => Number(a.order) - Number(b.order));

    if (currentCourseLessons.length === 0) {
      if (noLessonsText) noLessonsText.style.display = "block";
    } else {
      if (noLessonsText) noLessonsText.style.display = "none";
      currentCourseLessons.forEach((lesson, index) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.background = "rgba(255,255,255,0.08)";
        li.style.padding = "0.5rem 0.75rem";
        li.style.borderRadius = "6px";
        li.style.fontSize = "0.9rem";
        li.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;">
            <span style="background: var(--accent-primary,#c9748f); color: white; border-radius: 4px; padding: 2px 6px; font-size: 0.75rem; font-weight: bold;">
              #${lesson.order}
            </span>
            <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; flex: 1;">
              ${lesson.title}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <a href="${lesson.videoUrl}" target="_blank" class="btn btn-secondary btn-small" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
              <i class="fa-solid fa-play"></i> Play
            </a>
            <button type="button" class="btn btn-primary btn-small btn-danger delete-lesson-btn" data-index="${index}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        `;
        listUl.appendChild(li);
      });

      // Bind delete button
      listUl.querySelectorAll(".delete-lesson-btn").forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.getAttribute("data-index"));
          currentCourseLessons.splice(idx, 1);
          renderLessonsList();
        };
      });
    }
  }

  // Setup video upload listeners
  const videoFile = document.getElementById("lesson-video-file");
  const videoUploadBtn = document.getElementById("lesson-video-upload-btn");
  const videoFilenameSpan = document.getElementById("lesson-video-filename");
  const videoProgressWrap = document.getElementById("lesson-video-progress-wrap");
  const videoProgress = document.getElementById("lesson-video-progress");
  const videoProgressText = document.getElementById("lesson-video-progress-text");

  if (videoUploadBtn && videoFile) {
    videoUploadBtn.onclick = () => videoFile.click();

    videoFile.onchange = async () => {
      const file = videoFile.files[0];
      if (!file) return;

      const titleInput = document.getElementById("lesson-title-input");
      const orderInput = document.getElementById("lesson-order-input");
      const lessonTitle = titleInput.value.trim() || file.name.substring(0, file.name.lastIndexOf('.')) || "Untitled Lesson";
      const lessonOrder = parseInt(orderInput.value) || 1;

      // 500MB warning
      if (file.size > 500 * 1024 * 1024) {
        const proceed = confirm("Warning: This video is larger than 500MB. Uploading it might take a long time and use a significant amount of your Firebase Storage free-tier space. Do you want to proceed?");
        if (!proceed) {
          videoFile.value = "";
          return;
        }
      }

      // Determine courseId
      const editId = document.getElementById("course-edit-id").value;
      if (!editId && !window.newCourseId) {
        window.newCourseId = Date.now(); // Numeric ID
      }
      const courseId = editId || window.newCourseId;

      videoUploadBtn.disabled = true;
      videoUploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
      videoFilenameSpan.textContent = file.name;
      if (videoProgressWrap) videoProgressWrap.style.display = "block";

      // Safe filename
      const safeName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .replace(/__+/g, "_");

      try {
        const fileRef = ref(storage, `videos/${courseId}/${safeName}`);
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on("state_changed",
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            if (videoProgress) videoProgress.style.width = pct + "%";
            if (videoProgressText) videoProgressText.textContent = pct + "%";
          },
          (error) => {
            console.error("Video upload error:", error);
            toast("❌ Video upload failed: " + error.message, "error");
            resetProgress();
          },
          async () => {
            try {
              const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
              currentCourseLessons.push({
                title: lessonTitle,
                videoUrl,
                order: lessonOrder
              });
              renderLessonsList();
              toast("✅ Lesson video uploaded successfully", "success");
              titleInput.value = "";
              orderInput.value = currentCourseLessons.length + 1;
            } catch (err) {
              console.error("Get download URL error:", err);
              toast("❌ Failed to get video URL", "error");
            } finally {
              resetProgress();
            }
          }
        );
      } catch (err) {
        console.error("Upload initialization error:", err);
        toast("❌ Upload initialization failed", "error");
        resetProgress();
      }
    };
  }

  function resetProgress() {
    if (videoUploadBtn) {
      videoUploadBtn.disabled = false;
      videoUploadBtn.innerHTML = '<i class="fa-solid fa-file-video"></i> Select & Upload Video';
    }
    if (videoFile) videoFile.value = "";
    if (videoFilenameSpan) videoFilenameSpan.textContent = "";
    if (videoProgressWrap) videoProgressWrap.style.display = "none";
    if (videoProgress) videoProgress.style.width = "0%";
    if (videoProgressText) videoProgressText.textContent = "0%";
  }

  // ==========================================
  //  COURSE — save
  // ==========================================
  const _saveCourse = A.saveCourse.bind(A);
  A.saveCourse = async function () {
    const editId = document.getElementById("course-edit-id").value;
    const isNew = !editId;

    // Override Date.now() if we have a pre-generated newCourseId
    const originalDateNow = Date.now;
    if (isNew && window.newCourseId) {
      Date.now = () => window.newCourseId;
    }

    _saveCourse();

    // Restore original Date.now
    Date.now = originalDateNow;

    const courses = A.getData("courses_data", A.defaultCourses);
    const resolvedId = editId || (window.newCourseId ? String(window.newCourseId) : null);
    
    // Find the saved course target
    const target = resolvedId 
      ? courses.find(c => String(c.id) === String(resolvedId))
      : courses[courses.length - 1];

    if (target) {
      target.lessons = currentCourseLessons;
      A.setData("courses_data", courses);
      const ok = await saveDoc(C.COURSES, target.id, target);
      toast(ok ? "✅ تم حفظ الكورس على Firebase" : "❌ فشل حفظ الكورس", ok ? "success" : "error");
    }

    window.newCourseId = null;
    currentCourseLessons = [];
    renderLessonsList();
  };

  // COURSE — delete
  const _deleteCourse = A.deleteCourse.bind(A);
  A.deleteCourse = async function (id) {
    _deleteCourse(id);
    const ok = await delDoc(C.COURSES, id);
    toast(ok ? "✅ تم حذف الكورس من Firebase" : "❌ فشل الحذف", ok ? "success" : "error");
  };

  // Hook resetCourseForm & editCourse to manage lessons list state
  const _resetCourseForm = A.resetCourseForm.bind(A);
  A.resetCourseForm = function () {
    _resetCourseForm();
    window.newCourseId = null;
    currentCourseLessons = [];
    renderLessonsList();
    resetProgress();
  };

  const _editCourse = A.editCourse.bind(A);
  A.editCourse = function (id) {
    _editCourse(id);
    const courses = A.getData("courses_data", A.defaultCourses);
    const c = courses.find(item => item.id === id);
    if (c) {
      currentCourseLessons = c.lessons || [];
      renderLessonsList();
    }
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

  A.loadReviewsPanel = function () {
    const reviews = this.getData('reviews_data', this.defaultReviews);
    const tbody = document.querySelector('#reviews-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    reviews.forEach((r, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><strong>${r.name}</strong></td>
        <td>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
        <td>
          ${r.courseEn}<br>
          <small class="text-muted">${r.courseAr}</small>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${r.photoUrl ? `<img src="${r.photoUrl}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-muted);" />` : ''}
            <button class="btn btn-secondary btn-small upload-photo-btn" data-id="${r.id}">
              <i class="fa-solid fa-upload"></i>
              <span class="lang-en">Upload Photo</span>
              <span class="lang-ar">رفع صورة</span>
            </button>
            <button class="btn btn-primary btn-small btn-danger delete-review-btn" data-id="${r.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.upload-photo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          btn.disabled = true;
          const fileRef = ref(storage, `reviews/${id}/photo.jpg`);
          const uploadTask = uploadBytesResumable(fileRef, file);

          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading... ${progress}%`;
            },
            (error) => {
              console.error("Upload error:", error);
              toast("❌ Upload failed: " + error.message, "error");
              btn.disabled = false;
              btn.innerHTML = `<i class="fa-solid fa-upload"></i> <span class="lang-en">Upload Photo</span><span class="lang-ar">رفع صورة</span>`;
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                await saveDoc(C.REVIEWS, id, { photoUrl: downloadURL });

                const currentReviews = A.getData('reviews_data', A.defaultReviews);
                const item = currentReviews.find(x => String(x.id) === String(id));
                if (item) {
                  item.photoUrl = downloadURL;
                  A.setData('reviews_data', currentReviews);
                }

                toast("✓ Photo uploaded", "success");
                A.loadReviewsPanel();
              } catch (err) {
                console.error("Save URL error:", err);
                toast("❌ Failed to save photo URL", "error");
              } finally {
                btn.disabled = false;
                btn.innerHTML = `<i class="fa-solid fa-upload"></i> <span class="lang-en">Upload Photo</span><span class="lang-ar">رفع صورة</span>`;
              }
            }
          );
        };
        fileInput.click();
      });
    });

    document.querySelectorAll('.delete-review-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        this.deleteReview(id);
      });
    });

    const form = document.getElementById('reviews-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        this.saveReview();
      };
    }
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
