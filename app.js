alert("TEST 123");
alert("APP.JS IS RUNNING");
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

let cart = {};

try {
cart = JSON.parse(
localStorage.getItem("moss-mud-cart") || "{}"
);
} catch (error) {
console.error("Cart loading failed:", error);
cart = {};
}

const $ = (selector) =>
document.querySelector(selector);

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
return String(value ?? "").replace(
/[&<>'"]/g,
(character) => {
return {
"&": "&",
"<": "<",
">": ">",
"'": "'",
'"': """
}[character];
}
);
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

filters.innerHTML = CATEGORIES.map(
(category) => `       <button
        class="filter ${
          selectedCategory === category
            ? "active"
            : ""
        }"
        data-category="${escapeHtml(category)}"
        type="button"       >
        ${escapeHtml(category)}       </button>
    `
).join("");
}

function renderProducts() {
const grid = $("#product-grid");

if (!grid) {
console.error(
'Could not find "#product-grid" in index.html'
);
return;
}

const pieceCount = $("#piece-count");
const searchInput = $("#search");

const searchTerm = searchInput
? searchInput.value.trim().toLowerCase()
: "";

const filteredProducts = products.filter(
(product) => {
const matchesCategory =
selectedCategory === "All pieces" ||
product.category === selectedCategory;

```
  const searchableText = `
    ${product.name || ""}
    ${product.category || ""}
    ${product.description || ""}
    ${product.badge || ""}
  `.toLowerCase();

  const matchesSearch =
    !searchTerm ||
    searchableText.includes(searchTerm);

  return (
    matchesCategory &&
    matchesSearch
  );
}
```

);

if (pieceCount) {
pieceCount.textContent =
`${filteredProducts.length} ${
        filteredProducts.length === 1
          ? "piece"
          : "pieces"
      }`;
}

if (!filteredProducts.length) {
grid.innerHTML = `       <div class="empty">
        No pieces found.       </div>
    `;

```
return;
```

}

grid.innerHTML = filteredProducts
.map((product) => {
const badge = product.badge
? `           <span>
            ${escapeHtml(product.badge)}           </span>
        `
: "";

```
  return `
    <article class="product-card">

      <div class="product-image">

        <img
          src="${escapeHtml(
            product.image_url
          )}"
          alt="${escapeHtml(
            product.name
          )}"
          loading="lazy"
        >

        ${badge}

        <button
          type="button"
          data-add="${escapeHtml(
            product.id
          )}"
          aria-label="Add ${escapeHtml(
            product.name
          )} to bag"
        >
          +
        </button>

      </div>

      <div class="product-info">

        <div>

          <small>
            ${escapeHtml(
              product.category || ""
            )}
          </small>

          <h3>
            ${escapeHtml(
              product.name
            )}
          </h3>

        </div>

        <b>
          ${money(product.price_zar)}
        </b>

        <p>
          ${escapeHtml(
            product.description || ""
          )}
        </p>

      </div>

    </article>
  `;
})
.join("");
```

}

function renderCart() {
const cartItems = $("#cart-items");
const cartTotal = $("#cart-total");
const bagCount = $("#bag-count");

const items = Object.values(cart);

const totalQuantity = items.reduce(
(total, item) =>
total +
Number(item.quantity || 0),
0
);

const totalPrice = items.reduce(
(total, item) =>
total +
Number(item.price_zar || 0) *
Number(item.quantity || 0),
0
);

if (bagCount) {
bagCount.textContent = totalQuantity;
}

if (cartTotal) {
cartTotal.textContent =
money(totalPrice);
}

if (!cartItems) return;

if (!items.length) {
cartItems.innerHTML = ` <div class="empty-cart">

```
    <h3>
      Your bag is waiting.
    </h3>

    <p>
      Add something lovely for your pet to get started.
    </p>

  </div>
`;

return;
```

}

cartItems.innerHTML = items
.map((item) => {
const quantity =
Number(item.quantity || 0);

```
  return `
    <div class="cart-row">

      <img
        src="${escapeHtml(
          item.image_url
        )}"
        alt="${escapeHtml(
          item.name
        )}"
      >

      <div>

        <div class="cart-title">

          <span>
            ${escapeHtml(
              item.name
            )}
          </span>

          <b>
            ${money(
              Number(
                item.price_zar || 0
              ) * quantity
            )}
          </b>

        </div>

        <small>
          ${escapeHtml(
            item.category || ""
          )}
        </small>

        <div class="quantity">

          <button
            type="button"
            data-minus="${escapeHtml(
              item.id
            )}"
          >
            −
          </button>

          <span>
            ${quantity}
          </span>

          <button
            type="button"
            data-plus="${escapeHtml(
              item.id
            )}"
          >
            +
          </button>

        </div>

      </div>

    </div>
  `;
})
.join("");
```

}

function addToCart(productId) {
const product = products.find(
(item) =>
String(item.id) ===
String(productId)
);

if (!product) {
showToast(
"Product could not be found."
);
return;
}

cart[productId] = {
...product,
quantity:
Number(
cart[productId]?.quantity || 0
) + 1
};

saveCart();

showToast(
`${product.name} added to your bag`
);
}

function updateQuantity(
productId,
change
) {
if (!cart[productId]) return;

cart[productId].quantity =
Number(
cart[productId].quantity || 0
) + change;

if (
cart[productId].quantity < 1
) {
delete cart[productId];
}

saveCart();
}

function openCart() {
const drawer = $("#cart-drawer");

if (!drawer) return;

drawer.classList.add("open");

drawer.setAttribute(
"aria-hidden",
"false"
);
}

function closeCart() {
const drawer = $("#cart-drawer");

if (!drawer) return;

drawer.classList.remove("open");

drawer.setAttribute(
"aria-hidden",
"true"
);
}

async function loadProducts() {
/*
Start with the sample products.

```
This means the store can still display
products even if Supabase takes too long
or temporarily fails.
```

*/

products = SAMPLE_PRODUCTS;

renderFilters();
renderProducts();
renderCart();

console.log(
"Sample products displayed."
);

const config =
window.PETSHOP_CONFIG || {};

try {
if (
!config.supabaseUrl ||
!config.supabasePublishableKey
) {
throw new Error(
"Supabase configuration is missing."
);
}

```
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

const result =
  await supabaseClient
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name");

if (result.error) {
  throw result.error;
}

if (
  Array.isArray(result.data) &&
  result.data.length > 0
) {
  products = result.data;

  console.log(
    "Supabase products loaded:",
    products.length
  );

  renderProducts();
  renderCart();
} else {
  console.log(
    "No active Supabase products found. Keeping sample products."
  );
}
```

} catch (error) {
console.error(
"Supabase product loading failed:",
error
);

```
/*
  Keep the sample products already
  displayed instead of leaving the
  store empty.
*/

products = SAMPLE_PRODUCTS;

renderProducts();
renderCart();
```

}
}

document.addEventListener(
"click",
(event) => {

```
const categoryButton =
  event.target.closest(
    "[data-category]"
  );

if (categoryButton) {
  selectedCategory =
    categoryButton.dataset.category;

  renderFilters();
  renderProducts();

  return;
}

const addButton =
  event.target.closest(
    "[data-add]"
  );

if (addButton) {
  addToCart(
    addButton.dataset.add
  );

  return;
}

const plusButton =
  event.target.closest(
    "[data-plus]"
  );

if (plusButton) {
  updateQuantity(
    plusButton.dataset.plus,
    1
  );

  return;
}

const minusButton =
  event.target.closest(
    "[data-minus]"
  );

if (minusButton) {
  updateQuantity(
    minusButton.dataset.minus,
    -1
  );

  return;
}

if (
  event.target.closest(
    "[data-close-cart]"
  )
) {
  closeCart();
}
```

}
);

const searchInput =
$("#search");

if (searchInput) {
searchInput.addEventListener(
"input",
renderProducts
);
}

const bagButton =
$("#bag-button");

if (bagButton) {
bagButton.addEventListener(
"click",
openCart
);
}

const newsletter =
$("#newsletter");

if (newsletter) {
newsletter.addEventListener(
"submit",
(event) => {

```
  event.preventDefault();

  showToast(
    "You are on the list — a little treat is on its way."
  );

  event.target.reset();
}
```

);
}

/*
PAYFAST RETURN
*/

function handlePaymentReturn() {

const params =
new URLSearchParams(
window.location.search
);

const payment =
params.get("payment");

if (payment === "success") {

```
/*
  Empty the cart.
*/

cart = {};

localStorage.removeItem(
  "moss-mud-cart"
);

renderCart();

/*
  Show congratulations.
*/

showPaymentSuccessMessage();

/*
  Remove payment=success
  from the URL.
*/

window.history.replaceState(
  {},
  document.title,
  window.location.pathname
);

return;
```

}

if (payment === "cancelled") {

```
window.history.replaceState(
  {},
  document.title,
  window.location.pathname
);

showToast(
  "Payment was cancelled. Your bag has been kept."
);
```

}
}

/*
PAYFAST SUCCESS MESSAGE
*/

function showPaymentSuccessMessage() {

/*
Prevent duplicates.
*/

if (
document.querySelector(
"#payment-success-message"
)
) {
return;
}

const message =
document.createElement("div");

message.id =
"payment-success-message";

message.innerHTML = ` <div
   style="
     position: fixed;
     top: 20px;
     left: 50%;
     transform: translateX(-50%);
     width: calc(100% - 40px);
     max-width: 520px;
     background: white;
     border-radius: 18px;
     padding: 28px;
     box-shadow: 0 15px 45px rgba(0,0,0,0.18);
     z-index: 99999;
     text-align: center;
     border: 1px solid rgba(0,0,0,0.08);
   "
 >

```
  <div
    style="
      font-size: 42px;
      margin-bottom: 10px;
    "
  >
    🎉
  </div>

  <h2
    style="
      margin: 0 0 10px;
      font-size: 26px;
    "
  >
    Congratulations on your purchase!
  </h2>

  <p
    style="
      margin: 0 0 20px;
      line-height: 1.6;
    "
  >
    Your payment was successful and
    your order has been received.
  </p>

  <button
    id="close-payment-success"
    type="button"
    style="
      border: none;
      border-radius: 10px;
      padding: 12px 22px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
    "
  >
    Continue shopping
  </button>

</div>
```

`;

document.body.appendChild(
message
);

const closeButton =
document.querySelector(
"#close-payment-success"
);

if (closeButton) {
closeButton.addEventListener(
"click",
() => {
message.remove();
}
);
}
}

/*
START THE STORE
*/

loadProducts();

/*
Check for a PayFast return.
*/

window.addEventListener(
"load",
() => {
handlePaymentReturn();
}
);
