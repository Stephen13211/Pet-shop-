// ============================================================
// PAWS INCORPORATED - APP.JS
// ============================================================

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------

const config = window.PETSHOP_CONFIG || {};

const SHIPPING_FEE = 89;

const CART_STORAGE_KEY = "moss-mud-cart";


// ------------------------------------------------------------
// SAMPLE PRODUCTS
// ------------------------------------------------------------
// These are only used if Supabase products cannot be loaded.
// Your real catalogue comes from Supabase.
// ------------------------------------------------------------

const SAMPLE_PRODUCTS = [
  {
    id: "sample-chicken-breast",
    name: "Air-Fried Dried Chicken Breast",
    price_zar: 99,
    category: "Treats",
    active: true
  },
  {
    id: "sample-chicken-hearts",
    name: "Dried Chicken Hearts",
    price_zar: 99,
    category: "Treats",
    active: true
  },
  {
    id: "sample-chicken-livers",
    name: "Dried Chicken Livers",
    price_zar: 99,
    category: "Treats",
    active: true
  },
  {
    id: "sample-safety-leash",
    name: "Car Safety-Belt Leash",
    price_zar: 179,
    category: "Walks",
    active: true
  },
  {
    id: "sample-joint-brace",
    name: "Joint Support Brace Pair",
    price_zar: 229,
    category: "Care",
    active: true
  },
  {
    id: "sample-headrest",
    name: "Car Window Headrest",
    price_zar: 199,
    category: "Travel",
    active: true
  }
];


// ------------------------------------------------------------
// SUPABASE
// ------------------------------------------------------------

let supabaseClient = null;

if (
  window.supabase &&
  config.supabaseUrl &&
  config.supabasePublishableKey
) {
  supabaseClient = window.supabase.createClient(
    config.supabaseUrl,
    config.supabasePublishableKey
  );
}


// ------------------------------------------------------------
// STATE
// ------------------------------------------------------------

let products = [];

let cart = {};


// ------------------------------------------------------------
// CART LOAD
// ------------------------------------------------------------

function loadCart() {
  try {
    const savedCart =
      localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) {
      cart = {};
      return;
    }

    const parsed = JSON.parse(savedCart);

    if (
      parsed &&
      typeof parsed === "object"
    ) {
      cart = parsed;
    } else {
      cart = {};
    }

  } catch (error) {
    console.error(
      "Unable to load cart:",
      error
    );

    cart = {};
  }
}


// ------------------------------------------------------------
// CART SAVE
// ------------------------------------------------------------

function saveCart() {
  try {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart)
    );
  } catch (error) {
    console.error(
      "Unable to save cart:",
      error
    );
  }
}


// ------------------------------------------------------------
// GA4
// ------------------------------------------------------------

function trackGA4(
  eventName,
  parameters = {}
) {
  if (
    typeof window.gtag !== "function"
  ) {
    console.warn(
      "GA4 gtag is not available."
    );

    return;
  }

  window.gtag(
    "event",
    eventName,
    parameters
  );
}


function getGA4Item(
  product,
  quantity = 1
) {
  return {
    item_id: String(product.id),
    item_name: product.name,
    item_category:
      product.category || "Other",
    price:
      Number(product.price_zar) || 0,
    quantity:
      Number(quantity) || 1
  };
}


// ------------------------------------------------------------
// LOAD PRODUCTS
// ------------------------------------------------------------

async function loadProducts() {
  try {

    if (!supabaseClient) {
      console.warn(
        "Supabase is not configured. Using sample products."
      );

      products = SAMPLE_PRODUCTS;

      return;
    }

    const {
      data,
      error
    } = await supabaseClient
      .from("products")
      .select("*")
      .eq("active", true)
      .order("name");

    if (error) {
      throw error;
    }

    if (
      Array.isArray(data) &&
      data.length > 0
    ) {
      products = data;
    } else {
      console.warn(
        "No Supabase products found. Using sample products."
      );

      products = SAMPLE_PRODUCTS;
    }

  } catch (error) {

    console.error(
      "Unable to load products:",
      error
    );

    products = SAMPLE_PRODUCTS;
  }
}


// ------------------------------------------------------------
// FIND PRODUCT
// ------------------------------------------------------------

function getProductById(productId) {
  return products.find(
    (product) =>
      String(product.id) ===
      String(productId)
  );
}


// ------------------------------------------------------------
// ADD TO CART
// ------------------------------------------------------------

function addToCart(productId) {

  const product =
    getProductById(productId);

  if (!product) {
    console.error(
      "Product not found:",
      productId
    );

    return;
  }

  const existingQuantity =
    Number(cart[productId] || 0);

  cart[productId] =
    existingQuantity + 1;

  saveCart();

  renderCart();

  // ----------------------------------------------------------
  // GA4 ADD TO CART
  // ----------------------------------------------------------

  trackGA4(
    "add_to_cart",
    {
      currency: "ZAR",

      value:
        Number(product.price_zar) || 0,

      items: [
        getGA4Item(
          product,
          1
        )
      ]
    }
  );
}


// ------------------------------------------------------------
// REMOVE FROM CART
// ------------------------------------------------------------

function removeFromCart(productId) {

  if (!cart[productId]) {
    return;
  }

  const quantity =
    Number(cart[productId]);

  if (quantity <= 1) {
    delete cart[productId];
  } else {
    cart[productId] =
      quantity - 1;
  }

  saveCart();

  renderCart();
}


// ------------------------------------------------------------
// SET CART QUANTITY
// ------------------------------------------------------------

function setCartQuantity(
  productId,
  quantity
) {

  const numericQuantity =
    Math.floor(
      Number(quantity)
    );

  if (
    !Number.isFinite(
      numericQuantity
    ) ||
    numericQuantity <= 0
  ) {
    delete cart[productId];
  } else {
    cart[productId] =
      numericQuantity;
  }

  saveCart();

  renderCart();
}


// ------------------------------------------------------------
// CLEAR CART
// ------------------------------------------------------------

function clearCart() {

  cart = {};

  localStorage.removeItem(
    CART_STORAGE_KEY
  );

  renderCart();
}


// ------------------------------------------------------------
// CART ITEMS
// ------------------------------------------------------------

function getCartItems() {

  return Object.entries(cart)
    .map(
      ([
        productId,
        quantity
      ]) => {

        const product =
          getProductById(
            productId
          );

        if (!product) {
          return null;
        }

        return {
          ...product,

          quantity:
            Number(quantity) || 1
        };
      }
    )
    .filter(Boolean);
}


// ------------------------------------------------------------
// CART TOTAL
// ------------------------------------------------------------

function getCartSubtotal() {

  return getCartItems()
    .reduce(
      (
        total,
        item
      ) => {

        return (
          total +
          (
            Number(
              item.price_zar
            ) || 0
          ) *
          (
            Number(
              item.quantity
            ) || 1
          )
        );
      },
      0
    );
}


function getCartTotal() {

  const subtotal =
    getCartSubtotal();

  if (subtotal <= 0) {
    return 0;
  }

  return (
    subtotal +
    SHIPPING_FEE
  );
}


// ------------------------------------------------------------
// RENDER CART
// ------------------------------------------------------------

function renderCart() {

  /*
    Keep your existing cart rendering
    code here if your current app.js
    contains additional UI-specific
    rendering logic.

    This function intentionally does
    not alter your checkout system.
  */

  if (
    typeof window.updateCartUI ===
    "function"
  ) {
    window.updateCartUI();
  }

  document.dispatchEvent(
    new CustomEvent(
      "cartUpdated"
    )
  );
}


// ------------------------------------------------------------
// PAYMENT SUCCESS UI
// ------------------------------------------------------------

function showPaymentSuccess() {

  /*
    If your existing app.js contains
    the full success modal implementation,
    keep that implementation here.

    This fallback prevents an error if
    the function does not exist elsewhere.
  */

  const modal =
    document.getElementById(
      "payment-success-modal"
    );

  if (modal) {
    modal.classList.add(
      "active"
    );

    return;
  }

  showToast(
    "Payment confirmed! Your order has been received."
  );
}


// ------------------------------------------------------------
// TOAST
// ------------------------------------------------------------

function showToast(message) {

  const existing =
    document.querySelector(
      ".paws-toast"
    );

  if (existing) {
    existing.remove();
  }

  const toast =
    document.createElement(
      "div"
    );

  toast.className =
    "paws-toast";

  toast.textContent =
    message;

  document.body.appendChild(
    toast
  );

  setTimeout(
    () => {
      toast.remove();
    },
    4000
  );
}


// ============================================================
// VERIFIED PURCHASE
// ============================================================

async function verifyPurchase(
  paymentId,
  attempts = 5
) {

  if (!paymentId) {
    return null;
  }

  if (
    !config.supabaseUrl ||
    !config.supabasePublishableKey
  ) {

    console.error(
      "Supabase configuration is missing."
    );

    return null;
  }

  const verifyUrl =
    `${config.supabaseUrl}/functions/v1/verify-purchase`;

  for (
    let attempt = 0;
    attempt < attempts;
    attempt++
  ) {

    try {

      const response =
        await fetch(
          verifyUrl,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "apikey":
                config.supabasePublishableKey
            },

            body:
              JSON.stringify({
                paymentId
              })
          }
        );

      const result =
        await response.json();

      if (
        response.ok &&
        result &&
        result.paid === true
      ) {

        return result;
      }

      console.log(
        `Payment not verified yet. Attempt ${attempt + 1}/${attempts}`
      );

    } catch (error) {

      console.error(
        "Purchase verification failed:",
        error
      );
    }

    /*
      PayFast's ITN may reach Supabase
      slightly before or after the browser
      returns to the website.

      So we wait and check again.
    */

    if (
      attempt <
      attempts - 1
    ) {

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            2000
          )
      );
    }
  }

  return null;
}


// ------------------------------------------------------------
// HANDLE PAYFAST RETURN
// ------------------------------------------------------------

async function handlePaymentReturn() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const payment =
    params.get(
      "payment"
    );

  const paymentId =
    params.get(
      "payment_id"
    );


  // ==========================================================
  // SUCCESS RETURN
  // ==========================================================

  if (
    payment === "success"
  ) {

    /*
      We MUST have a payment ID.

      Without it we cannot verify which
      PayFast transaction belongs to this
      browser session.
    */

    if (!paymentId) {

      console.error(
        "Payment success returned without a payment ID."
      );

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      showToast(
        "We could not verify the payment yet. Please contact us if you were charged."
      );

      return;
    }


    // --------------------------------------------------------
    // ASK OUR SERVER IF THE PAYMENT IS REALLY PAID
    // --------------------------------------------------------

    const verifiedPurchase =
      await verifyPurchase(
        paymentId,
        5
      );


    // --------------------------------------------------------
    // PAYMENT VERIFIED
    // --------------------------------------------------------

    if (
      verifiedPurchase &&
      verifiedPurchase.paid === true
    ) {

      /*
        Prevent the purchase event from
        being sent again if the customer
        refreshes the page.
      */

      const trackingKey =
        `paws-ga4-purchase-${paymentId}`;

      const alreadyTracked =
        localStorage.getItem(
          trackingKey
        ) === "1";


      // ------------------------------------------------------
      // SEND GA4 PURCHASE
      // ------------------------------------------------------

      if (!alreadyTracked) {

        trackGA4(
          "purchase",
          {
            transaction_id:
              String(
                verifiedPurchase.orderId
              ),

            currency:
              verifiedPurchase.currency ||
              "ZAR",

            value:
              Number(
                verifiedPurchase.value ||
                0
              ),

            shipping:
              Number(
                verifiedPurchase.shipping ||
                0
              ),

            items:
              Array.isArray(
                verifiedPurchase.items
              )
                ? verifiedPurchase.items
                : []
          }
        );

        localStorage.setItem(
          trackingKey,
          "1"
        );

        console.log(
          "GA4 purchase sent:",
          verifiedPurchase
        );
      }


      // ------------------------------------------------------
      // NOW IT IS SAFE TO CLEAR THE CART
      // ------------------------------------------------------

      cart = {};

      localStorage.removeItem(
        CART_STORAGE_KEY
      );

      renderCart();


      // ------------------------------------------------------
      // SHOW SUCCESS
      // ------------------------------------------------------

      showPaymentSuccess();


      // ------------------------------------------------------
      // CLEAN URL
      // ------------------------------------------------------

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      return;
    }


    // --------------------------------------------------------
    // NOT VERIFIED YET
    // --------------------------------------------------------

    /*
      We DO NOT clear the cart.

      We DO NOT send GA4 purchase.

      We DO NOT tell the customer that
      the payment definitely succeeded.
    */

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    showToast(
      "We're still confirming your payment. Please refresh in a moment."
    );

    return;
  }


  // ==========================================================
  // CANCELLED
  // ==========================================================

  if (
    payment === "cancelled"
  ) {

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    showToast(
      "Your payment was cancelled."
    );

    return;
  }
}


// ============================================================
// INITIALISE
// ============================================================

async function initialiseApp() {

  loadCart();

  await loadProducts();

  renderCart();

  /*
    This runs after the products/cart
    are loaded, but payment verification
    itself uses the secure Supabase
    order record.
  */

  await handlePaymentReturn();
}


// ------------------------------------------------------------
// START APP
// ------------------------------------------------------------

initialiseApp();
