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

let products = [];
let selectedCategory = "All pieces";

let cart = JSON.parse(
  localStorage.getItem("moss-mud-cart") || "{}"
);

const $ = (selector) => document.querySelector(selector);

const money = (value) => {
  return `R${Number(value).toLocaleString("en-ZA")}`;
};

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

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[character];
  });
}

function saveCart() {
  localStorage.setItem(
    "moss-mud-cart",
    JSON.stringify(cart)
  );

  renderCart();
}

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
    `.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      searchableText.includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  if (pieceCount) {
    pieceCount.textContent =
      `${filteredProducts.length} ${
        filteredProducts.length === 1 ? "piece" : "pieces"
      }`;
  }

  if (!filteredProducts.length) {
    grid.innerHTML = `
      <div class="empty">
        No pieces found.
      </div>
    `;

    return;
  }

  grid.innerHTML = filteredProducts
    .map((product) => {
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

            <b>
              ${money(product.price_zar)}
            </b>

            <p>
              ${escapeHtml(product.description || "")}
            </p>

          </div>

        </article>
      `;
    })
    .join("");
}

function renderCart() {
  const cartItems = $("#cart-items");
  const cartTotal = $("#cart-total");
  const bagCount = $("#bag-count");

  if (!cartItems) return;

  const items = Object.values(cart);

  const totalQuantity = items.reduce((total, item) => {
    return total + Number(item.quantity || 0);
  }, 0);

  const totalPrice = items.reduce((total, item) => {
    return (
      total +
      Number(item.price_zar || 0) *
        Number(item.quantity || 0)
    );
  }, 0);

  if (bagCount) {
    bagCount.textContent = totalQuantity;
  }

  if (cartTotal) {
    cartTotal.textContent = money(totalPrice);
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

  cartItems.innerHTML = items
    .map((item) => {
      const quantity = Number(item.quantity || 0);

      return `
        <div class="cart-row">

          <img
            src="${escapeHtml(item.image_url)}"
            alt="${escapeHtml(item.name)}"
          >

          <div>

            <div class="cart-title">
              <span>
                ${escapeHtml(item.name)}
              </span>

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

              <span>
                ${quantity}
              </span>

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
    })
    .join("");
}

function addToCart(productId) {
  const product = products.find((item) => {
    return String(item.id) === String(productId);
  });

  if (!product) {
    showToast("Product could not be found.");
    return;
  }

  cart[productId] = {
    ...product,
    quantity:
      Number(cart[productId]?.quantity || 0) + 1
  };

  saveCart();

  showToast(
    `${product.name} added to your bag`
  );
}

function updateQuantity(productId, change) {
  if (!cart[productId]) return;

  cart[productId].quantity =
    Number(cart[productId].quantity || 0) + change;

  if (cart[productId].quantity < 1) {
    delete cart[productId];
  }

  saveCart();
}

function openCart() {
  const drawer = $("#cart-drawer");

  if (!drawer) return;

  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  const drawer = $("#cart-drawer");

  if (!drawer) return;

  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

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
  .select("*");

document.body.insertAdjacentHTML(
  "afterbegin",
  `<div style="
    position:fixed;
    top:0;
    left:0;
    right:0;
    z-index:999999;
    background:#111;
    color:white;
    padding:20px;
    font-size:16px;
    line-height:1.5;
  ">
    Supabase test:<br>
    Error: ${result.error ? result.error.message : "NONE"}<br>
    Products returned: ${result.data ? result.data.length : "NO DATA"}
  </div>`
);

if (result.error) {
  throw result.error;
}
      )
      .eq("active", true)
      .order("name");

    if (result.error) {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div style="
      position:fixed;
      top:0;
      left:0;
      right:0;
      z-index:999999;
      background:#8b0000;
      color:white;
      padding:20px;
      font-size:16px;
      line-height:1.5;
    ">
      SUPABASE ERROR:<br>
      ${result.error.message}
    </div>`
  );

  throw result.error;
}

    products = result.data?.length
      ? result.data
      : SAMPLE_PRODUCTS;

    console.log(
      "Products loaded:",
      products.length
    );

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

document.addEventListener("click", (event) => {
  const categoryButton =
    event.target.closest("[data-category]");

  if (categoryButton) {
    selectedCategory =
      categoryButton.dataset.category;

    renderFilters();
    renderProducts();

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
    updateQuantity(
      plusButton.dataset.plus,
      1
    );

    return;
  }

  const minusButton =
    event.target.closest("[data-minus]");

  if (minusButton) {
    updateQuantity(
      minusButton.dataset.minus,
      -1
    );

    return;
  }

  if (
    event.target.closest("[data-close-cart]")
  ) {
    closeCart();
  }
});

const searchInput = $("#search");

if (searchInput) {
  searchInput.addEventListener(
    "input",
    renderProducts
  );
}

const bagButton = $("#bag-button");

if (bagButton) {
  bagButton.addEventListener(
    "click",
    openCart
  );
}

const newsletter = $("#newsletter");

if (newsletter) {
  newsletter.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      showToast(
        "You are on the list — a little treat is on its way."
      );

      event.target.reset();
    }
  );
}

const checkoutButton = $("#checkout");

if (checkoutButton) {
  checkoutButton.addEventListener(
    "click",
    async () => {
      const items = Object.values(cart);
      const config =
        window.PETSHOP_CONFIG || {};

      if (!items.length) {
        showToast(
          "Add a piece to your bag first."
        );

        return;
      }

      if (!config.checkoutFunctionUrl) {
        showToast(
          "Checkout is not configured yet."
        );

        return;
      }

      const firstName =
        window.prompt("First name:");

      if (!firstName) return;

      const lastName =
        window.prompt("Last name:");

      if (!lastName) return;

      const email =
        window.prompt(
          "Email address:"
        );

      if (!email) return;

      showToast(
        "Creating your secure PayFast Sandbox checkout..."
      );

      try {
        const response = await fetch(
          config.checkoutFunctionUrl,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              apikey:
                config.supabasePublishableKey
            },

            body: JSON.stringify({
              firstName,
              lastName,
              email,

              items: items.map((item) => {
                return {
                  productId: item.id,
                  quantity:
                    Number(item.quantity || 0)
                };
              })
            })
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Checkout failed"
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

        const form =
          document.createElement("form");

        form.method = "POST";
        form.action = result.action;

        Object.entries(
          result.fields
        ).forEach(
          ([name, value]) => {
            const input =
              document.createElement(
                "input"
              );

            input.type = "hidden";
            input.name = name;
            input.value = value;

            form.appendChild(input);
          }
        );

        document.body.appendChild(form);

        form.submit();

      } catch (error) {
        console.error(
          "Checkout error:",
          error
        );

        showToast(
          error.message ||
            "Checkout failed"
        );
      }
    }
  );
}


loadProducts();
