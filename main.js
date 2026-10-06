/*
  ============================================================
  SUPABASE EDGE FUNCTION URL CONFIGURATION
  ============================================================
  Paste your deployed Supabase Edge Function URL inside the quotes below:
  Example:
  const WAITLIST_ENDPOINT = "https://<your-project-ref>.supabase.co/functions/v1/waitlist";

  Leave as empty string "" until the Edge Function is deployed.
  DO NOT put any private keys, database passwords, or service-role keys here.
  ============================================================
*/
const WAITLIST_ENDPOINT = "https://ogrqrpdaqbwpmvokbbjv.supabase.co/functions/v1/waitlist";

/* ── DOM Elements ─────────────────────────────────────────── */
const form = document.getElementById("waitlist");
const emailInput = document.getElementById("email");
const submitBtn = document.getElementById("submit-btn");
const formMessage = document.getElementById("form-message");
const successState = document.getElementById("success-state");

/* ── State ────────────────────────────────────────────────── */
let isSubmitting = false;

/* ── Helpers ──────────────────────────────────────────────── */

/** Basic RFC-5322 email regex */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showMessage(text, isError) {
  if (!formMessage) return;
  formMessage.textContent = text;
  formMessage.style.color = isError ? "#ff6b6b" : "#4ade80";
}

function clearMessage() {
  if (!formMessage) return;
  formMessage.textContent = "";
  formMessage.style.color = "";
}

function setLoading(loading) {
  if (emailInput) emailInput.disabled = loading;
  if (submitBtn) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? "Joining…" : "Join the Waitlist";
  }
}

function showSuccess() {
  if (form) form.hidden = true;
  if (successState) successState.hidden = false;
}

/* ── Supabase Edge Function API Call ──────────────────────── */

/**
 * Sends POST request to the Supabase Edge Function
 * Headers: Content-Type: application/json
 * Body: { "email": normalizedEmail }
 */
async function subscribeToWaitlist(normalizedEmail) {
  if (!WAITLIST_ENDPOINT || WAITLIST_ENDPOINT.trim() === "") {
    throw new Error("NOT_CONFIGURED");
  }

  let res;
  try {
    res = await fetch(WAITLIST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: normalizedEmail }),
    });
  } catch (networkErr) {
    console.error("Network or CORS error:", networkErr);
    throw new Error("NETWORK_ERROR");
  }

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // Response might not be JSON (e.g. plain text or empty 204)
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || "";
    const errorCode = data?.code || "";

    // 409 Conflict or PostgreSQL 23505 (unique_violation)
    if (
      res.status === 409 ||
      errorCode === "23505" ||
      /already|duplicate|unique/i.test(errorMsg)
    ) {
      throw new Error("DUPLICATE");
    }

    // 400 Bad Request / Validation error from Edge Function
    if (res.status === 400) {
      throw new Error(errorMsg || "VALIDATION_ERROR");
    }

    throw new Error(errorMsg || "SERVER_ERROR");
  }

  return data;
}

/* ── Form Submission Handler ──────────────────────────────── */

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Prevent duplicate clicks while submitting
  if (isSubmitting) return;

  // 1. Normalize email (trim whitespace + lowercase)
  const rawEmail = emailInput?.value || "";
  const normalizedEmail = rawEmail.trim().toLowerCase();

  // 2. Client-side validation
  if (!normalizedEmail) {
    showMessage("Please enter your email address.", true);
    emailInput?.focus();
    return;
  }

  if (!isValidEmail(normalizedEmail)) {
    showMessage("Please enter a valid email address.", true);
    emailInput?.focus();
    return;
  }

  // 3. Submitting state
  isSubmitting = true;
  clearMessage();
  setLoading(true);

  try {
    await subscribeToWaitlist(normalizedEmail);
    // 4. Success state
    showSuccess();
  } catch (err) {
    const code = err.message;

    if (code === "NOT_CONFIGURED") {
      showMessage(
        "The waitlist backend is currently being connected. Please check back shortly!",
        true
      );
    } else if (code === "DUPLICATE") {
      // Duplicate state
      showMessage("You're already on the waitlist!", false);
    } else if (code === "VALIDATION_ERROR") {
      // Server-side validation error
      showMessage("Please enter a valid email address.", true);
      emailInput?.focus();
    } else if (code === "NETWORK_ERROR") {
      // Network error state
      showMessage("Unable to connect. Please check your internet connection and try again.", true);
    } else {
      // Generic server error state
      console.error("Waitlist error:", err);
      showMessage("Something went wrong. Please try again in a moment.", true);
    }

    setLoading(false);
    isSubmitting = false;
  }
});

/* ── Mobile menu ──────────────────────────────────────────── */

const burger = document.querySelector(".burger");
const mobileMenu = document.getElementById("mobile-menu");
const mobileOverlay = document.querySelector(".mobile-overlay");

function setMenu(open) {
  document.body.classList.toggle("menu-open", open);
  burger?.setAttribute("aria-expanded", String(open));
  burger?.setAttribute("aria-label", open ? "Close menu" : "Open menu");

  if (mobileMenu) mobileMenu.hidden = !open;
  if (mobileOverlay) mobileOverlay.hidden = !open;
}

burger?.addEventListener("click", () => {
  setMenu(!document.body.classList.contains("menu-open"));
});

mobileOverlay?.addEventListener("click", () => setMenu(false));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

document.querySelectorAll(".mobile-link, .mobile-sign-in").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 720) setMenu(false);
});
