* checkout-continue.js — resumes checkout after login.
   Complements auth.js's "paws-checkout-pending" flow.
   No Supabase calls. Must load BEFORE auth.js. */

const FLAG = "paws-continue-checkout";
const MAX_AGE = 10 * 60 * 1000; /* give up after 10 minutes */

function hasStoredSession() {
  try {
    return Object.keys(localStorage).some((key) =>
      key.startsWith("sb-") &&
      key.endsWith("-auth-token") &&
      (localStorage.getItem(key) || "").includes("access_token")
    );
  } catch {
    return false;
  }
}

/* 1. Remember checkout attempts made while signed OUT.
      Registered before auth.js's own checkout guard. */
document.addEventListener("click", (event) => {
  if (!event.target.closest?.("#checkout")) return;
  if (hasStoredSession()) return; /* signed in — normal checkout */
  sessionStorage.setItem(FLAG, String(Date.now()));
}, true);

/* 2. Back on the storefront after logging in: finish the checkout. */
document.addEventListener("DOMContentLoaded", () => {
  const stamped = Number(sessionStorage.getItem(FLAG));
  if (!stamped) return;
  sessionStorage.removeItem(FLAG);
  if (Date.now() - stamped > MAX_AGE) return; /* waited too long */
  if (!hasStoredSession()) return;            /* bailed out of login */

  const cart = JSON.parse(localStorage.getItem("moss-mud-cart") || "{}");
  if (!Object.keys(cart).length) return;      /* nothing to buy */

  const checkoutButton = document.querySelector("#checkout");
  if (!checkoutButton) return;

  const drawer = document.querySelector("#cart-drawer");
  if (drawer) {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
  }
  const toast = document.querySelector("#toast");
  if (toast) {
    toast.textContent = "Welcome back — continuing to checkout…";
    toast.classList.add("show");
  }
  setTimeout(() => {
    if (toast) toast.classList.remove("show");
    checkoutButton.click(); /* auth.js takes over → prompts → PayFast */
  }, 1100);
});
