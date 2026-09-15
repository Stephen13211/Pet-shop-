
const pawsConfig =
  window.PETSHOP_CONFIG || {};

const pawsDb =
  window.supabase.createClient(
    pawsConfig.supabaseUrl,
    pawsConfig.supabasePublishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

window.PAWS_DB = pawsDb;


/* =========================================================
   GENERAL AUTH HELPERS
   ========================================================= */

function authMessage(
  message,
  selector = "#auth-message"
) {
  const element =
    document.querySelector(selector);

  if (element) {
    element.textContent = message;
  }
}


async function getCurrentUser() {
  const result =
    await pawsDb.auth.getUser();

  if (result.error) {
    throw result.error;
  }

  return result.data.user;
}


async function getProfile(userId) {
  const result =
    await pawsDb
      .from("profiles")
      .select("id,full_name,phone,role")
      .eq("id", userId)
      .single();

  if (result.error) {
    throw result.error;
  }

  return result.data;
}


/* =========================================================
   LOGIN REDIRECT
   ========================================================= */

async function redirectAfterLogin(user) {

  let profile = null;

  try {
    profile =
      await getProfile(user.id);
  } catch (error) {
    console.warn(
      "Profile could not be loaded:",
      error.message
    );
  }

  if (profile?.role === "admin") {

    window.location.href =
      "admin.html";

    return;
  }

  const checkoutPending =
    sessionStorage.getItem(
      "paws-checkout-pending"
    );

  if (checkoutPending === "true") {

    sessionStorage.removeItem(
      "paws-checkout-pending"
    );

    window.location.href =
      "index.html";

    return;
  }

  window.location.href =
    "account.html";
}


/* =========================================================
   AUTH PAGE
   ========================================================= */

async function setupAuthPage() {

  const form =
    document.querySelector(
      "#auth-form"
    );

  if (!form) return;

  let signInMode = false;

  const nameField =
    document.querySelector(
      "#name-field"
    );

  const submitButton =
    document.querySelector(
      "#auth-submit"
    );

  const toggleButton =
    document.querySelector(
      "#toggle-auth"
    );

  const forgotButton =
    document.querySelector(
      "#forgot-password"
    );


  /* -------------------------------------------------------
     TOGGLE SIGN IN / CREATE ACCOUNT
     ------------------------------------------------------- */

  toggleButton?.addEventListener(
    "click",
    () => {

      signInMode =
        !signInMode;

      if (nameField) {

        nameField.style.display =
          signInMode
            ? "none"
            : "grid";
      }

      if (submitButton) {

        submitButton.textContent =
          signInMode
            ? "Sign in"
            : "Create account";
      }

      if (toggleButton) {

        toggleButton.textContent =
          signInMode
            ? "Need an account? Create one"
            : "Already have an account? Sign in";
      }

    }
  );


  /* -------------------------------------------------------
     FORGOT PASSWORD
     ------------------------------------------------------- */

  forgotButton?.addEventListener(
    "click",
    async () => {

      const email =
        form.email.value.trim();

      if (!email) {

        authMessage(
          "Enter your email address first."
        );

        return;
      }

      try {

        const result =
          await pawsDb.auth.resetPasswordForEmail(
            email,
            {
              redirectTo:
                `${window.location.origin}${window.location.pathname.replace(
                  "auth.html",
                  "account.html"
                )}`
            }
          );

        if (result.error) {

          authMessage(
            result.error.message
          );

        } else {

          authMessage(
            "If that email exists, a password reset link has been sent."
          );

        }

      } catch (error) {

        authMessage(
          error.message ||
          "Unable to send password reset email."
        );

      }

    }
  );


  /* -------------------------------------------------------
     SIGN IN / CREATE ACCOUNT
     ------------------------------------------------------- */

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        form.email.value.trim();

      const password =
        form.password.value;

      if (!email || !password) {

        authMessage(
          "Please enter your email and password."
        );

        return;
      }

      submitButton.disabled =
        true;

      authMessage(
        "Please wait..."
      );

      try {

        /* =================================================
           SIGN IN
           ================================================= */

        if (signInMode) {

          const result =
            await pawsDb.auth.signInWithPassword(
              {
                email,
                password
              }
            );

          if (result.error) {
            throw result.error;
          }

          if (!result.data?.user) {

            throw new Error(
              "Sign in completed, but no user session was returned."
            );
          }

          await redirectAfterLogin(
            result.data.user
          );

          return;
        }


        /* =================================================
           CREATE ACCOUNT
           ================================================= */

        const result =
          await pawsDb.auth.signUp(
            {
              email,
              password,

              options: {

                data: {
                  full_name:
                    form.fullName.value.trim()
                },

                emailRedirectTo:
                  `${window.location.origin}${window.location.pathname.replace(
                    "auth.html",
                    "account.html"
                  )}`
              }
            }
          );

        if (result.error) {
          throw result.error;
        }

        if (result.data?.session) {

          await redirectAfterLogin(
            result.data.user
          );

        } else {

          authMessage(
            "Account created. Check your email to confirm your account."
          );

        }

      } catch (error) {

        console.error(
          "Authentication error:",
          error
        );

        authMessage(
          error.message ||
          "Unable to complete this request."
        );

      } finally {

        submitButton.disabled =
          false;
      }

    }
  );
}


/* =========================================================
   CUSTOMER ACCOUNT PAGE
   ========================================================= */

async function setupAccountPage() {

  const ordersList =
    document.querySelector(
      "#orders-list"
    );

  if (!ordersList) return;

  try {

    const user =
      await getCurrentUser();

    if (!user) {

      throw new Error(
        "Please sign in to view your account."
      );
    }

    let profile = null;

    try {

      profile =
        await getProfile(user.id);

    } catch (error) {

      console.warn(
        "Could not load profile:",
        error.message
      );

    }


    document.querySelector(
      "#account-name"
    ).textContent =
      profile?.full_name
        ?.split(" ")[0] ||
      user.user_metadata
        ?.full_name
        ?.split(" ")[0] ||
      "friend";


    document.querySelector(
      "#profile-name"
    ).value =
      profile?.full_name ||
      user.user_metadata?.full_name ||
      "";


    document.querySelector(
      "#profile-phone"
    ).value =
      profile?.phone ||
      "";


    /* -----------------------------------------------------
       LOAD CUSTOMER ORDERS
       ----------------------------------------------------- */

    const ordersResult =
      await pawsDb
        .from("orders")
        .select(
          "id,status,amount_zar,created_at,items"
        )
        .eq(
          "user_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (ordersResult.error) {
      throw ordersResult.error;
    }


    if (!ordersResult.data?.length) {

      ordersList.innerHTML =
        `<p class="auth-message">You have no orders yet.</p>`;

    } else {

      ordersList.innerHTML =
        ordersResult.data
          .map(
            (order) => {

              const items =
                Array.isArray(order.items)
                  ? order.items
                  : [];

              const itemText =
                items
                  .map(
                    (item) => {

                      const quantity =
                        Number(
                          item.quantity
                        ) || 1;

                      return `${item.name || "Product"} × ${quantity}`;

                    }
                  )
                  .join(", ");


              const status =
                String(
                  order.status ||
                  "pending"
                );


              return `
                <div class="data-row">

                  <strong>
                    Order ${order.id
                      .slice(0, 8)
                      .toUpperCase()}
                  </strong>

                  <span class="pill">
                    ${status}
                  </span>

                  <small>
                    ${new Date(
                      order.created_at
                    ).toLocaleDateString()}
                    · R${Number(
                      order.amount_zar
                    ).toFixed(2)}
                  </small>

                  <small>
                    ${itemText || "Order details"}
                  </small>

                </div>
              `;

            }
          )
          .join("");
    }


    /* -----------------------------------------------------
       SAVE PROFILE
       ----------------------------------------------------- */

    document
      .querySelector(
        "#profile-form"
      )
      ?.addEventListener(
        "submit",
        async (event) => {

          event.preventDefault();

          const result =
            await pawsDb
              .from("profiles")
              .update({

                full_name:
                  event.target.fullName.value.trim(),

                phone:
                  event.target.phone.value.trim()

              })
              .eq(
                "id",
                user.id
              );

          authMessage(
            result.error
              ? result.error.message
              : "Profile saved.",
            "#profile-message"
          );

        }
      );


    /* -----------------------------------------------------
       SIGN OUT
       ----------------------------------------------------- */

    document
      .querySelector(
        "#sign-out"
      )
      ?.addEventListener(
        "click",
        async () => {

          await pawsDb.auth.signOut();

          window.location.href =
            "index.html";

        }
      );

  } catch (error) {

    ordersList.innerHTML = `
      <p class="auth-message">
        ${error.message}
        <a href="auth.html">Sign in</a>
      </p>
    `;

  }
}


/* =========================================================
   ADMIN PAGE
   ========================================================= */

async function setupAdminPage() {

  const productsList =
    document.querySelector(
      "#admin-products"
    );

  if (!productsList) return;

  try {

    const user =
      await getCurrentUser();

    if (!user) {

      throw new Error(
        "Please sign in."
      );
    }

    const profile =
      await getProfile(user.id);

    if (profile.role !== "admin") {

      throw new Error(
        "Admin access required."
      );
    }

    await renderAdminProducts();

    await renderAdminOrders();


    /* -----------------------------------------------------
       ADMIN SIGN OUT
       ----------------------------------------------------- */

    document
      .querySelector(
        "#admin-sign-out"
      )
      ?.addEventListener(
        "click",
        async () => {

          await pawsDb.auth.signOut();

          window.location.href =
            "index.html";

        }
      );


    /* -----------------------------------------------------
       ADD PRODUCT
       ----------------------------------------------------- */

    document
      .querySelector(
        "#product-form"
      )
      ?.addEventListener(
        "submit",
        async (event) => {

          event.preventDefault();

          const form =
            event.target;

          const result =
            await pawsDb
              .from("products")
              .insert({

                name:
                  form.name.value.trim(),

                description:
                  form.description.value.trim(),

                price_zar:
                  Number(
                    form.price.value
                  ),

                image_url:
                  form.imageUrl.value.trim(),

                category:
                  form.category.value.trim() ||
                  "Other",

                active: true

              })
              .select()
              .single();

          if (result.error) {

            authMessage(
              result.error.message,
              "#admin-message"
            );

          } else {

            authMessage(
              "Product added.",
              "#admin-message"
            );

            form.reset();

            await renderAdminProducts();

          }

        }
      );


    /* -----------------------------------------------------
       RENDER ADMIN PRODUCTS
       ----------------------------------------------------- */

    async function renderAdminProducts() {

      const result =
        await pawsDb
          .from("products")
          .select(
            "id,name,price_zar,active"
          )
          .order("name");

      if (result.error) {
        throw result.error;
      }

      productsList.innerHTML =
        result.data
          .map(
            (product) => {

              return `
                <div class="admin-product">

                  <span>

                    ${product.name}

                    <small>
                      R${Number(
                        product.price_zar
                      ).toFixed(2)}
                      · ${
                        product.active
                          ? "Visible"
                          : "Hidden"
                      }
                    </small>

                  </span>

                  <button
                    data-toggle-product="${product.id}"
                    data-active="${product.active}"
                  >
                    ${
                      product.active
                        ? "Hide"
                        : "Show"
                    }
                  </button>

                </div>
              `;

            }
          )
          .join("");


      productsList
        .querySelectorAll(
          "[data-toggle-product]"
        )
        .forEach(
          (button) => {

            button.addEventListener(
              "click",
              async () => {

                await pawsDb
                  .from("products")
                  .update({

                    active:
                      button.dataset.active !==
                      "true"

                  })
                  .eq(
                    "id",
                    button.dataset.toggleProduct
                  );

                await renderAdminProducts();

              }
            );

          }
        );
    }


    /* -----------------------------------------------------
       RENDER ADMIN ORDERS
       ----------------------------------------------------- */

    async function renderAdminOrders() {

      const list =
        document.querySelector(
          "#admin-orders"
        );

      const result =
        await pawsDb
          .from("orders")
          .select(
            "id,status,amount_zar,buyer_email,created_at"
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          );

      if (result.error) {
        throw result.error;
      }


      if (!result.data?.length) {

        list.innerHTML =
          `<p class="auth-message">No orders yet.</p>`;

        return;
      }


      list.innerHTML =
        result.data
          .map(
            (order) => {

              return `
                <div class="data-row">

                  <strong>
                    ${order.buyer_email}
                  </strong>

                  <span class="pill">
                    ${order.status}
                  </span>

                  <small>
                    Order ${order.id
                      .slice(0, 8)
                      .toUpperCase()}
                    · R${Number(
                      order.amount_zar
                    ).toFixed(2)}
                    · ${new Date(
                      order.created_at
                    ).toLocaleDateString()}
                  </small>

                  <select
                    data-order-status="${order.id}"
                    class="status-select"
                  >

                    <option
                      ${
                        order.status === "PENDING"
                          ? "selected"
                          : ""
                      }
                    >
                      PENDING
                    </option>

                    <option
                      ${
                        order.status === "COMPLETE"
                          ? "selected"
                          : ""
                      }
                    >
                      COMPLETE
                    </option>

                    <option
                      ${
                        order.status === "FAILED"
                          ? "selected"
                          : ""
                      }
                    >
                      FAILED
                    </option>

                    <option
                      ${
                        order.status === "CANCELLED"
                          ? "selected"
                          : ""
                      }
                    >
                      CANCELLED
                    </option>

                  </select>

                </div>
              `;

            }
          )
          .join("");


      list
        .querySelectorAll(
          "[data-order-status]"
        )
        .forEach(
          (select) => {

            select.addEventListener(
              "change",
              async () => {

                await pawsDb
                  .from("orders")
                  .update({

                    status:
                      select.value

                  })
                  .eq(
                    "id",
                    select.dataset.orderStatus
                  );

                await renderAdminOrders();

              }
            );

          }
        );
    }

  } catch (error) {

    document.querySelector(
      "main"
    ).innerHTML = `
      <section class="auth-card">

        <p class="eyebrow-text">
          Private workspace
        </p>

        <h1>
          Access denied
        </h1>

        <p>
          ${error.message}
        </p>

        <a
          class="button primary"
          href="auth.html"
        >
          Go to login
        </a>

      </section>
    `;

  }
}


/* =========================================================
   GUEST CHECKOUT
   ========================================================= */

function setupGuestCheckout() {

  const checkoutButton =
    document.querySelector(
      "#checkout"
    );

  if (!checkoutButton) return;

  checkoutButton.addEventListener(
    "click",
    (event) => {

      event.preventDefault();
      event.stopPropagation();


      const existing =
        document.querySelector(
          "#guest-checkout"
        );

      if (existing) {
        existing.remove();
      }


      const checkoutBox =
        document.createElement(
          "div"
        );

      checkoutBox.id =
        "guest-checkout";


      checkoutBox.innerHTML = `

        <div class="guest-checkout-overlay">

          <div class="guest-checkout-card">

            <button
              type="button"
              id="close-guest-checkout"
              class="guest-close"
            >
              ×
            </button>

            <p class="eyebrow-text">
              Checkout
            </p>

            <h2>
              Delivery details
            </h2>

            <p>
              No account is required. Enter your details
              below and continue to PayFast.
            </p>

            <form id="guest-checkout-form">

              <label>
                Full name (first and last name)

                <input
                  name="fullName"
                  type="text"
                  required
                  autocomplete="name"
                  placeholder="John Smith"
                >

                <small>
                  Please enter your first and last name.
                  Example: John Smith
                </small>

              </label>

              <label>
                Email

                <input
                  name="email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="you@example.com"
                >
              </label>

              <label>
                Phone number

                <input
                  name="phone"
                  type="tel"
                  required
                  autocomplete="tel"
                  placeholder="082 123 4567"
                >
              </label>

              <label>
                Street address

                <input
                  name="address"
                  type="text"
                  required
                  autocomplete="street-address"
                  placeholder="12 Example Street"
                >
              </label>

              <label>
                Suburb

                <input
                  name="suburb"
                  type="text"
                  required
                  placeholder="Summerstrand"
                >
              </label>

              <label>
                City

                <input
                  name="city"
                  type="text"
                  required
                  placeholder="Gqeberha"
                >
              </label>

              <label>
                Province

                <input
                  name="province"
                  type="text"
                  required
                  placeholder="Eastern Cape"
                >
              </label>

              <label>
                Postal code

                <input
                  name="postalCode"
                  type="text"
                  required
                  autocomplete="postal-code"
                  placeholder="6001"
                >
              </label>

              <label>
                Delivery instructions

                <textarea
                  name="instructions"
                  placeholder="Optional delivery instructions"
                ></textarea>
              </label>

              <div class="checkout-summary">

  <div class="checkout-summary-row">
    <span>Subtotal</span>
    <strong id="guest-subtotal">R0</strong>
  </div>

  <div class="checkout-summary-row">
    <span>Shipping</span>
    <strong>R100</strong>
  </div>

  <div class="checkout-summary-total">
    <span>Total</span>
    <strong id="guest-total">R100</strong>
  </div>

</div>

<p
  id="guest-checkout-message"
  class="auth-message"
></p>

<button
  type="submit"
  class="button primary"
  id="guest-pay-button"
>
  Continue to PayFast
</button>

            </form>

          </div>

        </div>

      `;


      document.body.appendChild(
        checkoutBox
      );


      /* ---------------------------------------------------
         CLOSE CHECKOUT
         --------------------------------------------------- */

      document
        .querySelector(
          "#close-guest-checkout"
        )
        ?.addEventListener(
          "click",
          () => {

            checkoutBox.remove();

          }
        );


      /* ---------------------------------------------------
         SUBMIT CHECKOUT
         --------------------------------------------------- */

      document
        .querySelector(
          "#guest-checkout-form"
        )
        ?.addEventListener(
          "submit",
          async (submitEvent) => {

            submitEvent.preventDefault();

            const form =
              submitEvent.target;

            const button =
              document.querySelector(
                "#guest-pay-button"
              );

            const message =
              document.querySelector(
                "#guest-checkout-message"
              );


            /* ---------------------------------------------
               VALIDATE FULL NAME
               --------------------------------------------- */

            const fullName =
              form.fullName.value.trim();

            const nameParts =
              fullName.split(/\s+/);


            if (
              nameParts.length < 2 ||
              !nameParts[0] ||
              !nameParts[1]
            ) {

              message.textContent =
                "Please enter your first and last name.";

              form.fullName.focus();

              return;
            }


            button.disabled =
              true;

            button.textContent =
              "Preparing payment...";

            message.textContent =
              "";


            /* ---------------------------------------------
               LOAD CART
               --------------------------------------------- */

            const cart =
              JSON.parse(
                localStorage.getItem(
                  "moss-mud-cart"
                ) || "{}"
              );

            const cartItems =
              Object.values(cart);


            if (!cartItems.length) {

              message.textContent =
                "Your cart is empty.";

              button.disabled =
                false;

              button.textContent =
                "Continue to PayFast";

              return;
            }


            /* ---------------------------------------------
               CUSTOMER DETAILS
               --------------------------------------------- */

            const firstName =
              nameParts.shift() || "";

            const lastName =
              nameParts.join(" ") || "";


            /* ---------------------------------------------
               SEND TO CHECKOUT FUNCTION
               --------------------------------------------- */

            try {

              const response =
                await fetch(
                  pawsConfig.checkoutFunctionUrl,
                  {
                    method: "POST",

                    headers: {

                      "Content-Type":
                        "application/json",

                      apikey:
                        pawsConfig.supabasePublishableKey

                    },

                    body:
                      JSON.stringify({

                        firstName:
                          firstName,

                        lastName:
                          lastName,

                        email:
                          form.email.value.trim(),

                        phone:
                          form.phone.value.trim(),

                        address:
                          form.address.value.trim(),

                        suburb:
                          form.suburb.value.trim(),

                        city:
                          form.city.value.trim(),

                        province:
                          form.province.value.trim(),

                        postalCode:
                          form.postalCode.value.trim(),

                        instructions:
                          form.instructions.value.trim(),

                        items:
                          cartItems.map(
                            (item) => {

                              return {

                                id:
                                  item.id,

                                quantity:
                                  Number(
                                    item.quantity || 1
                                  )

                              };

                            }
                          )

                      })

                  }
                );


              let result;

              try {

                result =
                  await response.json();

              } catch {

                throw new Error(
                  "The checkout server returned an invalid response."
                );

              }


              if (!response.ok) {

                throw new Error(
                  result.error ||
                  "Checkout failed."
                );

              }


              if (
                !result.action ||
                !result.fields
              ) {

                throw new Error(
                  "The checkout service returned an invalid response."
                );

              }


              /* -------------------------------------------
                 SEND CUSTOMER TO PAYFAST
                 ------------------------------------------- */

              const payfastForm =
                document.createElement(
                  "form"
                );

              payfastForm.method =
                "POST";

              payfastForm.action =
                result.action;


              Object.entries(
                result.fields
              ).forEach(
                ([name, value]) => {

                  const input =
                    document.createElement(
                      "input"
                    );

                  input.type =
                    "hidden";

                  input.name =
                    name;

                  input.value =
                    value;

                  payfastForm.appendChild(
                    input
                  );

                }
              );


              document.body.appendChild(
                payfastForm
              );

              payfastForm.submit();

            } catch (error) {

              console.error(
                "Guest checkout error:",
                error
              );

              message.textContent =
                error.message ||
                "Unable to start payment.";

              button.disabled =
                false;

              button.textContent =
                "Continue to PayFast";

            }

          }
        );

    }
  );
}


/* =========================================================
   GUEST CHECKOUT STYLES
   ========================================================= */

function setupGuestCheckoutStyles() {

  if (
    document.querySelector(
      "#guest-checkout-styles"
    )
  ) {
    return;
  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "guest-checkout-styles";


  style.textContent = `

    .guest-checkout-overlay {

      position: fixed;
      inset: 0;
      z-index: 99999;

      background: rgba(0, 0, 0, 0.65);

      display: flex;
      align-items: center;
      justify-content: center;

      padding: 20px;

      overflow-y: auto;

    }


    .guest-checkout-card {

      position: relative;

      width: min(
        100%,
        520px
      );

      max-height: 90vh;

      overflow-y: auto;

      background: white;

      border-radius: 18px;

      padding: 28px;

      box-sizing: border-box;

    }


    .guest-checkout-card h2 {

      margin-top: 0;

    }


    .guest-checkout-card label {

      display: grid;

      gap: 7px;

      margin-bottom: 14px;

      font-weight: 600;

    }


    .guest-checkout-card input,
    .guest-checkout-card textarea {

      width: 100%;

      box-sizing: border-box;

      padding: 12px;

      border: 1px solid #ccc;

      border-radius: 8px;

      font: inherit;

    }


    .guest-checkout-card textarea {

      min-height: 80px;

      resize: vertical;

    }


    .guest-close {

      position: absolute;

      top: 12px;
      right: 14px;

      border: 0;

      background: transparent;

      font-size: 30px;

      cursor: pointer;

    }


    .guest-checkout-card small {

      display: block;

      font-size: 0.85rem;

      font-weight: 400;

      opacity: 0.7;

    }

  `;


  document.head.appendChild(
    style
  );
}


/* =========================================================
   START EVERYTHING
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupAuthPage();

    setupAccountPage();

    setupAdminPage();

    setupGuestCheckoutStyles();

    setupGuestCheckout();

  }
);
