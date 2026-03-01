const products = [];

let currentSlide = 1;
const productsPerSlide = 4;
let totalSlides = 1;

async function loadProductsFromFirebase() {
  const { data, error } = await client.from("products").select("*");

  if (error) {
    console.error("Failed to load products:", error);
    return;
  }

  products.push(...data);
  totalSlides = Math.ceil(products.length / productsPerSlide);
  renderProducts();
}

function updateQuantity(change) {
  const quantityBox = document.getElementById("quantityBox");
  let currentValue = parseInt(quantityBox.value) || 1;
  let newValue = currentValue + change;
  if (newValue < 1) newValue = 1;
  quantityBox.value = newValue;
}

function renderProducts() {
  const startIdx = (currentSlide - 1) * productsPerSlide;
  const endIdx = startIdx + productsPerSlide;
  const slideProducts = products.slice(startIdx, endIdx);

  document
    .querySelectorAll('[id^="buyProduct"]')
    .forEach((ul) => (ul.innerHTML = ""));

  slideProducts.forEach((product, index) => {
    const productHTML = `
      <li class="product-item">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p class="price">$${product.price}</p>
        <button onclick="addToCart(${product.id})">BUY NOW</button>
      </li>
    `;

    const mainSection =  `
      <h2>BUY NOW</h2>
      <div class="slide-${currentSlide}">
        <div class="products" id="products"></div>
    `;

    let products = mainSection;
    products += `
              <div class="product-${index + 1}">
                <ul id="buyProduct${index + 1}">${productHTML}</ul>
              </div>
    `;
  });
  products += `</div>`;

  if (!totalSlides <= 1) {
    const prevArrow = `<button
    class="arrow-left"
    onclick="prevSlide()"
    aria-label="Previous Slide"
    >
    &#10094;
    </button>`;
    const nextArrow = `<button
    class="arrow-right"
    onclick="nextSlide()"
    aria-label="Next Slide"
    >
    &#10095;
    </button>`;
    const slides = `<div class="slide-number">
          <p class="current-slide" id="currentSlide">${currentSlide}</p>
          <span> / </span>
          <p class="total-slide" id="totalSlide">${totalSlides}</p>
        </div>`;

    const productsSection = document.getElementById("products");
    if (productsSection)
      productsSection.innerHTML = prevArrow + products + nextArrow + slides;

    document.getElementById("currentSlide").textContent = currentSlide;
    document.getElementById("totalSlide").textContent = totalSlides;
  } else {
    const productsSection = document.getElementById("products");
    if (productsSection) productsSection.innerHTML = products;
  }
}

function prevSlide() {
  if (currentSlide > 1) {
    currentSlide--;
    renderProducts();
  }
}

function nextSlide() {
  if (currentSlide < totalSlides) {
    currentSlide++;
    renderProducts();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadProductsFromFirebase();
});
