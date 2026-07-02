// ==========================================
//  Resend Email Helper
//  Sends transactional course-access emails
//  via the Resend REST API (no SDK needed).
// ==========================================

const config = require("./config");
const logger = require("./logger");

function buildAccessEmailHtml({ customerName, courseTitle, driveLink, channelLink, filePassword, telegramFallback, lang }) {
  const isAr = lang === "ar";

  const greeting = isAr ? `أهلاً ${customerName} 👋` : `Hi ${customerName} 👋`;
  const intro = isAr
    ? `شكرًا لشرائك <strong>${courseTitle}</strong>! تفاصيل الوصول للدورة تحت.`
    : `Thank you for purchasing <strong>${courseTitle}</strong>! Your access details are below.`;

  const rows = [];
  if (driveLink) {
    rows.push(
      isAr
        ? `<p>📁 <strong>رابط ملفات الدورة:</strong> <a href="${driveLink}">${driveLink}</a></p>`
        : `<p>📁 <strong>Course files:</strong> <a href="${driveLink}">${driveLink}</a></p>`
    );
  }
  if (channelLink) {
    rows.push(
      isAr
        ? `<p>💬 <strong>قناة تليجرام الخاصة:</strong> <a href="${channelLink}">${channelLink}</a></p>`
        : `<p>💬 <strong>Private Telegram channel:</strong> <a href="${channelLink}">${channelLink}</a></p>`
    );
  }
  if (filePassword) {
    rows.push(
      isAr
        ? `<p>🔑 <strong>باسورد الملفات:</strong> ${filePassword}</p>`
        : `<p>🔑 <strong>Files password:</strong> ${filePassword}</p>`
    );
  }

  // Fallback if the course has no direct access data attached yet
  if (!rows.length && telegramFallback) {
    rows.push(
      isAr
        ? `<p>هنبعتلك تفاصيل الوصول قريبًا. لو محتاج مساعدة فورية، تواصل معنا: <a href="${telegramFallback}">${telegramFallback}</a></p>`
        : `<p>We'll send your access details shortly. Need help now? Reach us: <a href="${telegramFallback}">${telegramFallback}</a></p>`
    );
  }

  return `
    <div dir="${isAr ? "rtl" : "ltr"}" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #222; line-height: 1.6;">
      <h2>${greeting}</h2>
      <p>${intro}</p>
      ${rows.join("\n")}
      <p style="margin-top: 2rem; color: #888; font-size: 0.85rem;">Tecture Art by Fatma</p>
    </div>
  `;
}

async function sendCourseAccessEmail({ toEmail, customerName, courseTitle, driveLink, channelLink, filePassword, telegramFallback, lang }) {
  if (!config.resendApiKey) {
    logger.warn("RESEND_API_KEY not configured — skipping email send");
    return { skipped: true };
  }
  if (!toEmail) {
    logger.warn("sendCourseAccessEmail called without a recipient email");
    return { skipped: true };
  }

  const subject = lang === "ar"
    ? `تفاصيل الوصول لدورة ${courseTitle}`
    : `Your access details for ${courseTitle}`;

  const html = buildAccessEmailHtml({ customerName, courseTitle, driveLink, channelLink, filePassword, telegramFallback, lang });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: config.resendFromEmail,
        to: [toEmail],
        subject,
        html
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      logger.error("Resend send failed", { status: res.status, data });
      return { success: false, error: data };
    }

    logger.info("Confirmation email sent", { toEmail, id: data.id });
    return { success: true, id: data.id };
  } catch (err) {
    logger.error("Resend request threw an error", { message: err.message });
    return { success: false, error: err.message };
  }
}

module.exports = { sendCourseAccessEmail };
