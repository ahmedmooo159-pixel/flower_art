import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";
import { app } from "./firebase-config.js";

const functions = getFunctions(app);
const createPayment = httpsCallable(functions, "createPayment");

// Inject CSS for checkout modal
const style = document.createElement("style");
style.innerHTML = `
  .checkout-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(7, 7, 13, 0.85);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .checkout-modal-card {
    width: 100%;
    max-width: 420px;
    padding: 2.5rem;
    border-radius: var(--border-radius-md);
    border: 1px solid var(--border-muted);
    background: var(--bg-card);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    text-align: start;
    transform: translateY(-20px);
    transition: transform 0.3s ease;
    position: relative;
  }
  .checkout-modal-title {
    font-family: var(--font-heading-en);
    font-size: 1.4rem;
    color: #fff;
    margin-bottom: 0.5rem;
  }
  body.rtl .checkout-modal-title {
    font-family: var(--font-heading-ar);
    text-align: right;
  }
  .checkout-input-group {
    margin-bottom: 1.25rem;
    text-align: start;
  }
  body.rtl .checkout-input-group {
    text-align: right;
  }
  .checkout-input-group label {
    display: block;
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  .checkout-input {
    width: 100%;
    padding: 0.85rem 1rem;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--border-muted);
    background: rgba(255, 255, 255, 0.03);
    color: #fff;
    font-size: 1rem;
    outline: none;
    transition: var(--transition-fast);
  }
  .checkout-input:focus {
    border-color: var(--accent-blue);
    background: rgba(255, 255, 255, 0.07);
  }
  .checkout-modal-btns {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }
  .checkout-spinner {
    display: none;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: #fff;
    font-size: 1rem;
    margin-top: 1.5rem;
  }
`;
document.head.appendChild(style);

function showCheckoutModal(courseTitle, onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "checkout-modal-overlay";
  overlay.innerHTML = `
    <div class="checkout-modal-card">
      <h3 class="checkout-modal-title">
        <span class="lang-en">Purchase Access</span>
        <span class="lang-ar">شراء الوصول</span>
      </h3>
      <p style="font-size: 0.95rem; margin-bottom: 1.5rem; color: var(--text-secondary); line-height: 1.5;">
        ${courseTitle}
      </p>
      <div class="checkout-input-group">
        <label class="lang-en">Full Name</label>
        <label class="lang-ar">الاسم الكامل</label>
        <input type="text" id="checkout-name" class="checkout-input" required placeholder="John Doe">
      </div>
      <div class="checkout-input-group">
        <label class="lang-en">Email Address</label>
        <label class="lang-ar">البريد الإلكتروني</label>
        <input type="email" id="checkout-email" class="checkout-input" required placeholder="john@example.com">
      </div>
      <div class="checkout-spinner" id="checkout-loading">
        <i class="fa-solid fa-spinner fa-spin" style="color: var(--accent-blue); font-size: 1.25rem;"></i>
        <span class="lang-en">Redirecting to PayTabs...</span>
        <span class="lang-ar">جاري الانتقال لبوابة الدفع...</span>
      </div>
      <div class="checkout-modal-btns" id="checkout-actions">
        <button class="btn btn-secondary" id="checkout-cancel" style="flex: 1; padding: 0.75rem 1.5rem;">
          <span class="lang-en">Cancel</span>
          <span class="lang-ar">إلغاء</span>
        </button>
        <button class="btn btn-primary" id="checkout-submit" style="flex: 1; padding: 0.75rem 1.5rem;">
          <span class="lang-en">Continue</span>
          <span class="lang-ar">استمرار</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.style.opacity = "1";
    overlay.querySelector(".checkout-modal-card").style.transform = "translateY(0)";
  }, 10);

  const isRTL = document.body.classList.contains("rtl");
  if (isRTL) {
    overlay.querySelectorAll(".lang-en").forEach(el => el.style.setProperty("display", "none", "important"));
  } else {
    overlay.querySelectorAll(".lang-ar").forEach(el => el.style.setProperty("display", "none", "important"));
  }

  const nameInput = overlay.querySelector("#checkout-name");
  const emailInput = overlay.querySelector("#checkout-email");
  const actions = overlay.querySelector("#checkout-actions");
  const loading = overlay.querySelector("#checkout-loading");

  overlay.querySelector("#checkout-cancel").onclick = () => {
    overlay.style.opacity = "0";
    overlay.querySelector(".checkout-modal-card").style.transform = "translateY(-20px)";
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.querySelector("#checkout-submit").onclick = async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !email) {
      alert(isRTL ? "يرجى ملء جميع الحقول المطلوبة." : "Please fill out all fields.");
      return;
    }

    actions.style.display = "none";
    loading.style.display = "flex";

    try {
      await onConfirm(name, email);
    } catch (err) {
      alert((isRTL ? "فشل بدء الدفع: " : "Failed to initiate payment: ") + err.message);
      actions.style.display = "flex";
      loading.style.display = "none";
    }
  };
}

const handlePurchase = async (courseId, titleEn, titleAr, price) => {
  const isRTL = document.body.classList.contains("rtl");
  const courseTitle = isRTL ? titleAr : titleEn;

  showCheckoutModal(courseTitle, async (name, email) => {
    const res = await createPayment({
      courseId,
      courseTitle,
      price: Number(price),
      customerEmail: email,
      customerName: name,
      lang: isRTL ? "ar" : "en"
    });

    if (res.data && res.data.redirectUrl) {
      window.location.href = res.data.redirectUrl;
    } else {
      throw new Error("No redirect URL returned by payment function");
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".buy-course-btn");
    if (!btn) return;
    e.preventDefault();

    const courseId = btn.getAttribute("data-course-id");
    const titleEn = btn.getAttribute("data-title-en");
    const titleAr = btn.getAttribute("data-title-ar");
    const price = btn.getAttribute("data-price");

    if (courseId && price) {
      handlePurchase(courseId, titleEn, titleAr, price);
    }
  });
});
