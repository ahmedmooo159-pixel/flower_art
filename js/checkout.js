// ==========================================
//  Payment API Configuration
//  Update PAYMENT_API_BASE after Vercel deployment
// ==========================================
const PAYMENT_API_BASE = "https://antigravity-payment.vercel.app";

async function createPayment(data) {
  const response = await fetch(`${PAYMENT_API_BASE}/api/create-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Payment request failed (${response.status})`);
  }

  const result = await response.json();
  return { data: result };
}

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
        <span id="checkout-loading-text">
          <span class="lang-en">Redirecting to payment...</span>
          <span class="lang-ar">جاري الانتقال لبوابة الدفع...</span>
        </span>
      </div>

      <!-- Gateway Selection Label -->
      <div id="checkout-gateway-label" style="margin-top: 1.25rem; margin-bottom: 0.75rem;">
        <label style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">
          <span class="lang-en">Choose Payment Method</span>
          <span class="lang-ar">اختر طريقة الدفع</span>
        </label>
      </div>

      <!-- Gateway Buttons -->
      <div class="checkout-modal-btns" id="checkout-actions" style="flex-direction: column; gap: 0.75rem;">
        <button class="btn btn-primary" id="checkout-pay-paymob" style="width: 100%; padding: 0.85rem 1.5rem; display: flex; align-items: center; justify-content: center; gap: 0.6rem;">
          <i class="fa-solid fa-credit-card"></i>
          <span class="lang-en">Pay with Paymob</span>
          <span class="lang-ar">الدفع عبر Paymob</span>
        </button>
        <button class="btn btn-primary" id="checkout-pay-kashier" style="width: 100%; padding: 0.85rem 1.5rem; display: flex; align-items: center; justify-content: center; gap: 0.6rem; background: linear-gradient(135deg, #1a73e8, #0d47a1);">
          <i class="fa-solid fa-wallet"></i>
          <span class="lang-en">Pay with Kashier</span>
          <span class="lang-ar">الدفع عبر كاشير</span>
        </button>
        <button class="btn btn-secondary" id="checkout-cancel" style="width: 100%; padding: 0.75rem 1.5rem;">
          <span class="lang-en">Cancel</span>
          <span class="lang-ar">إلغاء</span>
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
  const gatewayLabel = overlay.querySelector("#checkout-gateway-label");
  const loading = overlay.querySelector("#checkout-loading");
  const loadingText = overlay.querySelector("#checkout-loading-text");

  overlay.querySelector("#checkout-cancel").onclick = () => {
    overlay.style.opacity = "0";
    overlay.querySelector(".checkout-modal-card").style.transform = "translateY(-20px)";
    setTimeout(() => overlay.remove(), 300);
  };

  // Helper: handle gateway selection
  async function handleGatewayClick(gateway) {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !email) {
      alert(isRTL ? "يرجى ملء جميع الحقول المطلوبة." : "Please fill out all fields.");
      return;
    }

    actions.style.display = "none";
    gatewayLabel.style.display = "none";
    loading.style.display = "flex";

    // Update loading text based on gateway
    const gatewayName = gateway === "kashier" ? "Kashier / كاشير" : "Paymob";
    loadingText.innerHTML = isRTL
      ? `جاري الانتقال لبوابة الدفع ${gatewayName}...`
      : `Redirecting to ${gatewayName}...`;

    try {
      await onConfirm(name, email, gateway);
    } catch (err) {
      alert((isRTL ? "فشل بدء الدفع: " : "Failed to initiate payment: ") + err.message);
      actions.style.display = "flex";
      gatewayLabel.style.display = "block";
      loading.style.display = "none";
    }
  }

  overlay.querySelector("#checkout-pay-paymob").onclick = () => handleGatewayClick("paymob");
  overlay.querySelector("#checkout-pay-kashier").onclick = () => handleGatewayClick("kashier");
}

const handlePurchase = async (courseId, titleEn, titleAr, price) => {
  const isRTL = document.body.classList.contains("rtl");
  const courseTitle = isRTL ? titleAr : titleEn;

  showCheckoutModal(courseTitle, async (name, email, gateway) => {
    const res = await createPayment({
      courseId,
      courseTitle,
      price: Number(price),
      customerEmail: email,
      customerName: name,
      lang: isRTL ? "ar" : "en",
      gateway
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
