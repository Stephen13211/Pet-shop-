nav-account.js — signed-in state for storefront nav (desktop + mobile).
   Read-only: never creates sessions, only reflects them.
   Must load AFTER auth.js (uses window.PAWS_DB). */

const ACCOUNT_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
       aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>`;

const ACCOUNT_STYLES = `
  .account-button { display: none; text-decoration: none; }
  .account-button svg { width: 20px; height: 20px; }
  .account-button.is-signed-in::after {
    content: "";
    position: absolute;
    top: 2px; right: 2px;
    width: 10px; height: 10px;
    border-radius: 50%;
    background: var(--green);
    border: 2px solid var(--paper);
  }
  @media (max-width: 800px) {
    .account-button { display: grid; place-items: center; }
  }
`;

function injectAccountButton() {
  const actions = document.querySelector(".nav-actions");
  if (!actions || actions.querySelector(".account-button")) return;
  const link = document.createElement("a");
  link.className = "bag-button account-button"; /* reuses your circle button style */
  link.href = "auth.html";
  link.setAttribute("aria-label", "Your account");
  link.innerHTML = ACCOUNT_ICON;
  actions.prepend(link);
}

async function navIdentity(user) {
  try {
    const { data, error } = await window.PAWS_DB
      .from("profiles")
      .select("full_name,role")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    return {
      name: data.full_name?.trim().split(" ")[0] || "there",
      role: data.role || "customer"
    };
  } catch {
    return {
      name: user.user_metadata?.full_name?.trim().split(" ")[0] || "there",
      role: "customer"
    };
  }
}

async function updateNav() {
  const db = window.PAWS_DB;
  if (!db) return;

  const style = document.createElement("style");
  style.textContent = ACCOUNT_STYLES;
  document.head.appendChild(style);

  injectAccountButton();
  const mobileLink = document.querySelector(".account-button");
  const accountLink = document.querySelector(".nav-links a[href='auth.html']");
  if (!mobileLink && !accountLink) return;

  const { data } = await db.auth.getSession();
  const session = data?.session;
  if (!session) return; /* anonymous — icon defaults to auth.html */
const { name, role } = await navIdentity(session.user);
  const target = role === "admin" ? "admin.html" : "account.html";

  if (mobileLink) {
    mobileLink.href = target;
    mobileLink.classList.add("is-signed-in");
    mobileLink.title = "Hi, " + name;
  }
  if (accountLink) {
    accountLink.textContent = "Hi, " + name;
    accountLink.href = target;

    const signOut = document.createElement("a");
    signOut.href = "#";
    signOut.textContent = "Sign out";
    signOut.addEventListener("click", async (event) => {
      event.preventDefault();
      await db.auth.signOut();
      window.location.href = "index.html";
    });
    accountLink.after(signOut);
  }
}

document.addEventListener("DOMContentLoaded", updateNav);
