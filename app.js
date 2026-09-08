const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz4aODjKbTsdIOmeGUfs95rnkpQflYIyr2pnDj_IESooK1UUqxJpW-8T3nfiabfJsTe/exec";
const firebaseConfig = {
  apiKey: "AIzaSyDzNHQGbsQNnVaVLRVN8LOC7Kv8nuU7QV4",
  authDomain: "the-glossary-store.firebaseapp.com",
  projectId: "the-glossary-store",
  storageBucket: "the-glossary-store.firebasestorage.app",
  messagingSenderId: "194291026497",
  appId: "1:194291026497:web:f01c8a6fb20e4d11ec14c0",
  measurementId: "G-G7KX4BE3DF"
};
const BKASH_NUMBER = "01309605986";
const DELIVERY_CHARGE = 80;
const FREE_DELIVERY_THRESHOLD = 3000;
const CART_KEY = "the-glossary-cart";
const PRODUCTS_CACHE_KEY = "the-glossary-products-cache-v3";
const PRODUCTS_CACHE_TTL = 10 * 60 * 1000;

const state = { products: [], cart: loadCart(), filter: "all", pendingOrder: null };
const OFFERS = [
  { tag: "Only at Sephora", title: "New KAYALI Fragrance", copy: "BOUQEE KITTY CARAMEL MILK. It. white chocolate and soft musk.", cta: "Shop Now", link: "#shop", bg: "#d64b7f", image: "https://images.unsplash.com/photo-1595777707802-00b950c34bc0?auto=format&fit=crop&w=800&q=85" },
  { tag: "", title: "Top Complexion Picks—Only at Sephora", copy: "Exclusives hit different.", cta: "Shop Now", link: "#shop", bg: "#9b8dc8", image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=85" }
];
let authUser = null;
let authReady = false;
const app = document.querySelector("#app");
const toast = document.querySelector(".toast");
const money = new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

function loadCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } }
function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); updateBagCount(); }
function updateBagCount() { document.querySelector(".bag-count").textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0); }
function formatMoney(value) { return money.format(value).replace("BDT", "BDT "); }
function getProduct(id) { return state.products.find(product => product.id === id); }
function cartSubtotal() { return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0); }
function deliveryCharge() { return cartSubtotal() >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE; }
function cartTotal() { return cartSubtotal() + deliveryCharge(); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])); }
function showToast(message) { toast.textContent = message; toast.classList.add("visible"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("visible"), 3200); }
function firebaseConfigured() { return firebaseConfig.apiKey !== "REPLACE_ME" && firebaseConfig.authDomain !== "REPLACE_ME" && firebaseConfig.projectId !== "REPLACE_ME"; }
function authErrorMessage(error) { const messages = { "auth/email-already-in-use": "An account already exists with this email.", "auth/invalid-email": "Enter a valid email address.", "auth/weak-password": "Choose a stronger password with at least 6 characters.", "auth/invalid-credential": "The email or password is incorrect.", "auth/user-not-found": "The email or password is incorrect.", "auth/wrong-password": "The email or password is incorrect.", "auth/popup-closed-by-user": "The Google sign-in window was closed.", "auth/popup-blocked": "Your browser blocked the Google sign-in window.", "auth/network-request-failed": "Check your internet connection and try again." }; return messages[error.code] || "We couldn't complete that request. Please try again."; }
function authNav() {
  const container = document.querySelector("#auth-nav");
  if (!container) return;
  container.innerHTML = authUser ? `<div class="account-menu"><button class="account-trigger" type="button" aria-expanded="false" aria-controls="account-dropdown">${escapeHtml(authUser.displayName || "My Account")} <span aria-hidden="true">⌄</span></button><div class="account-dropdown" id="account-dropdown"><a href="#account">My Account</a><button class="sign-out-button" type="button" id="sign-out">Sign out</button></div></div>` : `<a class="account-link" href="#account">Log in</a>`;
  const trigger = document.querySelector(".account-trigger");
  const menu = document.querySelector(".account-menu");
  trigger?.addEventListener("click", () => { const open = menu.classList.toggle("open"); trigger.setAttribute("aria-expanded", String(open)); });
  document.querySelector("#sign-out")?.addEventListener("click", () => firebase.auth().signOut());
}
const activeSprings = new WeakMap();
function springScale(element, from = 0.96) {
  if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const previousFrame = activeSprings.get(element);
  if (previousFrame) cancelAnimationFrame(previousFrame);
  const transform = getComputedStyle(element).transform;
  const currentScale = transform === "none" ? 1 : Number(transform.match(/^matrix\(([^,]+)/)?.[1]) || 1;
  let value = currentScale === 1 ? from : currentScale;
  let velocity = 0;
  let lastTime = performance.now();
  const response = 0.36;
  const omega = (2 * Math.PI) / response;
  const step = now => {
    const delta = Math.min((now - lastTime) / 1000, 0.032);
    lastTime = now;
    const acceleration = -2 * omega * velocity - omega * omega * (value - 1);
    velocity += acceleration * delta;
    value += velocity * delta;
    element.style.transform = `scale(${value})`;
    if (Math.abs(value - 1) < 0.001 && Math.abs(velocity) < 0.01) {
      element.style.transform = "";
      activeSprings.delete(element);
      return;
    }
    activeSprings.set(element, requestAnimationFrame(step));
  };
  activeSprings.set(element, requestAnimationFrame(step));
}
function animateCartFeedback() { springScale(document.querySelector(".bag-count"), 0.9); }
function productCard(product) { return `<article class="product-card"><a class="product-link" href="#product/${product.id}"><div class="product-image"><img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy"></div><div class="product-meta"><div><p class="product-category">${escapeHtml(product.category)}</p><h3>${escapeHtml(product.name)}</h3><p class="product-description">${escapeHtml(product.shortDescription)}</p></div><strong class="product-price">${formatMoney(product.price)}</strong></div></a></article>`; }
function offerCard(offer) { return `<article class="offer-card" style="background-color: ${offer.bg}; background-image: url('${offer.image}'); background-size: cover; background-position: center;"><div class="offer-overlay"></div><div class="offer-inner">${offer.tag ? `<p class="offer-tag">${escapeHtml(offer.tag)}</p>` : ""}<h3>${escapeHtml(offer.title)}</h3><p class="offer-copy">${escapeHtml(offer.copy)}</p><a class="offer-cta" href="${offer.link}">${escapeHtml(offer.cta)} →</a></div></article>`; }
function contactMarkup() { return `<section class="contact-section" id="contact"><div class="contact-intro"><p class="eyebrow">Get in touch</p><h2>Let’s talk<br>beauty.</h2><p>Questions about a product, an order, or finding your ritual? Leave us a note and our studio will get back to you.</p><a href="mailto:hello@theglossary.bd">hello@theglossary.bd</a></div><form class="contact-form" id="contact-form" novalidate><div class="field"><label for="contact-name">Your name *</label><input id="contact-name" name="name" autocomplete="name" required><span class="error-message"></span></div><div class="field"><label for="contact-email">Email address *</label><input id="contact-email" name="email" type="email" autocomplete="email" required><span class="error-message"></span></div><div class="field field-wide"><label for="contact-message">How can we help? *</label><textarea id="contact-message" name="message" required></textarea><span class="error-message"></span></div><button class="button" type="submit">Send your note →</button><p class="contact-status" role="status" aria-live="polite"></p></form></section>`; }
function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); updateBagCount(); animateCartFeedback(); }
function setView(html) { app.classList.remove("catalog-view"); app.innerHTML = html; window.scrollTo(0, 0); app.focus({ preventScroll: true }); }

function authView(error = "") {
  setView(`<section class="auth-page"><p class="eyebrow">Your account</p><h1>Beauty, kept personal.</h1><div class="auth-panel"><div class="auth-tabs"><button type="button" class="auth-tab active" data-auth-mode="login">Log in</button><button type="button" class="auth-tab" data-auth-mode="signup">Create account</button></div><div class="auth-message" role="alert">${escapeHtml(error)}</div><form id="auth-form"><div class="field"><label for="auth-email">Email address</label><input id="auth-email" type="email" autocomplete="email" required><span class="error-message"></span></div><div class="field"><label for="auth-password">Password</label><input id="auth-password" type="password" autocomplete="current-password" minlength="6" required><span class="error-message"></span></div><button class="button" type="submit" id="auth-submit">Log in</button></form><button class="google-button" type="button" id="google-sign-in">Continue with Google</button><button class="forgot-button" type="button" id="forgot-password">Forgot password?</button></div></section>`);
  if (!firebaseConfigured()) { document.querySelector(".auth-message").textContent = "Add your Firebase project configuration in app.js to enable accounts."; return; }
  let mode = "login";
  const form = document.querySelector("#auth-form");
  const submit = document.querySelector("#auth-submit");
  document.querySelectorAll("[data-auth-mode]").forEach(tab => tab.addEventListener("click", () => { mode = tab.dataset.authMode; document.querySelectorAll("[data-auth-mode]").forEach(item => item.classList.toggle("active", item === tab)); submit.textContent = mode === "login" ? "Log in" : "Create account"; document.querySelector("#auth-password").setAttribute("autocomplete", mode === "login" ? "current-password" : "new-password"); }));
  form.addEventListener("submit", async event => { event.preventDefault(); document.querySelectorAll(".auth-panel .error-message").forEach(message => message.textContent = ""); const email = document.querySelector("#auth-email").value.trim(); const password = document.querySelector("#auth-password").value; if (!email) { document.querySelector("#auth-email").nextElementSibling.textContent = "Enter your email address."; return; } if (password.length < 6) { document.querySelector("#auth-password").nextElementSibling.textContent = "Use at least 6 characters."; return; } submit.disabled = true; try { if (mode === "login") await firebase.auth().signInWithEmailAndPassword(email, password); else await firebase.auth().createUserWithEmailAndPassword(email, password); location.hash = "account"; } catch (authError) { document.querySelector(".auth-message").textContent = authErrorMessage(authError); } finally { submit.disabled = false; } });
  document.querySelector("#google-sign-in").addEventListener("click", async () => { try { await firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()); location.hash = "account"; } catch (authError) { document.querySelector(".auth-message").textContent = authErrorMessage(authError); } });
  document.querySelector("#forgot-password").addEventListener("click", async () => { const email = document.querySelector("#auth-email").value.trim(); if (!email) { document.querySelector("#auth-email").nextElementSibling.textContent = "Enter your email first."; return; } try { await firebase.auth().sendPasswordResetEmail(email); document.querySelector(".auth-message").textContent = "Password reset instructions sent. Check your email."; } catch (authError) { document.querySelector(".auth-message").textContent = authErrorMessage(authError); } });
}

async function accountView() {
  if (!authReady) { setView('<div class="loading-state"><span class="loader"></span><p>Opening your account...</p></div>'); return; }
  if (!authUser) { authView(); return; }
  setView(`<section class="account-page"><p class="eyebrow">My account</p><h1>Welcome back.</h1><div class="account-layout"><div class="account-card"><p class="eyebrow">Signed in as</p><h2>${escapeHtml(authUser.displayName || authUser.email || "Customer")}</h2><p>${escapeHtml(authUser.email || "")}</p><button class="button button-outline" type="button" id="account-sign-out">Sign out</button></div><div class="orders-card"><p class="eyebrow">Order history</p><h2>Your orders</h2><div id="order-history"><div class="loading-state"><span class="loader"></span><p>Loading your orders...</p></div></div></div></div></section>`);
  document.querySelector("#account-sign-out").addEventListener("click", () => firebase.auth().signOut());
  try { const response = await fetch(`${APPS_SCRIPT_URL}?action=myorders&uid=${encodeURIComponent(authUser.uid)}`); if (!response.ok) throw new Error(); const orders = await response.json(); document.querySelector("#order-history").innerHTML = Array.isArray(orders) && orders.length ? orders.map(order => `<article class="order-item"><strong>${escapeHtml(order.orderId || "Order")}</strong><span>${escapeHtml(order.timestamp || "")}</span><span>${escapeHtml(order.items || "")}</span><strong>${formatMoney(Number(order.total) || 0)}</strong></article>`).join("") : '<p class="account-muted">No orders yet.</p>'; } catch { document.querySelector("#order-history").innerHTML = '<p class="account-error">We could not load your order history right now.</p>'; }
}

function homeView() {
  const featured = state.products.slice(0, 4);
  setView(`<section class="hero"><img class="hero-image" src="https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1800&q=85" alt="A considered beauty ritual" fetchpriority="high"><div class="hero-copy"><p class="eyebrow">The Glossary / Vol. 01</p><h1>Beauty, edited for the everyday.</h1><p>Quietly effective essentials for skin, colour and the rituals between. Considered in Bangladesh, made to be lived in.</p><a class="button button-light" href="#shop">Enter the collection</a></div></section><section class="section"><div class="section-heading"><div><p class="eyebrow">The edit</p><h2>Keep close.</h2></div><p>A small wardrobe of formulas that make getting ready feel like a return to yourself.</p><a class="text-arrow" href="#shop">View all products →</a></div><div class="product-grid">${featured.map(productCard).join("")}</div></section><section class="offers-section" id="offers"><div class="section-heading" style="max-width: var(--max); margin: auto; padding: 0 4vw;"><div><p class="eyebrow">Offers</p><h2>What's on</h2></div></div><div class="offer-grid">${OFFERS.map(offerCard).join("")}</div></section>`);
  app.insertAdjacentHTML("beforeend", contactMarkup());
  bindContactForm();
}

function bindContactForm() {
  document.querySelector("#contact-form")?.addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const errors = { name: !String(data.get("name")).trim() ? "Please enter your name." : "", email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.get("email")).trim()) ? "Enter a valid email address." : "", message: String(data.get("message")).trim().length < 10 ? "Please write at least 10 characters." : "" };
    form.querySelectorAll(".field").forEach(field => { const input = field.querySelector("input, textarea"); field.querySelector(".error-message").textContent = errors[input.name]; field.classList.toggle("has-error", Boolean(errors[input.name])); });
    if (Object.values(errors).some(Boolean)) { form.querySelector(".has-error input, .has-error textarea")?.focus(); return; }
    const subject = encodeURIComponent(`Website enquiry from ${data.get("name")}`);
    const body = encodeURIComponent(`Name: ${data.get("name")}\nEmail: ${data.get("email")}\n\n${data.get("message")}`);
    window.location.href = `mailto:hello@theglossary.bd?subject=${subject}&body=${body}`;
    form.querySelector(".contact-status").textContent = "Your email app is opening with your note ready to send.";
  });
}

function catalogBounds() {
  const prices = state.products.map(product => Number(product.price)).filter(Number.isFinite);
  return { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };
}
function catalogFilters() {
  const params = new URLSearchParams(location.search);
  const bounds = catalogBounds();
  const categories = (params.get("categories") || "").split(",").map(category => category.trim().toLowerCase()).filter(Boolean);
  const requestedMin = params.has("min") ? Number(params.get("min")) : null;
  const requestedMax = params.has("max") ? Number(params.get("max")) : null;
  return {
    categories,
    min: Number.isFinite(requestedMin) ? Math.min(bounds.max, Math.max(bounds.min, requestedMin)) : bounds.min,
    max: Number.isFinite(requestedMax) ? Math.min(bounds.max, Math.max(bounds.min, requestedMax)) : bounds.max,
    inStock: params.get("stock") === "1",
    sort: ["relevance", "price-asc", "price-desc", "newest"].includes(params.get("sort")) ? params.get("sort") : "relevance"
  };
}
function catalogUrl(filters) {
  const params = new URLSearchParams();
  if (filters.categories.length) params.set("categories", filters.categories.join(","));
  const bounds = catalogBounds();
  if (filters.min > bounds.min) params.set("min", String(filters.min));
  if (filters.max < bounds.max) params.set("max", String(filters.max));
  if (filters.inStock) params.set("stock", "1");
  if (filters.sort !== "relevance") params.set("sort", filters.sort);
  return `${location.pathname}${params.toString() ? `?${params}` : ""}#shop`;
}
function updateCatalog(filters) { history.replaceState(null, "", catalogUrl(filters)); shopView(true); }
function filterCount(filters, bounds) { return filters.categories.length + (filters.min > bounds.min ? 1 : 0) + (filters.max < bounds.max ? 1 : 0) + (filters.inStock ? 1 : 0) + (filters.sort !== "relevance" ? 1 : 0); }
function filterChip(label, action) { return `<button class="filter-chip" type="button" data-chip="${action}">${escapeHtml(label)} <span aria-hidden="true">×</span></button>`; }
function shopView(preserveScroll = false) {
  const scrollPosition = preserveScroll ? window.scrollY : 0;
  const allCategories = [...new Set(state.products.map(product => String(product.category || "").trim().toLowerCase()).filter(Boolean))];
  const filters = catalogFilters();
  const bounds = catalogBounds();
  const hasStockData = state.products.some(product => Number.isFinite(Number(product.stock)));
  if (!hasStockData) filters.inStock = false;
  let products = state.products.filter(product => {
    const category = String(product.category || "").toLowerCase();
    const price = Number(product.price) || 0;
    const stockMatches = !filters.inStock || (Number.isFinite(Number(product.stock)) ? Number(product.stock) > 0 : true);
    return (!filters.categories.length || filters.categories.includes(category)) && price >= filters.min && price <= filters.max && stockMatches;
  });
  if (filters.sort === "price-asc") products.sort((a, b) => Number(a.price) - Number(b.price));
  if (filters.sort === "price-desc") products.sort((a, b) => Number(b.price) - Number(a.price));
  if (filters.sort === "newest") products.reverse();
  const count = filterCount(filters, bounds);
  const chips = [...filters.categories.map(category => filterChip(category, `category:${category}`))];
  if (filters.min > bounds.min) chips.push(filterChip(`From ${formatMoney(filters.min)}`, "min"));
  if (filters.max < bounds.max) chips.push(filterChip(`Up to ${formatMoney(filters.max)}`, "max"));
  if (filters.inStock) chips.push(filterChip("In stock", "stock"));
  if (filters.sort !== "relevance") chips.push(filterChip(filters.sort === "newest" ? "Newest" : filters.sort === "price-asc" ? "Price: low to high" : "Price: high to low", "sort"));
  const categoryControls = allCategories.map(category => `<label class="filter-check"><input type="checkbox" value="${escapeHtml(category)}" data-category-filter ${filters.categories.includes(category) ? "checked" : ""}><span>${escapeHtml(category)}</span></label>`).join("");
  setView(`<header class="catalog-header"><p class="eyebrow">The collection</p><h1>Everything<br>in its place.</h1></header><section class="catalog-controls"><details class="filter-panel" open><summary>Filter collection <span>${count ? `${count} applied` : "All products"}</span></summary><div class="filter-panel-body"><div class="filter-group"><p class="filter-label">Category</p><div class="filter-checks">${categoryControls || "<span class=\"filter-muted\">No categories available</span>"}</div></div><div class="filter-group price-group"><p class="filter-label">Price range <span>${formatMoney(filters.min)} – ${formatMoney(filters.max)}</span></p><div class="price-inputs"><input type="number" min="${bounds.min}" max="${bounds.max}" value="${filters.min}" data-price-min aria-label="Minimum price"><span>to</span><input type="number" min="${bounds.min}" max="${bounds.max}" value="${filters.max}" data-price-max aria-label="Maximum price"></div></div><label class="stock-toggle"><input type="checkbox" data-stock-filter ${filters.inStock ? "checked" : ""} ${hasStockData ? "" : "disabled"}><span>In stock only</span>${hasStockData ? "" : "<small>Stock data unavailable</small>"}</label><label class="sort-control"><span>Sort by</span><select data-sort-filter><option value="relevance" ${filters.sort === "relevance" ? "selected" : ""}>Relevance</option><option value="price-asc" ${filters.sort === "price-asc" ? "selected" : ""}>Price: low to high</option><option value="price-desc" ${filters.sort === "price-desc" ? "selected" : ""}>Price: high to low</option><option value="newest" ${filters.sort === "newest" ? "selected" : ""}>Newest</option></select></label></div></details><div class="active-filters">${chips.join("")}${count ? "<button class=\"clear-filters\" type=\"button\" data-clear-filters>Clear all filters</button>" : ""}</div></section><section class="section catalog-results" style="padding-top:52px"><div class="catalog-result-count">${products.length} ${products.length === 1 ? "product" : "products"}</div><div class="product-grid">${products.length ? products.map(productCard).join("") : `<div class="empty-state"><h2>No products match.</h2><p>Try widening your filters to see more of the collection.</p><button class="button" type="button" data-clear-filters>Clear all filters</button></div>`}</div></section>`);
  app.classList.add("catalog-view");
  const sortControl = document.querySelector(".sort-control");
  const filterBody = document.querySelector(".filter-panel-body");
  if (filterBody && sortControl) filterBody.prepend(sortControl);
  const minInput = document.querySelector("[data-price-min]");
  const maxInput = document.querySelector("[data-price-max]");
  if (minInput && filters.min === bounds.min) { minInput.value = ""; minInput.placeholder = String(bounds.min); }
  if (maxInput && filters.max === bounds.max) { maxInput.value = ""; maxInput.placeholder = String(bounds.max); }
  document.querySelectorAll("[data-category-filter]").forEach(input => input.addEventListener("change", () => { const next = catalogFilters(); next.categories = [...document.querySelectorAll("[data-category-filter]:checked")].map(item => item.value); updateCatalog(next); }));
  document.querySelector("[data-price-min]")?.addEventListener("change", event => { const next = catalogFilters(); next.min = Math.min(Number(event.target.value) || bounds.min, next.max); updateCatalog(next); });
  document.querySelector("[data-price-max]")?.addEventListener("change", event => { const next = catalogFilters(); next.max = Math.max(Number(event.target.value) || bounds.max, next.min); updateCatalog(next); });
  document.querySelector("[data-stock-filter]")?.addEventListener("change", event => { const next = catalogFilters(); next.inStock = event.target.checked; updateCatalog(next); });
  document.querySelector("[data-sort-filter]")?.addEventListener("change", event => { const next = catalogFilters(); next.sort = event.target.value; updateCatalog(next); });
  document.querySelectorAll("[data-clear-filters]").forEach(button => button.addEventListener("click", () => { history.replaceState(null, "", `${location.pathname}#shop`); state.filter = "all"; shopView(true); }));
  document.querySelectorAll("[data-chip]").forEach(chip => chip.addEventListener("click", () => { const next = catalogFilters(); const action = chip.dataset.chip; if (action.startsWith("category:")) next.categories = next.categories.filter(category => category !== action.slice(9)); if (action === "min") next.min = bounds.min; if (action === "max") next.max = bounds.max; if (action === "stock") next.inStock = false; if (action === "sort") next.sort = "relevance"; updateCatalog(next); }));
  if (preserveScroll) requestAnimationFrame(() => window.scrollTo(0, scrollPosition));
}

function productView(id) {
  const product = getProduct(id);
  if (!product) return shopView();
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const variantMarkup = variants.length ? `<div class="variant-field"><label for="detail-variant">${escapeHtml(product.shade || "Choose an option")}</label><select id="detail-variant">${variants.map(variant => `<option value="${escapeHtml(variant)}">${escapeHtml(variant)}</option>`).join("")}</select></div>` : "";
  setView(`<section class="detail"><p class="breadcrumb"><a href="#shop">Shop</a> / ${escapeHtml(product.name)}</p><div class="detail-layout"><div class="detail-gallery">${product.gallery.map((image, index) => `<img src="${image}" alt="${escapeHtml(product.name)} view ${index + 1}" ${index ? "loading=\"lazy\"" : ""}>`).join("")}</div><div class="detail-copy"><p class="eyebrow">${escapeHtml(product.category)} / ${escapeHtml(product.shade)}</p><h1>${escapeHtml(product.name)}</h1><p class="detail-price">${formatMoney(product.price)}</p><p class="detail-description">${escapeHtml(product.description)}</p><p class="detail-info">Free delivery in Dhaka over BDT 3,000. Nationwide delivery available.</p>${variantMarkup}<div class="quantity-row"><span>Quantity</span><div class="quantity-control"><button type="button" data-quantity="decrease" aria-label="Decrease quantity">−</button><input id="detail-quantity" type="number" value="1" min="1" max="10" aria-label="Quantity"><button type="button" data-quantity="increase" aria-label="Increase quantity">+</button></div></div><button class="button" id="add-detail">Add to bag</button></div></div></section>`);
  const quantity = document.querySelector("#detail-quantity");
  document.querySelector("[data-quantity=decrease]").addEventListener("click", () => { quantity.value = Math.max(1, Number(quantity.value) - 1); });
  document.querySelector("[data-quantity=increase]").addEventListener("click", () => { quantity.value = Math.min(10, Number(quantity.value) + 1); });
  document.querySelector("#add-detail").addEventListener("click", () => addToCart(product.id, Number(quantity.value), document.querySelector("#detail-variant")?.value || ""));
}

function addToCart(id, quantity = 1, variant = "") {
  const product = getProduct(id);
  const existing = state.cart.find(item => item.id === id && (item.variant || "") === variant);
  if (existing) existing.quantity = Math.min(10, existing.quantity + quantity);
  else state.cart.push({ id, name: product.name, price: product.price, image: product.image, variant, quantity });
  saveCart(); showToast(`${product.name}${variant ? ` (${variant})` : ""} added to your bag.`);
}
function cartView() {
  if (!state.cart.length) { setView(`<section class="cart-page"><p class="eyebrow">Your bag</p><h1>A little room<br>for something good.</h1><div class="empty-state"><p>Your bag is currently empty.</p><a class="button" href="#shop">Explore the collection</a></div></section>`); return; }
  setView(`<section class="cart-page"><p class="eyebrow">Your bag</p><h1>Take a moment.</h1><div class="cart-layout"><div>${state.cart.map(item => `<article class="cart-line" data-line="${item.id}" data-variant="${escapeHtml(item.variant || "")}"><img src="${item.image}" alt="${escapeHtml(item.name)}"><div><h3>${escapeHtml(item.name)}</h3>${item.variant ? `<p class="cart-variant">${escapeHtml(item.variant)}</p>` : ""}<p>${formatMoney(item.price)}</p><div class="line-actions"><div class="quantity-control"><button type="button" data-cart-action="decrease">−</button><input type="number" value="${item.quantity}" min="1" max="10" aria-label="Quantity of ${escapeHtml(item.name)}${item.variant ? ` ${escapeHtml(item.variant)}` : ""}"><button type="button" data-cart-action="increase">+</button></div><button type="button" class="remove-button" data-cart-action="remove">Remove</button></div></div><strong>${formatMoney(item.price * item.quantity)}</strong></article>`).join("")}</div>${summaryPanel("Proceed to checkout", "#checkout")}</div></section>`);
  document.querySelectorAll("[data-line]").forEach(line => line.addEventListener("click", event => updateLine(event, line.dataset.line, line.dataset.variant || "")));
  requestAnimationFrame(() => document.querySelectorAll(".cart-line").forEach(line => springScale(line, 0.985)));
}
function summaryPanel(buttonText, href) { return `<aside class="summary-panel"><h2>Summary</h2><div class="summary-row"><span>Subtotal</span><strong>${formatMoney(cartSubtotal())}</strong></div><div class="summary-row"><span>Delivery</span><strong>${deliveryCharge() ? formatMoney(deliveryCharge()) : "Complimentary"}</strong></div><div class="summary-row summary-total"><span>Total</span><strong>${formatMoney(cartTotal())}</strong></div><a class="button" href="${href}">${buttonText} →</a></aside>`; }
function updateLine(event, id, variant = "") { const action = event.target.dataset.cartAction; if (!action) return; const item = state.cart.find(line => line.id === id && (line.variant || "") === variant); if (action === "remove") state.cart = state.cart.filter(line => !(line.id === id && (line.variant || "") === variant)); if (action === "increase") item.quantity = Math.min(10, item.quantity + 1); if (action === "decrease") item.quantity = Math.max(1, item.quantity - 1); if (action === "change") item.quantity = Math.min(10, Math.max(1, Number(event.target.value) || 1)); saveCart(); cartView(); }

function checkoutView(error = "") {
  if (!state.cart.length) { location.hash = "cart"; return; }
  setView(`<section class="checkout-page"><p class="eyebrow">Secure checkout</p><h1>One last thoughtful step.</h1><div class="checkout-layout"><form id="checkout-form" novalidate><div class="form-section"><h2>Your details</h2><div class="form-grid"><div class="field"><label for="name">Full name *</label><input id="name" name="name" autocomplete="name"><span class="error-message"></span></div><div class="field"><label for="phone">Phone number *</label><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX"><span class="error-message"></span></div><div class="field field-wide"><label for="address">Delivery address *</label><textarea id="address" name="address" autocomplete="street-address"></textarea><span class="error-message"></span></div><div class="field"><label for="city">City / district *</label><input id="city" name="city" autocomplete="address-level2"><span class="error-message"></span></div><div class="field"><label for="notes">Notes <span>(optional)</span></label><input id="notes" name="notes"><span class="error-message"></span></div></div></div><div class="form-section"><h2>Payment</h2><div class="payment-options"><label class="payment-option"><input type="radio" name="payment" value="bkash" checked><span><strong>bKash</strong><small>Manual verification</small></span></label><label class="payment-option"><input type="radio" name="payment" value="cod"><span><strong>Cash on Delivery</strong><small>Pay when it arrives</small></span></label></div><div class="bkash-box" id="bkash-box"><p class="eyebrow">Complete your bKash payment</p><div class="bkash-number"><span>${BKASH_NUMBER}</span><button class="copy-button" type="button" id="copy-number">Copy number</button></div><p>Send <strong>${formatMoney(cartTotal())}</strong> to this number, then enter the Transaction ID below.</p><div class="field"><label for="trxid">bKash Transaction ID *</label><input id="trxid" name="trxid" autocomplete="off"><span class="error-message"></span></div></div></div>${error ? `<div class="error-banner" role="alert">${escapeHtml(error)}</div>` : ""}<div class="checkout-actions"><button class="button" type="submit" id="submit-order">Place order securely</button></div></form>${summaryPanel("Back to bag", "#cart")}</div></section>`);
  bindCheckout();
}
function bindCheckout() {
  const form = document.querySelector("#checkout-form");
  const bkashBox = document.querySelector("#bkash-box");
  const bkashMarkup = bkashBox.outerHTML;
  let pendingRemoval;
  document.querySelectorAll("input[name=payment]").forEach(input => input.addEventListener("change", () => {
    if (!input.checked) return;
    if (input.value === "cod") {
      const currentBox = document.querySelector("#bkash-box");
      if (currentBox) {
        currentBox.classList.add("is-exiting");
        clearTimeout(pendingRemoval);
        pendingRemoval = setTimeout(() => currentBox.remove(), 360);
      }
    }
    if (input.checked && input.value === "bkash" && !document.querySelector("#bkash-box")) {
      document.querySelector(".payment-options").insertAdjacentHTML("afterend", bkashMarkup);
      const nextBox = document.querySelector("#bkash-box");
      nextBox.classList.add("is-entering");
      requestAnimationFrame(() => nextBox.classList.remove("is-entering"));
      document.querySelector("#copy-number").addEventListener("click", copyBkashNumber);
    } else if (input.value === "bkash") {
      clearTimeout(pendingRemoval);
      document.querySelector("#bkash-box")?.classList.remove("is-exiting");
    }
  }));
  async function copyBkashNumber(event) { try { await navigator.clipboard.writeText(BKASH_NUMBER); event.target.textContent = "Copied"; setTimeout(() => event.target.textContent = "Copy number", 1800); } catch { showToast(`Please copy ${BKASH_NUMBER}`); } }
  document.querySelector("#copy-number").addEventListener("click", copyBkashNumber);
  form.addEventListener("submit", event => submitOrder(event, form));
}
function validate(form) {
  const data = new FormData(form); const errors = {};
  if (!String(data.get("name")).trim()) errors.name = "Please enter your full name.";
  if (!/^01[3-9]\d{8}$/.test(String(data.get("phone")).replace(/[\s-]/g, ""))) errors.phone = "Enter a valid 11-digit Bangladeshi number.";
  if (String(data.get("address")).trim().length < 8) errors.address = "Please enter your complete delivery address.";
  if (!String(data.get("city")).trim()) errors.city = "Please enter your city or district.";
  if (data.get("payment") === "bkash" && !String(data.get("trxid")).trim()) errors.trxid = "Enter the bKash Transaction ID after payment.";
  form.querySelectorAll(".field").forEach(field => { const input = field.querySelector("input, textarea"); const message = field.querySelector(".error-message"); if (message) message.textContent = errors[input?.name] || ""; field.classList.toggle("has-error", Boolean(errors[input?.name])); });
  return { data, errors };
}
async function submitOrder(event, form) {
  event.preventDefault(); const { data, errors } = validate(form); if (Object.keys(errors).length) { form.querySelector(".has-error input, .has-error textarea")?.focus(); return; }
  const button = document.querySelector("#submit-order"); button.disabled = true; button.classList.add("loading-button"); button.innerHTML = '<span class="spinner"></span>Sending your order...';
  const order = { timestamp: new Date().toISOString(), orderId: `TG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, uid: authUser?.uid || null, email: authUser?.email || null, customer: { name: data.get("name").trim(), phone: data.get("phone").trim(), address: data.get("address").trim(), city: data.get("city").trim(), notes: data.get("notes").trim() }, cart: state.cart.map(item => ({ id: item.id, name: item.name, variant: item.variant || null, price: item.price, quantity: item.quantity })), subtotal: cartSubtotal(), deliveryCharge: deliveryCharge(), total: cartTotal(), paymentMethod: data.get("payment"), bkashTrxId: data.get("payment") === "bkash" ? data.get("trxid").trim() : null };
  if (APPS_SCRIPT_URL === "REPLACE_ME") { button.disabled = false; button.classList.remove("loading-button"); button.textContent = "Place order securely"; checkoutView("Checkout is not connected yet. Add your Apps Script Web App URL to APPS_SCRIPT_URL before accepting orders."); return; }
  try {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(APPS_SCRIPT_URL, { method: "POST", mode: "cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(order), signal: controller.signal }); clearTimeout(timeout);
    const result = await response.json(); if (!response.ok || result.ok === false) throw new Error(result.error || "The order could not be recorded.");
    state.cart = []; saveCart(); state.pendingOrder = order; successView(order.orderId);
  } catch (error) { button.disabled = false; button.classList.remove("loading-button"); button.textContent = "Try again"; checkoutView(error.name === "AbortError" ? "The connection took too long. Please check your connection and try again." : "We couldn't record your order. Please try again; your bag is still saved."); }
}
function successView(orderId) { setView(`<section class="success-screen"><p class="eyebrow">Order received</p><h1>Thank you for trusting us.</h1><p>Your order has been sent to our studio. We will contact you shortly to confirm delivery details.</p><div class="order-id">${escapeHtml(orderId)}</div><p>Keep this order ID for your records.</p><a class="button" href="#shop">Continue browsing</a></section>`); }
function route() { const hash = location.hash.slice(1) || "home"; if (hash === "home") homeView(); else if (hash === "contact") { homeView(); requestAnimationFrame(() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })); } else if (hash === "offers") { homeView(); requestAnimationFrame(() => document.querySelector("#story")?.scrollIntoView({ behavior: "smooth" })); } else if (hash === "shop") shopView(); else if (hash === "cart") cartView(); else if (hash === "checkout") checkoutView(); else if (hash === "account") accountView(); else if (hash.startsWith("product/")) productView(hash.split("/")[1]); else homeView(); updateBagCount(); }

function productsEndpoint() { return `${APPS_SCRIPT_URL}${APPS_SCRIPT_URL.includes("?") ? "&" : "?"}action=products`; }
function showProductLoadError() { setView('<section class="empty-state section"><h1>We are refreshing the collection.</h1><p>Product data could not be loaded right now.</p><button class="button" type="button" id="retry-products">Try again</button></section>'); document.querySelector("#retry-products").addEventListener("click", init); }
async function loadProducts() {
  let cached;
  try { cached = JSON.parse(localStorage.getItem(PRODUCTS_CACHE_KEY)); } catch { cached = null; }
  if (cached && Array.isArray(cached.products) && cached.products.length && Date.now() - cached.timestamp < PRODUCTS_CACHE_TTL) return cached.products;
  if (APPS_SCRIPT_URL === "REPLACE_ME") throw new Error("Product endpoint is not configured.");
  const response = await fetch(productsEndpoint());
  if (!response.ok) throw new Error("Product data unavailable");
  const products = await response.json();
  if (!Array.isArray(products)) throw new Error("Product response was invalid.");
  if (products.length) localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), products }));
  return products;
}
async function init() { app.innerHTML = document.querySelector("#loading-template").innerHTML; if (firebaseConfigured()) { firebase.initializeApp(firebaseConfig); firebase.auth().onAuthStateChanged(user => { authUser = user; authReady = true; authNav(); if (location.hash === "#account") route(); }); } else { authReady = true; authNav(); } try { state.products = await loadProducts(); route(); } catch { showProductLoadError(); } }
document.querySelector(".menu-toggle").addEventListener("click", event => { const nav = document.querySelector(".site-nav"); nav.classList.toggle("open"); event.currentTarget.setAttribute("aria-expanded", nav.classList.contains("open")); });
document.querySelector(".site-nav").addEventListener("click", () => document.querySelector(".site-nav").classList.remove("open"));
document.addEventListener("click", event => { const menu = document.querySelector(".account-menu"); const trigger = document.querySelector(".account-trigger"); if (menu && !menu.contains(event.target)) { menu.classList.remove("open"); trigger?.setAttribute("aria-expanded", "false"); } });
window.addEventListener("hashchange", route); updateBagCount(); init();
