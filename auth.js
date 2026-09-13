```javascript
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
      .select(
        "id,full_name,phone,role"
      )
      .eq("id", userId)
      .single();

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

async function redirectAfterLogin(user) {

  const profile =
    await getProfile(user.id);

  if (profile.role === "admin") {

    window.location.href =
      "admin.html";

  } else {

    /*
      If the customer originally clicked
      Checkout, send them back to the
      store so the checkout process can
      continue.
    */

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

    } else {

      window.location.href =
        "account.html";

    }
  }
}

async function setupAuthPage() {

  const form =
    document.querySelector("#auth-form");

  if (!form) return;

  let signInMode = false;

  const nameField =
    document.querySelector("#name-field");

  const submitButton =
    document.querySelector("#auth-submit");

  const toggleButton =
    document.querySelector("#toggle-auth");

  const forgotButton =
    document.querySelector("#forgot-password");

  toggleButton?.addEventListener(
    "click",
    () => {

      signInMode = !signInMode;

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

    }
  );

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        form.email.value.trim();

      const password =
        form.password.value;

      submitButton.disabled = true;

      authMessage(
        "Please wait..."
      );

      try {

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

          await redirectAfterLogin(
            result.data.user
          );

        } else {

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

          if (result.data.session) {

            await redirectAfterLogin(
              result.data.user
            );

          } else {

            authMessage(
              "Account created. Check your email to confirm your account."
            );
          }
        }

      } catch (error) {

        authMessage(
          error.message ||
          "Unable to complete this request."
        );

      } finally {

        submitButton.disabled = false;
      }

    }
  );
}

async function setupAccountPage() {

  const ordersList =
    document.querySelector("#orders-list");

  if (!ordersList) return;

  try {

    const user =
      await getCurrentUser();

    if (!user) {
      throw new Error(
        "Please sign in to view your account."
      );
    }

    const profile =
      await getProfile(user.id);

    document.querySelector(
      "#account-name"
    ).textContent =
      profile.full_name?.split(" ")[0] ||
      "friend";

    document.querySelector(
      "#profile-name"
    ).value =
      profile.full_name || "";

    document.querySelector(
      "#profile-phone"
    ).value =
      profile.phone || "";

    /*
      Load this customer's orders.

      The products belonging to each order
      are stored in the "items" JSONB
      column inside the orders table.
    */

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
        ordersResult.data.map(
          (order) => {

            const items =
              Array.isArray(order.items)
                ? order.items
                : [];

            const itemText =
              items
                .map((item) => {

                  const quantity =
                    Number(
                      item.quantity
                    ) || 1;

                  return `${item.name || "Product"} × ${quantity}`;

                })
                .join(", ");

            const status =
              String(
                order.status || "pending"
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
        ).join("");
    }

    /*
      Save customer profile details.
    */

    document
      .querySelector("#profile-form")
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

    /*
      Sign out.
    */

    document
      .querySelector("#sign-out")
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

    document
      .querySelector("#admin-sign-out")
      ?.addEventListener(
        "click",
        async () => {

          await pawsDb.auth.signOut();

          window.location.href =
            "index.html";
        }
      );

    document
      .querySelector("#product-form")
      ?.addEventListener(
        "submit",
        async (event) => {

          event.preventDefault();

          const form = event.target;

          const result =
            await pawsDb
              .from("products")
              .insert({
                name:
                  form.name.value.trim(),

                description:
                  form.description.value.trim(),

                price_zar:
                  Number(form.price.value),

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
        result.data.map(
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
        ).join("");

      productsList
        .querySelectorAll(
          "[data-toggle-product]"
        )
        .forEach((button) => {

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

        });
    }

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
        result.data.map(
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

                  <option ${
                    order.status === "PENDING"
                      ? "selected"
                      : ""
                  }>
                    PENDING
                  </option>

                  <option ${
                    order.status === "COMPLETE"
                      ? "selected"
                      : ""
                  }>
                    COMPLETE
                  </option>

                  <option ${
                    order.status === "FAILED"
                      ? "selected"
                      : ""
                  }>
                    FAILED
                  </option>

                  <option ${
                    order.status === "CANCELLED"
                      ? "selected"
                      : ""
                  }>
                    CANCELLED
                  </option>

                </select>

              </div>
            `;

          }
        ).join("");

      list
        .querySelectorAll(
          "[data-order-status]"
        )
        .forEach((select) => {

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

        });
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

function protectCheckout() {

  const checkout =
    document.querySelector("#checkout");

  if (!checkout) return;

  document.addEventListener(
    "click",
    async (event) => {

      if (
        !event.target.closest("#checkout")
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      /*
        Check whether the customer is
        already signed in.
      */

      const sessionResult =
        await pawsDb.auth.getSession();

      const session =
        sessionResult.data.session;

      if (!session) {

        sessionStorage.setItem(
          "paws-checkout-pending",
          "true"
        );

        alert(
          "Please sign in or create an account before checkout."
        );

        window.location.href =
          "auth.html";

        return;
      }

      /*
        Get the cart.
      */

      const cart =
        JSON.parse(
          localStorage.getItem(
            "moss-mud-cart"
          ) || "[]"
        );

      if (
        !Array.isArray(cart) ||
        cart.length === 0
      ) {

        alert(
          "Your cart is empty."
        );

        return;
      }

      /*
        Customer details.
      */

      const firstName =
        window.prompt(
          "First name:",
          session.user.user_metadata?.full_name
            ?.split(" ")[0] || ""
        );

      if (!firstName) return;

      const lastName =
        window.prompt(
          "Last name:"
        );

      if (!lastName) return;

      const phone =
        window.prompt(
          "Phone number:"
        );

      if (!phone) return;

      const address =
        window.prompt(
          "Street address:"
        );

      if (!address) return;

      const suburb =
        window.prompt(
          "Suburb:"
        );

      if (!suburb) return;

      const city =
        window.prompt(
          "City:"
        );

      if (!city) return;

      const province =
        window.prompt(
          "Province:"
        );

      if (!province) return;

      const postalCode =
        window.prompt(
          "Postal code:"
        );

      if (!postalCode) return;

      const instructions =
        window.prompt(
          "Delivery instructions (optional):",
          ""
        ) || "";

      /*
        Send the order to our secure
        Supabase Edge Function.

        The backend gets the customer's
        real user_id from the access token.
      */

      const response =
        await fetch(
          pawsConfig.checkoutFunctionUrl,
          {
            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              apikey:
                pawsConfig.supabasePublishableKey,

              Authorization:
                `Bearer ${session.access_token}`

            },

            body: JSON.stringify({

              firstName:
                firstName,

              lastName:
                lastName,

              email:
                session.user.email,

              phone:
                phone,

              address:
                address,

              suburb:
                suburb,

              city:
                city,

              province:
                province,

              postalCode:
                postalCode,

              instructions:
                instructions,

              items:
                cart.map((item) => {

                  return {

                    id:
                      item.id,

                    quantity:
                      item.quantity

                  };

                })

            })

          }
        );

      let result;

      try {

        result =
          await response.json();

      } catch {

        alert(
          "The checkout server returned an invalid response."
        );

        return;
      }

      if (!response.ok) {

        alert(
          result.error ||
          "Checkout failed."
        );

        return;
      }

      /*
        Build the PayFast POST form.
      */

      const form =
        document.createElement(
          "form"
        );

      form.method =
        "POST";

      form.action =
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

          form.appendChild(
            input
          );

        }
      );

      document.body.appendChild(
        form
      );

      form.submit();

    },
    true
  );
}

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupAuthPage();

    setupAccountPage();

    setupAdminPage();

    protectCheckout();

  }
);
```
