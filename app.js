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

const $ = (selector) =>
document.querySelector(selector);

const money = (value) => {
return `R${Number(value).toLocaleString("en-ZA")}`;
};

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
"&": "&",
"<": "<",
">": ">",
"'": "'",
'"': """
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

filters.innerHTML =
CATEGORIES.map((category) => {
return `         <button
          class="filter ${
            selectedCategory === category
              ? "active"
              : ""
          }"
          data-category="${escapeHtml(category)}"         >
          ${escapeHtml(category)}         </button>
      `;
}).join("");
}

/* =========================================
PRODUCTS
========================================= */

function renderProducts() {
const grid = $("#product-grid");

const pieceCount = $("#piece-count");

const searchInput = $("#search");

if (!grid) return;

const searchTerm =
searchInput
? searchInput.value
.trim()
.toLowerCase()
: "";

const filteredProducts =
products.filter((product) => {


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

  return (
    matchesCategory &&
    matchesSearch
  );
});


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


return;


}

grid.innerHTML =
filteredProducts
.map((product) => {


    const badge =
      product.badge
        ? `
          <span>
            ${escapeHtml(
              product.badge
            )}
          </span>
        `
        : "";

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
            ${money(
              product.price_zar
            )}
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

const totalQuantity =
items.reduce(
(total, item) => {
return (
total +
Number(
item.quantity || 0
)
);
},
0
);

const subtotal =
items.reduce(
(total, item) => {
return (
total +
Number(
item.price_zar || 0
) *
Number(
item.quantity || 0
)
);
},
0
);

/*
R89 shipping applies to every order.


Empty cart = R0 shipping.
Cart with products = R89 shipping.


*/

const shipping =
items.length > 0
? SHIPPING_FEE
: 0;

const finalTotal =
subtotal + shipping;

/* =======================================
UPDATE BAG COUNT
======================================= */

if (bagCount) {
bagCount.textContent =
totalQuantity;
}

/* =======================================
UPDATE SUBTOTAL
======================================= */

if (cartSubtotal) {
cartSubtotal.textContent =
money(subtotal);
}

/* =======================================
UPDATE SHIPPING
======================================= */

if (cartShipping) {
cartShipping.textContent =
money(shipping);
}

/* =======================================
UPDATE FINAL TOTAL
======================================= */

if (cartTotal) {
cartTotal.textContent =
money(finalTotal);
}

/* =======================================
EMPTY CART
======================================= */

if (!items.length) {
cartItems.innerHTML = ` <div class="empty-cart">


    <h3>
      Your bag is waiting.
    </h3>

    <p>
      Add something lovely for your pet to get started.
    </p>

  </div>
`;

return;


}

/* =======================================
CART ITEMS
======================================= */

cartItems.innerHTML =
items
.map((item) => {


    const quantity =
      Number(
        item.quantity || 0
      );

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
                ) *
                  quantity
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
              aria-label="Decrease quantity"
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

/* =========================================
ADD TO CART
========================================= */

function addToCart(productId) {
const product =
products.find((item) => {
return (
String(item.id) ===
String(productId)
);
});

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
    cart[productId]?.quantity ||
    0
  ) + 1


};

saveCart();

showToast(
`${product.name} added to your bag`
);
}

/* =========================================
UPDATE QUANTITY
========================================= */

function updateQuantity(
productId,
change
) {
if (!cart[productId]) return;

cart[productId].quantity =
Number(
cart[productId].quantity ||
0
) + change;

if (
cart[productId].quantity < 1
) {
delete cart[productId];
}

saveCart();
}

/* =========================================
OPEN CART
========================================= */

function openCart() {
const drawer =
$("#cart-drawer");

if (!drawer) return;

drawer.classList.add("open");

drawer.setAttribute(
"aria-hidden",
"false"
);
}

/* =========================================
CLOSE CART
========================================= */

function closeCart() {
const drawer =
$("#cart-drawer");

if (!drawer) return;

drawer.classList.remove(
"open"
);

drawer.setAttribute(
"aria-hidden",
"true"
);
}

/* =========================================
LOAD PRODUCTS
========================================= */

async function loadProducts() {
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
    .eq(
      "active",
      true
    )
    .order("name");

if (result.error) {
  throw result.error;
}

products =
  result.data?.length
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

products =
  SAMPLE_PRODUCTS;

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

document.addEventListener(
"click",
(event) => {


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


}
);

/* =========================================
SEARCH
========================================= */

const searchInput =
$("#search");

if (searchInput) {

searchInput.addEventListener(
"input",
renderProducts
);
}

/* =========================================
BAG BUTTON
========================================= */

const bagButton =
$("#bag-button");

if (bagButton) {

bagButton.addEventListener(
"click",
openCart
);
}

/* =========================================
NEWSLETTER
========================================= */

const newsletter =
$("#newsletter");

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

/*
Checkout is handled by auth.js.

auth.js checks whether the customer
is signed in and then securely sends
the order to the Supabase Edge Function.

Do NOT add another checkout handler
here because that would bypass the
login protection.
*/

loadProducts();

/* =========================================
PAYFAST RETURN HANDLING
========================================= */

function handlePaymentReturn() {

const params = new URLSearchParams(
window.location.search
);

const payment =
params.get("payment");

/* -----------------------------
SUCCESSFUL PAYMENT
----------------------------- */

if (payment === "success") {


cart = {};

localStorage.removeItem(
  "moss-mud-cart"
);

renderCart();

showPaymentSuccess();

window.history.replaceState(
  {},
  document.title,
  window.location.pathname
);


}

/* -----------------------------
CANCELLED PAYMENT
----------------------------- */

if (payment === "cancelled") {


window.history.replaceState(
  {},
  document.title,
  window.location.pathname
);

showToast(
  "Your payment was cancelled."
);


}
}

/* =========================================
SUCCESS MESSAGE
========================================= */

function showPaymentSuccess() {

const existing =
document.getElementById(
"payment-success"
);

if (existing) {
existing.remove();
}

const message =
document.createElement("div");

message.id =
"payment-success";

message.innerHTML = ` <div
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

document.body.appendChild(
message
);

const continueButton =
document.getElementById(
"success-continue"
);

if (continueButton) {


continueButton.addEventListener(
  "click",
  () => {
    message.remove();
  }
);


}
}

/* =========================================
CHECK FOR PAYFAST RETURN
========================================= */

handlePaymentReturn();
