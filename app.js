const SAMPLE_PRODUCTS = [
  {
    id: "moss-bed",
    name: "Moss cloud bed",
    category: "Rest",
    price_zar: 699,
    badge: "Bestseller",
    image_url:
      "https://images.unsplash.com/photo-1522444195799-478538b28823?auto=format&fit=crop&w=900&q=85",
    description: "A washable, cloud-soft landing spot for serious snoozers."
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

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => {
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
  $("#filters").innerHTML = CATEGORIES.map((category) => {
    return `
      <button
        class="filter ${
          selectedCategory === category ? "active" : ""
        }"
        data-category="${category}"
      >
        ${category}
      </button>
    `;
  }).join("");
}
function addToCart(productId) {
  const product = products.find((item) => {
    return item.id === productId;
  });

  if (!product) return;

  cart[productId] = {
    ...product,
    quantity: (cart[productId]?.quantity || 0) + 1
  };

  saveCart();
  showToast(`${product.name} added to your bag`);
}

function updateQuantity(productId, change) {
  if (!cart[productId]) return;

  cart[productId].quantity += change;

  if (cart[productId].quantity < 1) {
    delete cart[productId];
  }

  saveCart();
}

function openCart() {
  $("#cart-drawer").classList.add("open");
  $("#cart-drawer").setAttribute("aria-hidden", "false");
}

function closeCart() {
  $("#cart-drawer").classList.remove("open");
  $("#cart-drawer").setAttribute("aria-hidden", "true");
}

async function loadProducts() {
  const config = window.PETSHOP_CONFIG || {};
try {
    const supabaseClient = window.supabase.createClient(
      config.supabaseUrl,
      config.supabasePublishableKey
    );

    const result = await supabaseClient
      .from("products")
      .select(
        "id,sku,name,description,image_url,price_zar,category,badge"
      )
      .eq("active", true)
      .order("name");

    if (result.error) {
      throw result.error;
    }

    products = result.data?.length
      ? result.data
      : SAMPLE_PRODUCTS;
  } catch (error) {
    console.info(
      "Using sample catalogue until Supabase products are seeded.",
      error.message
    );

    products = SAMPLE_PRODUCTS;
  }

  renderFilters();
  renderProducts();
  renderCart();
}

document.addEventListener("click", (event) => {
  const categoryButton =
    event.target.closest("[data-category]");

  if (categoryButton) {
    selectedCategory = categoryButton.dataset.category;
    renderFilters();
    renderProducts();
  }

  const addButton = event.target.closest("[data-add]");

  if (addButton) {
    addToCart(addButton.dataset.add);
  }

  const plusButton = event.target.closest("[data-plus]");

  if (plusButton) {
    updateQuantity(plusButton.dataset.plus, 1);
  }

  const minusButton = event.target.closest("[data-minus]");

  if (minusButton) {
    updateQuantity(minusButton.dataset.minus, -1);
  }
if (event.target.closest("[data-close-cart]")) {
    closeCart();
  }
});

$("#search").addEventListener("input", renderProducts);

$("#bag-button").addEventListener("click", openCart);

$("#newsletter").addEventListener("submit", (event) => {
  event.preventDefault();

  showToast(
    "You are on the list — a little treat is on its way."
  );

  event.target.reset();
});

$("#checkout").addEventListener("click", async () => {
  const items = Object.values(cart);
  const config = window.PETSHOP_CONFIG || {};

  if (!items.length) {
    showToast("Add a piece to your bag first.");
    return;
  }

  const firstName = window.prompt("First name:");

  if (!firstName) return;

  const lastName = window.prompt("Last name:");

  if (!lastName) return;

  const email = window.prompt("Email address:");

  if (!email) return;

  showToast("Creating your secure PayFast Sandbox checkout...");

  try {
    const response = await fetch(
      config.checkoutFunctionUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.supabasePublishableKey
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          items: items.map((item) => {
            return {
              productId: item.id,
              quantity: item.quantity
            };
          })
        })
      }
    );
const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || "Checkout failed"
      );
    }

    const form = document.createElement("form");

    form.method = "POST";
    form.action = result.action;

    Object.entries(result.fields).forEach(([name, value]) => {
      const input = document.createElement("input");

      input.type = "hidden";
      input.name = name;
      input.value = value;

      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  } catch (error) {
    showToast(
      error.message || "Checkout failed"
    );
  }
});

loadProducts();
