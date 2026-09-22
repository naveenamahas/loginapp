const API = (window.__API_URL__ || "http://localhost:8080/api").replace(/\/$/, "");
const $ = (id) => document.getElementById(id);
const authShell = document.querySelector(".auth-shell");

function setMessage(text, type = "") {
  const msg = $("msg");
  msg.textContent = text || "";
  msg.className = "msg" + (type ? ` ${type}` : "");
}

function show(type) {
  const tabs = document.querySelectorAll(".tab");
  const panels = {
    login: $("loginForm"),
    signup: $("signupForm"),
    profile: $("profilePanel")
  };

  tabs.forEach((tab) => {
    const isActive = tab.dataset.panel === type;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  Object.entries(panels).forEach(([key, element]) => {
    element.classList.toggle("hidden", key !== type);
  });

  authShell.classList.toggle("dashboard-mode", type === "profile");

  setMessage("");
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => show(tab.dataset.panel));
});

$("signupForm").onsubmit = async (e) => {
  e.preventDefault();

  const payload = {
    name: $("sn").value,
    email: $("se").value,
    password: $("sp").value
  };

  const response = await fetch(API + "/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (response.ok) {
    setMessage(data.message || "Account created successfully.", "success");
    $("signupForm").reset();
    show("login");
    return;
  }

  setMessage(data.error || "Signup failed.", "error");
};

$("loginForm").onsubmit = async (e) => {
  e.preventDefault();

  const response = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      email: $("le").value,
      password: $("lp").value
    })
  });

  const data = await response.json();
  if (!response.ok) {
    setMessage(data.error || "Login failed.", "error");
    return;
  }

  show("profile");
  profile();
  loadProducts();
};

async function profile() {
  const response = await fetch(API + "/profile", { credentials: "include" });
  const data = await response.json();

  if (!response.ok) {
    $("profileName").textContent = "Guest user";
    $("profileEmail").textContent = data.error || "Not signed in";
    setMessage(data.error || "Session unavailable.", "error");
    return;
  }

  $("profileName").textContent = data.name || "User";
  $("profileEmail").textContent = data.email || "No email";
  $("profilePanel").classList.remove("hidden");
  setMessage("Login successful.", "success");
}

async function loadProducts() {
  const response = await fetch(API + "/products", { credentials: "include" });
  const data = await response.json();
  if (!response.ok) {
    setMessage(data.error || "Could not load products.", "error");
    return;
  }

  const list = $("productList");
  $("productCount").textContent = `${data.length} product${data.length === 1 ? "" : "s"}`;
  if (!data.length) {
    list.innerHTML = '<p class="empty-products">No products yet. Add your first product above.</p>';
    return;
  }

  list.innerHTML = data.map((product) => `
    <article class="product-item">
      <div>
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description || "No description")}</p>
        <strong>$${Number(product.price).toFixed(2)}</strong>
        <span class="quantity">Qty: ${product.quantity}</span>
      </div>
      <div class="product-item-actions">
        <button type="button" class="secondary-btn small-btn" onclick='editProduct(${JSON.stringify(product)})'>Edit</button>
        <button type="button" class="danger-btn" onclick="deleteProduct('${product.id}')">Delete</button>
      </div>
    </article>
  `).join("");
}

$("productForm").onsubmit = async (e) => {
  e.preventDefault();
  const id = $("productId").value;
  const payload = {
    name: $("productName").value,
    description: $("productDescription").value,
    price: Number($("productPrice").value),
    quantity: Number($("productQuantity").value)
  };
  const response = await fetch(API + (id ? `/products/${id}` : "/products"), {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) {
    setMessage(data.error || "Could not save product.", "error");
    return;
  }
  resetProductForm();
  setMessage(id ? "Product updated." : "Product added.", "success");
  loadProducts();
};

function editProduct(product) {
  $("productId").value = product.id;
  $("productName").value = product.name;
  $("productDescription").value = product.description || "";
  $("productPrice").value = product.price;
  $("productQuantity").value = product.quantity;
  $("productSubmit").textContent = "Update product";
  $("productCancel").classList.remove("hidden");
  $("productName").focus();
}

function resetProductForm() {
  $("productForm").reset();
  $("productId").value = "";
  $("productSubmit").textContent = "Add product";
  $("productCancel").classList.add("hidden");
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  const response = await fetch(API + `/products/${id}`, { method: "DELETE", credentials: "include" });
  const data = await response.json();
  if (!response.ok) {
    setMessage(data.error || "Could not delete product.", "error");
    return;
  }
  setMessage("Product deleted.", "success");
  loadProducts();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

async function logout() {
  const response = await fetch(API + "/logout", {
    method: "POST",
    credentials: "include"
  });

  const data = await response.json();
  $("loginForm").reset();
  $("signupForm").reset();
  resetProductForm();
  show("login");
  setMessage(data.message || "Logged out successfully.", "success");
}

show("login");
