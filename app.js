
const SAMPLE_PRODUCTS = [
  {
    id: "moss-bed",
    name: "Moss cloud bed",
    category: "Rest",
    price_zar: 699,
    badge: "Bestseller",
    image_url:
      "https://images.unsplash.com/photo-1522444195799-478538b28823?auto=format&fit=crop&w=900&q=85",
    description:
      "A washable, cloud-soft landing spot for serious snoozers."
  },
  {
    id: "terra-bowl",
    name: "Terra slow-feeder bowl",
    category: "Mealtimes",
    price_zar: 289,
    badge: "New",
    image_url:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=85",
    description:
      "Calm, considered mealtimes in a hand-finished stoneware bowl."
  },
  {
    id: "sunny-toy",
    name: "Sunny knot toy",
    category: "Play",
    price_zar: 149,
    image_url:
      "https://images.unsplash.com/photo-1558929996-da64ba858215?auto=format&fit=crop&w=900&q=85",
    description:
      "A joyful, sturdy little companion for tug, toss and zoomies."
  },
  {
    id: "linen-lead",
    name: "Linen everyday lead",
    category: "Walks",
    price_zar: 249,
    image_url:
      "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=85",
    description:
      "Soft-touch webbing and a brass clip for unhurried adventures."
  },
  {
    id: "cozy-cat",
    name: "Cedar cat hideaway",
    category: "Rest",
    price_zar: 549,
    image_url:
      "https://images.unsplash.com/photo-1494256997604-768d1f608cac?auto=format&fit=crop&w=900&q=85",
    description:
      "A private nook for high perches, slow blinks and big naps."
  },
  {
    id: "groom-kit",
    name: "Sunday groom kit",
    category: "Care",
    price_zar: 329,
    image_url:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=900&q=85",
    description:
      "Three gentle essentials for a softer coat and a calmer ritual."
  }
];

const CATEGORIES = [
  "All pieces",
  "Rest",
  "Play",
  "Walks",
  "Mealtimes",
  "Care"
];

/* =========================================
   GOOGLE ANALYTICS
========================================= */

function trackGA4(eventName, parameters = {}) {
  if (typeof window.gtag !== "function") {
    console.warn("GA4 gtag is not available.");
    return;
  }

  window.gtag("event", eventName, parameters);
}

function getGA4Item(product, quantity = 1) {
  return {
    item_id: String(product.id),
    item_name: product.name,
    item_category: product.category || "Other",
    price: Number(product.price_zar) || 0,
    quantity: Number(quantity) || 1
  };
}

let products = [];
let selectedCategory = "All pieces";

let cart = JSON.parse(
  localStorage.getItem("moss-mud-cart") || "{}"
);

const $ = (selector) => document.querySelector(selector);

const money = (value) => {
  return `R${Number(value).toLocaleString("en-ZA")}`;
};

/* =========================================
   MONTHLY SPECIALS — 10% OFF
========================================= */

// The selling price remains the actual price in Supabase.
// This calculates a reference price 10% higher than it.

function referencePrice(value) {
  return (Number(value) || 0) / 0.90;
}

function referenceMoney(value) {
  return `R${referencePrice(value).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function initMonthlySpecials() {
  if (document.getElementById("monthly-specials")) return;

  const style = document.createElement("style");

  style.id = "monthly-specials-styles";

  style.textContent = `
    #monthly-specials {
      background: linear-gradient(110deg, #34234b, #d92d56);
      color: #fff;
      text-align: center;
      padding: 18px 14px;
      margin: 0;
      position: relative;
      z-index: 1;
    }

    #monthly-specials .specials-title {
      font-size: clamp(20px, 4vw, 28px);
      font-weight: 800;
      margin: 0 0 5px;
    }

    #monthly-specials .specials-description {
      margin: 0 0 9px;
      font-size: 14px;
      line-height: 1.5;
    }

    #monthly-specials .specials-countdown {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .4px;
    }

    .product-image {
      position: relative;
    }

    .monthly-sale-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 3;
      background: #d92d56;
      color: #fff;
      border-radius: 999px;
      padding: 7px 10px;
      font-size: 11px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: .4px;
      pointer-events: none;
    }

    .monthly-price {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 7px;
      margin: 8px 0;
    }

    .monthly-price .sale-price {
      font-size: 17px;
      font-weight: 800;
      color: #d92d56;
    }

    .monthly-price .reference-price {
      color: #85858d;
      font-size: 13px;
      font-weight: 400;
      text-decoration: line-through;
    }

    @media (max-width: 480px) {
      #monthly-specials {
        padding: 15px 10px;
      }

      #monthly-specials .specials-description {
        font-size: 12px;
      }

      .monthly-sale-badge {
        top: 8px;
        left: 8px;
        padding: 6px 8px;
        font-size: 10px;
      }

      .monthly-price {
        gap: 5px;
      }

      .monthly-price .sale-price {
        font-size: 15px;
      }

      .monthly-price .reference-price {
        font-size: 12px;
      }
    }
  `;

  document.head.appendChild(style);

  const banner = document.createElement("section");
  banner.id = "monthly-specials";
  banner.setAttribute("aria-label", "Monthly specials");

  banner.innerHTML = `
    <p class="specials-title"></p>
    <p class="specials-description">
      Treat your best friend to something special this month.
    </p>
    <div
      class="specials-countdown"
      id="specials-countdown"
      aria-live="polite"
    ></div>
  `;

  const promo = document.querySelector(".promo");

  if (promo) {
    promo.insertAdjacentElement("afterend", banner);
  } else {
    document.body.prepend(banner);
  }

  function updateCountdown() {
    const now = new Date();

    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0, 0, 0, 0
    );

    const remaining = Math.max(
      0,
      nextMonth.getTime() - now.getTime()
    );

    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    const monthName = now.toLocaleDateString("en-ZA", {
      month: "long"
    });

    const title = banner.querySelector(".specials-title");
    const countdown = document.getElementById("specials-countdown");

    if (title) {
      title.textContent = `${monthName} Specials — 10% OFF`;
    }

    if (countdown) {
      const nextMonthName = nextMonth.toLocaleDateString("en-ZA", {
        month: "long"
      });

      countdown.textContent =
        `${days}d ${hours}h ${minutes}m ${seconds}s remaining` +
        ` · Next update: ${nextMonthName}`;
    }
  }

  updateCountdown();

  window.setInterval(updateCountdown, 1000);
}

/* =========================================
   SHIPPING
========================================= */

const SHIPPING_FEE = 89;

/* =========================================
   TOAST
========================================= */

function showToast(message) {
  const toast = $("#toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* =========================================
   HTML ESCAPING
========================================= */

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (character) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      }[character];
    }
  );
}

/* =========================================
   SAVE CART
========================================= */

function saveCart() {
  localStorage.setItem(
    "moss-mud-cart",
    JSON.stringify(cart)
  );

  renderCart();
}

/* =========================================
   FILTERS
========================================= */

function renderFilters() {
  const filters = $("#filters");

  if (!filters) return;

  filters.innerHTML = CATEGORIES.map((category) => {
    return `
      <button
        class="filter ${
          selectedCategory === category ? "active" : ""
        }"
        data-category="${escapeHtml(category)}"
      >
        ${escapeHtml(category)}
      </button>
    `;
  }).join("");
}

/* =========================================
   PAWSEASE LEASH SIZE HELPERS
========================================= */

const LEASH_PRODUCT_IDS = new Set([
  "6b38dc19-94a8-461a-ae38-d2b560d97c45",
  "a83020ef-9093-43ec-b8bb-254c89f7c41d",
  "d9b2c647-2bf4-4a10-9f23-a6d9cd51673c"
]);

function isLeashProduct(product) {
  return (
    LEASH_PRODUCT_IDS.has(String(product.id)) ||
    /^PAWS-LEASH-[SML]$/i.test(product.sku || "")
  );
}

function getLeashSize(product) {
  const skuMatch = (product.sku || "").match(
    /^PAWS-LEASH-([SML])$/i
  );

  if (skuMatch) {
    return skuMatch[1].toUpperCase();
  }

  const name = (product.name || "").toLowerCase();

  if (name.includes("small")) return "S";
  if (name.includes("medium")) return "M";
  if (name.includes("large")) return "L";

  return "";
}

function getLeashSizeName(size) {
  return {
    S: "Small",
    M: "Medium",
    L: "Large"
  }[size] || size;
}

/* =========================================
   PRODUCTS
========================================= */

function renderProducts() {
  const grid = $("#product-grid");
  const pieceCount = $("#piece-count");
  const searchInput = $("#search");

  if (!grid) return;

  const searchTerm = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All pieces" ||
      product.category === selectedCategory;

    const searchableText = `
      ${product.name || ""}
      ${product.category || ""}
      ${product.description || ""}
      ${product.badge || ""}
      ${product.sku || ""}
    `.toLowerCase();

    const matchesSearch =
      !searchTerm || searchableText.includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  const leashVariants = products
    .filter(isLeashProduct)
    .sort((a, b) => {
      const order = { S: 1, M: 2, L: 3 };

      return (
        (order[getLeashSize(a)] || 99) -
        (order[getLeashSize(b)] || 99)
      );
    });

  const displayProducts = [];
  let leashAdded = false;

  filteredProducts.forEach((product) => {
    if (!isLeashProduct(product)) {
      displayProducts.push({
        product,
        variants: null
      });

      return;
    }

    if (!leashAdded && leashVariants.length > 0) {
      const mediumVariant = leashVariants.find(
        (item) => getLeashSize(item) === "M"
      );

      displayProducts.push({
        product: mediumVariant || leashVariants[0],
        variants: leashVariants
      });

      leashAdded = true;
    }
  });

  if (pieceCount) {
    pieceCount.textContent =
      `${displayProducts.length} ${
        displayProducts.length === 1 ? "piece" : "pieces"
      }`;
  }

  if (!displayProducts.length) {
    grid.innerHTML = `
      <div class="empty">
        No pieces found.
      </div>
    `;

    return;
  }

  grid.innerHTML = displayProducts.map(
    ({ product, variants }) => {

      /* LEASH CARD WITH SIZE SELECTOR */

      if (variants) {
        const defaultVariant =
          variants.find(
            (item) => getLeashSize(item) === "M"
          ) || variants[0];

        const lowestPrice = Math.min(
          ...variants.map(
            (item) => Number(item.price_zar) || 0
          )
        );

        const sizeOptions = variants.map((variant) => {
          const size = getLeashSize(variant);

          return `
            <option
              value="${escapeHtml(variant.id)}"
              ${variant.id === defaultVariant.id ? "selected" : ""}
            >
              ${escapeHtml(getLeashSizeName(size))} —
              ${money(variant.price_zar)}
            </option>
          `;
        }).join("");

        return `
          <article class="product-card">

            <div class="product-image">

              <span class="monthly-sale-badge">10% OFF</span>

              <img
                src="${escapeHtml(defaultVariant.image_url)}"
                alt="PawsEase No-Pull Leash"
                loading="lazy"
              >

              <button
                type="button"
                data-leash-add
                aria-label="Add selected PawsEase leash size to bag"
              >
                +
              </button>

            </div>

            <div class="product-info">

              <div>
                <small>Walks</small>
                <h3>PawsEase No-Pull Leash</h3>
              </div>

              <div class="monthly-price">
                <span class="sale-price">
                  From ${money(lowestPrice)}
                </span>
                <span class="reference-price">
                  ${referenceMoney(lowestPrice)}
                </span>
              </div>

              <p>
                ${escapeHtml(defaultVariant.description || "")}
              </p>

              <label>
                Choose your dog's size

                <select
                  data-leash-size
                  aria-label="Choose PawsEase leash size"
                  style="
                    display:block;
                    width:100%;
                    padding:10px;
                    margin-top:8px;
                    border:1px solid #d6d6d0;
                    border-radius:8px;
                    background:#fff;
                    color:#222;
                  "
                >
                  ${sizeOptions}
                </select>
              </label>

            </div>

          </article>
        `;
      }

      /* ALL OTHER PRODUCTS */

      const badge = product.badge
        ? `
          <span>
            ${escapeHtml(product.badge)}
          </span>
        `
        : "";

      return `
        <article class="product-card">

          <div class="product-image">

            <span class="monthly-sale-badge">10% OFF</span>

            <img
              src="${escapeHtml(product.image_url)}"
              alt="${escapeHtml(product.name)}"
              loading="lazy"
            >

            ${badge}

            <button
              type="button"
              data-add="${escapeHtml(product.id)}"
              aria-label="Add ${escapeHtml(product.name)} to bag"
            >
              +
            </button>

          </div>

          <div class="product-info">

            <div>
              <small>
                ${escapeHtml(product.category || "")}
              </small>

              <h3>
                ${escapeHtml(product.name)}
              </h3>
            </div>

            <div class="monthly-price">
              <span class="sale-price">
                ${money(product.price_zar)}
              </span>
              <span class="reference-price">
                ${referenceMoney(product.price_zar)}
              </span>
            </div>

            <p>
              ${escapeHtml(product.description || "")}
            </p>

          </div>

        </article>
      `;
    }
  ).join("");
}

/* =========================================
   CART
========================================= */

function renderCart() {
  const cartItems = $("#cart-items");
  const cartSubtotal = $("#cart-subtotal");
  const cartShipping = $("#cart-shipping");
  const cartTotal = $("#cart-total");
  const bagCount = $("#bag-count");

  if (!cartItems) return;

  const items = Object.values(cart);

  const totalQuantity = items.reduce(
    (total, item) => {
      return total + Number(item.quantity || 0);
    },
    0
  );

  const subtotal = items.reduce(
    (total, item) => {
      return (
        total +
        Number(item.price_zar || 0) *
        Number(item.quantity || 0)
      );
    },
    0
  );

  const shipping = items.length > 0
    ? SHIPPING_FEE
    : 0;

  const finalTotal = subtotal + shipping;

  if (bagCount) {
    bagCount.textContent = totalQuantity;
  }

  if (cartSubtotal) {
    cartSubtotal.textContent = money(subtotal);
  }

  if (cartShipping) {
    cartShipping.textContent = money(shipping);
  }

  if (cartTotal) {
    cartTotal.textContent = money(finalTotal);
  }

  if (!items.length) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <h3>Your bag is waiting.</h3>
        <p>
          Add something lovely for your pet to get started.
        </p>
      </div>
    `;

    return;
  }

  cartItems.innerHTML = items.map((item) => {
    const quantity = Number(item.quantity || 0);

    return `
      <div class="cart-row">

        <img
          src="${escapeHtml(item.image_url)}"
          alt="${escapeHtml(item.name)}"
        >

        <div>

          <div class="cart-title">
            <span>${escapeHtml(item.name)}</span>

            <b>
              ${money(
                Number(item.price_zar || 0) * quantity
              )}
            </b>
          </div>

          <small>
            ${escapeHtml(item.category || "")}
          </small>

          <div class="quantity">

            <button
              type="button"
              data-minus="${escapeHtml(item.id)}"
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span>${quantity}</span>

            <button
              type="button"
              data-plus="${escapeHtml(item.id)}"
              aria-label="Increase quantity"
            >
              +
            </button>

          </div>

        </div>

      </div>
    `;
  }).join("");
}

/* =========================================
   ADD TO CART
========================================= */

function addToCart(productId) {
  const product = products.find((item) => {
    return String(item.id) === String(productId);
  });

  if (!product) {
    showToast("Product could not be found.");
    return;
  }

  const newQuantity =
    Number(cart[productId]?.quantity || 0) + 1;

  cart[productId] = {
    ...product,
    quantity: newQuantity
  };

  saveCart();

  trackGA4("add_to_cart", {
    currency: "ZAR",
    value: Number(product.price_zar) || 0,
    items: [
      getGA4Item(product, 1)
    ]
  });

  showToast(`${product.name} added to your bag`);
}

/* =========================================
   UPDATE QUANTITY
========================================= */

function updateQuantity(productId, change) {
  if (!cart[productId]) return;

  cart[productId].quantity =
    Number(cart[productId].quantity || 0) + change;

  if (cart[productId].quantity < 1) {
    delete cart[productId];
  }

  saveCart();
}

/* =========================================
   OPEN CART
========================================= */

function openCart() {
  const drawer = $("#cart-drawer");

  if (!drawer) return;

  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

/* =========================================
   CLOSE CART
========================================= */

function closeCart() {
  const drawer = $("#cart-drawer");

  if (!drawer) return;

  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

/* =========================================
   LOAD PRODUCTS FROM SUPABASE
========================================= */

async function loadProducts() {
  const config = window.PETSHOP_CONFIG || {};

  try {
    if (
      !config.supabaseUrl ||
      !config.supabasePublishableKey
    ) {
      throw new Error(
        "Supabase configuration is missing."
      );
    }

    if (!window.supabase) {
      throw new Error(
        "Supabase JavaScript library was not loaded."
      );
    }

    const supabaseClient =
      window.supabase.createClient(
        config.supabaseUrl,
        config.supabasePublishableKey
      );

    const result = await supabaseClient
      .from("products")
      .select("*")
      .eq("active", true)
      .order("name");

    if (result.error) {
      throw result.error;
    }

    products = result.data?.length
      ? result.data
      : SAMPLE_PRODUCTS;

    console.log("Products loaded:", products.length);

  } catch (error) {
    console.error(
      "Supabase product loading failed:",
      error
    );

    products = SAMPLE_PRODUCTS;

    showToast(
      "Using sample products because the catalogue could not be loaded."
    );
  }

  renderFilters();
  renderProducts();
  renderCart();
}

/* =========================================
   CLICK HANDLERS
========================================= */

document.addEventListener("click", (event) => {
  const categoryButton =
    event.target.closest("[data-category]");

  if (categoryButton) {
    selectedCategory = categoryButton.dataset.category;

    renderFilters();
    renderProducts();

    return;
  }

  const leashAddButton =
    event.target.closest("[data-leash-add]");

  if (leashAddButton) {
    const card = leashAddButton.closest(".product-card");

    const sizeSelect =
      card?.querySelector("[data-leash-size]");

    if (sizeSelect) {
      addToCart(sizeSelect.value);
    }

    return;
  }

  const addButton =
    event.target.closest("[data-add]");

  if (addButton) {
    addToCart(addButton.dataset.add);
    return;
  }

  const plusButton =
    event.target.closest("[data-plus]");

  if (plusButton) {
    updateQuantity(plusButton.dataset.plus, 1);
    return;
  }

  const minusButton =
    event.target.closest("[data-minus]");

  if (minusButton) {
    updateQuantity(minusButton.dataset.minus, -1);
    return;
  }

  if (event.target.closest("[data-close-cart]")) {
    closeCart();
  }
});

/* =========================================
   SEARCH
========================================= */

const searchInput = $("#search");

if (searchInput) {
  searchInput.addEventListener("input", renderProducts);
}

/* =========================================
   BAG BUTTON
========================================= */

const bagButton = $("#bag-button");

if (bagButton) {
  bagButton.addEventListener("click", openCart);
}

/* =========================================
   NEWSLETTER
========================================= */

const newsletter = $("#newsletter");

if (newsletter) {
  newsletter.addEventListener("submit", (event) => {
    event.preventDefault();

    showToast(
      "You are on the list — a little treat is on its way."
    );

    event.target.reset();
  });
}

/*
Checkout is handled by auth.js.

Do not add another checkout handler here.
*/

initMonthlySpecials();
loadProducts();

/* =========================================
   VERIFIED PURCHASE VERIFICATION
========================================= */

async function verifyPurchase(paymentId, attempts = 5) {
  if (!paymentId) {
    return null;
  }

  const config = window.PETSHOP_CONFIG || {};

  if (
    !config.supabaseUrl ||
    !config.supabasePublishableKey
  ) {
    console.error("Supabase configuration is missing.");
    return null;
  }

  const verifyUrl =
    `${config.supabaseUrl}/functions/v1/verify-purchase`;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(verifyUrl, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "apikey": config.supabasePublishableKey
        },

        body: JSON.stringify({ paymentId })
      });

      const result = await response.json();

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

    if (attempt < attempts - 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, 2000);
      });
    }
  }

  return null;
}

/* =========================================
   PAYFAST RETURN HANDLING
========================================= */

async function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);

  const payment = params.get("payment");
  const paymentId = params.get("payment_id");

  if (payment === "success") {
    if (!paymentId) {
      console.error(
        "Payment success returned without payment_id."
      );

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      showToast(
        "We could not verify this payment yet. Please contact us if you were charged."
      );

      return;
    }

    const verifiedPurchase =
      await verifyPurchase(paymentId, 5);

    if (
      verifiedPurchase &&
      verifiedPurchase.paid === true
    ) {
      const trackingKey =
        `paws-ga4-purchase-${paymentId}`;

      const alreadyTracked =
        localStorage.getItem(trackingKey) === "1";

      if (!alreadyTracked) {
        trackGA4("purchase", {
          transaction_id:
            String(verifiedPurchase.orderId),

          currency:
            verifiedPurchase.currency || "ZAR",

          value:
            Number(verifiedPurchase.value || 0),

          shipping:
            Number(verifiedPurchase.shipping || 0),

          items:
            Array.isArray(verifiedPurchase.items)
              ? verifiedPurchase.items
              : []
        });

        localStorage.setItem(trackingKey, "1");

        console.log(
          "GA4 purchase sent:",
          verifiedPurchase
        );
      }

      cart = {};

      localStorage.removeItem("moss-mud-cart");

      renderCart();

      showPaymentSuccess();

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      return;
    }

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

  if (payment === "cancelled") {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    showToast("Your payment was cancelled.");
  }
}

/* =========================================
   SUCCESS MESSAGE
========================================= */

function showPaymentSuccess() {
  const existing =
    document.getElementById("payment-success");

  if (existing) {
    existing.remove();
  }

  const message = document.createElement("div");

  message.id = "payment-success";

  message.innerHTML = `
    <div
      style="
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.55);
        display:flex;
        align-items:center;
        justify-content:center;
        z-index:99999;
        padding:20px;
      "
    >

      <div
        style="
          background:#fff;
          max-width:500px;
          width:100%;
          border-radius:20px;
          padding:40px 30px;
          text-align:center;
          box-shadow:0 20px 60px rgba(0,0,0,0.25);
        "
      >

        <div
          style="
            width:64px;
            height:64px;
            margin:0 auto 20px;
            border-radius:50%;
            background:#3e4e3b;
            color:white;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:32px;
          "
        >
          ✓
        </div>

        <p
          style="
            margin:0 0 10px;
            font-size:13px;
            letter-spacing:2px;
            text-transform:uppercase;
            opacity:.65;
          "
        >
          Order confirmed
        </p>

        <h2
          style="
            margin:0 0 15px;
            font-size:30px;
          "
        >
          Congratulations on your purchase!
        </h2>

        <p
          style="
            margin:0 0 25px;
            line-height:1.6;
            opacity:.75;
          "
        >
          Thank you for shopping with
          Paws Incorporated.
          Your payment was successful and
          your order has been received.
        </p>

        <button
          id="success-continue"
          type="button"
          style="
            border:0;
            border-radius:999px;
            padding:14px 25px;
            background:#3e4e3b;
            color:white;
            cursor:pointer;
            font-size:15px;
          "
        >
          Continue shopping
        </button>

      </div>
    </div>
  `;

  document.body.appendChild(message);

  const continueButton =
    document.getElementById("success-continue");

  if (continueButton) {
    continueButton.addEventListener("click", () => {
      message.remove();
    });
  }
}

/* =========================================
   START PAYFAST RETURN CHECK
========================================= */

handlePaymentReturn();
