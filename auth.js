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


/* =========================================================
   LOGIN REDIRECT
   ========================================================= */

async function redirectAfterLogin(user) {

  let profile = null;

  /*
    Try to load the customer's profile.

    If the profile cannot be loaded, we still allow
    the login to continue as a normal customer.
  */

  try {
    profile =
      await getProfile(user.id);
  } catch (error) {
    console.warn(
      "Profile could not be loaded:",
      error.message
    );
  }


  /*
    Admin users go to the admin dashboard.
  */

  if (profile?.role === "admin") {
    window.location.href =
      "admin.html";

    return;
  }


  /*
    If the customer originally clicked Checkout,
    send them back to the shop after login.
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

    return;
  }


  /*
    Normal customer login goes to their account.
  */

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


          /*
            Make sure Supabase actually returned
            a logged-in user before redirecting.
          */

          if (!result.data?.user) {

            throw new Error(
              "Sign in completed, but no user session was returned."
            );
          }


          /*
            Supabase has now created/restored the
            customer's session.

            The session is persisted because
            persistSession is enabled above.
          */

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


        /*
          If Supabase immediately gives us a session,
          the account can continue straight away.
        */

        if (result.data?.session) {

          await redirectAfterLogin(
            result.data.user
          );

        } else {

          /*
            If email confirmation is enabled,
            the customer must confirm their email first.
          */

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
   CHECKOUT PROTECTION + PAYFAST
   ========================================================= */

function protectCheckout() {

  const checkout =
    document.querySelector(
      "#checkout"
    );


  if (!checkout) return;


  document.addEventListener(
    "click",
    async (event) => {

      if (
        !event.target.closest(
          "#checkout"
        )
      ) {
        return;
      }


      event.preventDefault();
      event.stopImmediatePropagation();


      /* ---------------------------------------------------
         CHECK LOGIN
         --------------------------------------------------- */

      const sessionResult =
        await pawsDb.auth.getSession();


      if (sessionResult.error) {

        alert(
          sessionResult.error.message ||
          "Unable to check your account."
        );

        return;
      }


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


      /* ---------------------------------------------------
         LOAD CART
         --------------------------------------------------- */

      const cart =
        JSON.parse(
          localStorage.getItem(
            "moss-mud-cart"
          ) || "{}"
        );


      const cartItems =
        Object.values(cart);


      if (!cartItems.length) {

        alert(
          "Your cart is empty."
        );

        return;
      }


      /* ---------------------------------------------------
         CUSTOMER DETAILS
         --------------------------------------------------- */

      const firstName =
        window.prompt(
          "First name:",
          session.user.user_metadata
            ?.full_name
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


      /* ---------------------------------------------------
         SEND ORDER TO SUPABASE
         --------------------------------------------------- */

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
                  pawsConfig.supabasePublishableKey,

                Authorization:
                  `Bearer ${session.access_token}`

              },

              body:
                JSON.stringify({

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
                    cartItems.map(
                      (item) => {

                        return {

                          id:
                            item.id,

                          quantity:
                            Number(
                              item.quantity ||
                              1
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


        /* -------------------------------------------------
           CREATE PAYFAST FORM
           ------------------------------------------------- */

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


      } catch (error) {

        console.error(
          "Checkout error:",
          error
        );


        alert(
          error.message ||
          "Checkout failed."
        );

      }

    },
    true
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

    protectCheckout();

  }
);
```
console.log("PAWS AUTH.JS IS RUNNING");
