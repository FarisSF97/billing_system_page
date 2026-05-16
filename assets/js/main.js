// Get DOM elements
const pricingCards = document.querySelectorAll(".pricing-card");
const modalOverlay = document.getElementById("checkoutModal");
const closeModalBtn = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const payButton = document.getElementById("payButton");
const cardNumberInput = document.getElementById("cardNumber");
const quantityInput = document.getElementById("quantity");
const expiryInput = document.getElementById("expiry");
const whatsappInput = document.getElementById("whatsapp");

// Summary section elements
const summaryQuantityInput = document.getElementById("summary-quantity");
const summaryCouponInput = document.getElementById("summary-coupon");
const summarySubtotal = document.getElementById("summary-subtotal");
const summaryDiscount = document.getElementById("summary-discount");
const summaryTotal = document.getElementById("summary-total");

// Store current product data and upsell information
let currentBasePrice = 0;
let currentPlan = "";
let currentDiscount = 0;
let isLifetime = false;
let currentLifetimeSlug = null;
let currentProductData = null;

// API Base URL
const API_BASE_URL = 'http://localhost:5100';

async function fetchLifetimeProduct() {
  if (!isLifetime || !currentLifetimeSlug) {
    return { basePrice: currentBasePrice, displayPlan: currentPlan };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/get_product/${currentLifetimeSlug}`);
    if (response.ok) {
      const lifetimeData = await response.json();
      const lifetimeProduct = lifetimeData.data[0];
      return {
        basePrice: parseInt(lifetimeProduct.harga) || currentBasePrice,
        displayPlan: lifetimeProduct.nama || currentPlan
      };
    }
  } catch (error) {
    console.error('Error fetching lifetime product:', error);
  }

  return { basePrice: currentBasePrice, displayPlan: currentPlan };
}

document.addEventListener('DOMContentLoaded', async () => {
  initializeProducts();
});

async function initializeProducts() {
  const pricingGrid = document.querySelector('.pricing-grid');
  if (!pricingGrid) {
    console.error('Pricing grid container not found');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/get_all_products`);

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const productData = await response.json();
    const allProducts = productData.data || productData;

    const products = allProducts.filter(product => {
      const productName = (product.nama || product.name || '').toLowerCase();
      return !productName.includes('lifetime') && !productName.includes('seumur hidup');
    });

    pricingGrid.innerHTML = '';

    products.forEach(product => {
      const productCard = createProductCardFromDB(product);
      pricingGrid.appendChild(productCard);
    });

    attachProductCardListeners();

  } catch (error) {
    console.error('Error fetching products from database:', error);
    showFallbackProducts();
  }
}

function createProductCardFromDB(product) {
  const card = document.createElement('div');
  card.className = 'pricing-card';

  const displayName = product.nama || product.name || 'Product';
  const price = parseInt(product.harga) || product.price || 0;
  const slug = product.slug || product.id;

  card.setAttribute('data-plan', displayName);
  card.setAttribute('data-price', price);
  card.setAttribute('data-slug', slug);

  card.innerHTML = `
    <div class="price"><span class="currency">Rp</span>${price.toLocaleString('id-ID')} / PC</div>
    <div class="plan-title">${extractLicenseType(displayName)}</div>
    <div class="plan-description">${extractPCCount(displayName)}</div>
    <div class="continue-btn">Lanjutkan</div>
  `;

  return card;
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'pricing-card';
  card.setAttribute('data-plan', product.displayName);
  card.setAttribute('data-price', product.price);
  card.setAttribute('data-slug', product.slug);

  card.innerHTML = `
    <div class="price"><span class="currency">Rp</span>${product.price.toLocaleString('id-ID')} / PC</div>
    <div class="plan-title">${product.licenseType}</div>
    <div class="plan-description">${product.pcCount}</div>
    <div class="continue-btn">Lanjutkan</div>
  `;

  return card;
}

function extractLicenseType(productName) {
  if (productName.toLowerCase().includes('seumur hidup') || productName.toLowerCase().includes('lifetime')) {
    return 'Lisensi Seumur Hidup';
  } else if (productName.toLowerCase().includes('tahun')) {
    return 'Lisensi 1 Tahun';
  }
  return 'Lisensi';
}

function extractPCCount(productName) {
  const pcMatch = productName.match(/(\d+)\s*pc/i);
  if (pcMatch) {
    return `untuk ${pcMatch[1]} PC`;
  }
  return 'untuk 1 PC';
}

function attachProductCardListeners() {
  const pricingCards = document.querySelectorAll(".pricing-card");

  pricingCards.forEach((card) => {
    card.addEventListener("click", async () => {
      const slug = card.getAttribute("data-slug");

      try {
        const response = await fetch(`${API_BASE_URL}/get_product/${slug}`);

        if (!response.ok) {
          throw new Error('Product not found');
        }

        const productData = await response.json();
        const product = productData.data[0];

        currentPlan = product.nama || '';
        currentBasePrice = parseInt(product.harga) || 0;
        currentProductData = product;

        currentLifetimeSlug = product.slug ? product.slug.replace('1tahun', 'lifetime') : null;

        const quantityInput = document.getElementById("quantity");
        if (quantityInput) {
          quantityInput.value = 1;
        }

        if (summaryQuantityInput) {
          summaryQuantityInput.value = 1;
        }

        if (summaryCouponInput) {
          summaryCouponInput.value = "";
        }
        currentDiscount = 0;

        modalTitle.textContent = product.nama || 'Product';

        await updateTotalPrice();

        modalOverlay.style.display = "flex";

      } catch (error) {
        console.error('Error fetching product:', error);
        alert('Failed to load product data. Please try again.');
      }
    });
  });
}

function showFallbackProducts() {
  const pricingGrid = document.querySelector('.pricing-grid');
  if (!pricingGrid) return;

  pricingGrid.innerHTML = `
    <div class="pricing-card" data-plan="Telegram Booster 1 tahun 1 PC" data-price="150000" data-slug="telegram-booster-1tahun-1pc">
      <div class="price"><span class="currency">Rp</span>1111 / PC</div>
      <div class="plan-title">Lisensi 1 Tahun</div>
      <div class="plan-description">untuk 1 PC</div>
      <div class="continue-btn">Lanjutkan</div>
    </div>

    <div class="pricing-card" data-plan="Telegram Booster 1 tahun 2 PC" data-price="166000" data-slug="telegram-booster-1tahun-2pc">
      <div class="price"><span class="currency">Rp</span>222 / PC</div>
      <div class="plan-title">Lisensi 1 Tahun</div>
      <div class="plan-description">untuk 2 PC</div>
      <div class="continue-btn">Lanjutkan</div>
    </div>

    <div class="pricing-card" data-plan="Telegram Booster 1 tahun 3 PC" data-price="144000" data-slug="telegram-booster-1tahun-3pc">
      <div class="price"><span class="currency">Rp</span>333 / PC</div>
      <div class="plan-title">Lisensi 1 Tahun</div>
      <div class="plan-description">untuk 3 PC</div>
      <div class="continue-btn">Lanjutkan</div>
    </div>
  `;

  attachProductCardListeners();
}

async function hit_api_check_valid(phoneNumber) {
  try {
    console.log('Validating WhatsApp number:', phoneNumber);
    const response = await fetch(`${API_BASE_URL}/check_valid/${phoneNumber}`);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const text = await response.text();
    console.log('Raw response:', text);

    try {
      const result = JSON.parse(text);
      console.log('Parsed JSON:', result);
      return result;
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Response was not JSON, received:', text.substring(0, 200));
      return { valid: false, error: 'Invalid JSON response', rawResponse: text };
    }
  } catch (error) {
    console.error('Error validating WhatsApp number:', error);
    return { valid: false, error: 'API error' };
  }
}

async function hit_api_checkout() {
  let url = window.location.pathname.split('/');
  let slug_or_id = url[1]
  const res = await fetch(`${API_BASE_URL}/get_product/${slug_or_id}`)
  const r = await res.json();
  return r.data;
}

async function updateTotalPrice() {
  const quantityInput = document.getElementById("quantity") || summaryQuantityInput;
  const quantity = quantityInput ? (parseInt(quantityInput.value) || 1) : 1;

  const { basePrice, displayPlan } = await fetchLifetimeProduct();

  const couponCode = summaryCouponInput ? summaryCouponInput.value.trim() : '';
  if (couponCode) {
    await applyCoupon(couponCode);
  } else {
    currentDiscount = 0;
  }

  const totalPrice = basePrice * quantity;
  const finalPrice = totalPrice - currentDiscount;

  const formattedPrice = finalPrice.toLocaleString('id-ID');
  if (payButton) {
    payButton.textContent = `Bayar Rp${formattedPrice}`;
  }

  if (modalTitle) {
    modalTitle.textContent = displayPlan;
  }

  updateSummarySection(totalPrice, currentDiscount, finalPrice);
}

function updateSummarySection(subtotal, discount, total) {
  if (summarySubtotal) {
    summarySubtotal.textContent = `Rp${subtotal.toLocaleString('id-ID')}`;
  }
  if (summaryDiscount) {
    summaryDiscount.textContent = `-Rp${discount.toLocaleString('id-ID')}`;
  }
  if (summaryTotal) {
    summaryTotal.textContent = `Rp${total.toLocaleString('id-ID')}`;
  }
}

async function applyCoupon(couponCode) {
  const quantity = (summaryQuantityInput ? parseInt(summaryQuantityInput.value) : 1) || 1;
  const subtotal = currentBasePrice * quantity;

  if (!couponCode || couponCode.trim() === '') {
    currentDiscount = 0;
    updateSummarySection(subtotal, 0, subtotal);
    if (payButton) {
      payButton.textContent = `Bayar Rp${subtotal.toLocaleString('id-ID')}`;
    }
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/validate_coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kode: couponCode.trim(), subtotal })
    });

    const result = await response.json();

    if (result.status === 'success') {
      currentDiscount = result.data.potongan;
    } else {
      currentDiscount = 0;
    }

    const finalPrice = subtotal - currentDiscount;
    updateSummarySection(subtotal, currentDiscount, finalPrice);
    if (payButton) {
      payButton.textContent = `Bayar Rp${finalPrice.toLocaleString('id-ID')}`;
    }
  } catch (error) {
    console.error('Coupon validation error:', error);
    currentDiscount = 0;
    const finalPrice = subtotal;
    updateSummarySection(subtotal, 0, finalPrice);
    if (payButton) {
      payButton.textContent = `Bayar Rp${finalPrice.toLocaleString('id-ID')}`;
    }
  }
}

if (quantityInput) {
  quantityInput.addEventListener("input", async () => {
    await updateTotalPrice();
  });
}

if (summaryQuantityInput) {
  summaryQuantityInput.addEventListener("input", async () => {
    await updateTotalPrice();
  });
}

if (summaryCouponInput) {
  summaryCouponInput.addEventListener("input", (e) => {
    const quantity = (summaryQuantityInput ? parseInt(summaryQuantityInput.value) : 1) || 1;
    const subtotal = currentBasePrice * quantity;
    currentDiscount = 0;
    updateSummarySection(subtotal, 0, subtotal);
    if (payButton) {
      payButton.textContent = `Bayar Rp${subtotal.toLocaleString('id-ID')}`;
    }
  });

  summaryCouponInput.addEventListener("blur", (e) => {
    applyCoupon(e.target.value);
  });

  summaryCouponInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyCoupon(e.target.value);
    }
  });
}

const lifetimeToggle = document.getElementById("lifetime-toggle");
if (lifetimeToggle) {
  lifetimeToggle.addEventListener("change", async (e) => {
    isLifetime = e.target.checked;
    await updateTotalPrice();
  });
}

closeModalBtn.addEventListener("click", () => {
  modalOverlay.style.display = "none";
});

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.style.display = "none";
  }
});

const modal = document.querySelector(".modal");
modal.addEventListener("click", (e) => {
  e.stopPropagation();
});

if (cardNumberInput) {
  cardNumberInput.addEventListener("keydown", (e) => {
    const value = e.target.value.replace(/\s/g, "");
    const allowedKeys = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (value.length >= 16 && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  });

  cardNumberInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\s/g, "");
    let formattedValue = "";
    value = value.replace(/\D/g, "");
    if (value.length > 16) {
      value = value.substring(0, 16);
    }
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += " ";
      }
      formattedValue += value[i];
    }
    e.target.value = formattedValue;
  });

  cardNumberInput.addEventListener("blur", (e) => {
    const value = e.target.value.replace(/\s/g, "");
    if (value.length !== 16) {
      e.target.style.borderColor = "#e74c3c";
      e.target.setCustomValidity("Nomor kartu harus 16 digit");
    } else {
      e.target.style.borderColor = "";
      e.target.setCustomValidity("");
    }
  });

  cardNumberInput.addEventListener("focus", (e) => {
    e.target.style.borderColor = "";
    e.target.setCustomValidity("");
  });
}

if (expiryInput) {
  expiryInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    let formattedValue = "";
    if (value.length > 4) {
      value = value.substring(0, 4);
    }
    if (value.length >= 2) {
      formattedValue = value.substring(0, 2) + "/" + value.substring(2);
    } else {
      formattedValue = value;
    }
    if (e.target.value !== formattedValue) {
      e.target.value = formattedValue;
    }
  });

  expiryInput.addEventListener("keydown", (e) => {
    const value = e.target.value.replace(/\D/g, "");
    const cursorPos = e.target.selectionStart;
    const allowedKeys = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (value.length >= 4 && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      return;
    }
    if (e.key === "Backspace" && cursorPos > 3 && cursorPos <= 6) {
      e.target.setSelectionRange(2, 2);
    }
    if (value.length === 1 && e.key >= '0' && e.key <= '9') {
      const firstDigit = value;
      const secondDigit = e.key;
      const month = parseInt(firstDigit + secondDigit);
      if (firstDigit === '1' && (secondDigit < '0' || secondDigit > '2')) {
        e.preventDefault();
        return;
      }
      if (month === 0 || month > 12) {
        e.preventDefault();
        return;
      }
    }
  });

  expiryInput.addEventListener("blur", (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length !== 4) {
      e.target.style.borderColor = "#e74c3c";
      e.target.setCustomValidity("Format expiry date harus MM / YY");
      return;
    }
    const month = parseInt(value.substring(0, 2));
    const year = parseInt(value.substring(2, 4));
    if (month < 1 || month > 12) {
      e.target.style.borderColor = "#e74c3c";
      e.target.setCustomValidity("Bulan harus antara 01-12");
      return;
    }
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      e.target.style.borderColor = "#e74c3c";
      e.target.setCustomValidity("Kartu sudah kadaluarsa");
      return;
    }
    e.target.style.borderColor = "";
    e.target.setCustomValidity("");
  });

  expiryInput.addEventListener("focus", (e) => {
    e.target.style.borderColor = "";
    e.target.setCustomValidity("");
  });
}

if (whatsappInput) {
  const validationMessage = document.createElement('span');
  validationMessage.className = 'validation-message';
  validationMessage.style.fontSize = '12px';
  validationMessage.style.marginLeft = '8px';
  validationMessage.style.fontWeight = 'normal';

  const whatsappLabel = document.querySelector('label[for="whatsapp"]');
  if (whatsappLabel) {
    whatsappLabel.appendChild(validationMessage);
  }

  whatsappInput.addEventListener("blur", async (e) => {
    const phoneNumber = e.target.value.replace(/\D/g, "");

    if (phoneNumber.length < 10) {
      e.target.style.borderColor = "#e74c3c";
      e.target.setCustomValidity("Nomor WhatsApp minimal 10 digit");
      validationMessage.textContent = " - Minimal 10 digit";
      validationMessage.style.color = "#e74c3c";
      return;
    }

    if (phoneNumber.length > 15) {
      e.target.style.borderColor = "#e74c3c";
      e.target.setCustomValidity("Nomor WhatsApp maksimal 15 digit");
      validationMessage.textContent = " - Maksimal 15 digit";
      validationMessage.style.color = "#e74c3c";
      return;
    }

    validationMessage.textContent = " - Memvalidasi...";
    validationMessage.style.color = "#f39c12";

    const validationResult = await hit_api_check_valid(phoneNumber);
    console.log('Validation result:', validationResult);

    let isValid = false;
    if (validationResult && typeof validationResult === 'object') {
      if (validationResult.valid === true ||
          validationResult.status === 'valid' ||
          validationResult.isValid === true ||
          validationResult.success === true ||
          validationResult.message === 'valid') {
        isValid = true;
      }
    } else if (validationResult === true || validationResult === 'valid') {
      isValid = true;
    }

    console.log('Is valid:', isValid);

    if (isValid) {
      e.target.style.borderColor = "#27ae60";
      e.target.setCustomValidity("");
      validationMessage.textContent = " - Valid";
      validationMessage.style.color = "#27ae60";
    } else {
      e.target.style.borderColor = "#e74c3c";
      e.target.setCustomValidity("Nomor WhatsApp tidak valid");
      validationMessage.textContent = " - Invalid";
      validationMessage.style.color = "#e74c3c";
    }
  });

  whatsappInput.addEventListener("focus", (e) => {
    e.target.style.borderColor = "";
    e.target.setCustomValidity("");
    validationMessage.textContent = "";
  });

  whatsappInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 15) {
      value = value.substring(0, 15);
    }

    let formattedValue = value;
    if (value.length >= 4 && value.length <= 8) {
      formattedValue = value.substring(0, 4) + "-" + value.substring(4);
    } else if (value.length > 8) {
      formattedValue = value.substring(0, 4) + "-" + value.substring(4, 8) + "-" + value.substring(8);
    }

    e.target.value = formattedValue;

    if (validationMessage) {
      validationMessage.textContent = "";
    }
  });
}

if (payButton) {
  payButton.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const whatsapp = document.getElementById("whatsapp").value;
    const cardName = document.getElementById("cardName").value;
    const cardNumber = document.getElementById("cardNumber").value;
    const expiry = document.getElementById("expiry").value;
    const cvc = document.getElementById("cvc").value;
    const quantity = summaryQuantityInput ? parseInt(summaryQuantityInput.value) : 1;

    if (!email || !whatsapp || !cardName || !cardNumber || !expiry || !cvc) {
      alert("Silakan lengkapi data pembayaran Anda");
      return;
    }

    const cardNumberClean = cardNumber.replace(/\s/g, "");
    if (cardNumberClean.length !== 16) {
      alert("Nomor kartu harus 16 digit");
      return;
    }

    const expiryForValidation = expiry.replace(/\//g, "");
    if (expiryForValidation.length !== 4) {
      alert("Format expiry date harus MMYY");
      return;
    }

    if (cvc.length < 3 || cvc.length > 4) {
      alert("Masukkan kode CVC yang valid");
      return;
    }

    const { basePrice, displayPlan } = await fetchLifetimeProduct();

    const subtotal = basePrice * quantity;
    const finalPrice = subtotal - currentDiscount;

    const expiryClean = expiryForValidation || '';

    const couponCode = summaryCouponInput ? summaryCouponInput.value.trim() : '';

    const paymentData = {
      email,
      whatsapp,
      cardName,
      cardNumber: cardNumberClean,
      expiry: expiryClean,
      cvc,
      productName: displayPlan,
      quantity,
      subtotal,
      discount: currentDiscount,
      totalPrice: finalPrice,
      isLifetime: isLifetime,
      originalProduct: currentProductData,
      coupon: couponCode
    };

    try {
      payButton.textContent = "Processing...";
      payButton.disabled = true;

      const response = await fetch("/process_payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        const html = await response.text();
        document.open();
        document.write(html);
        document.close();
      } else {
        throw new Error("Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
      payButton.textContent = `Bayar Rp${finalPrice.toLocaleString('id-ID')}`;
      payButton.disabled = false;
    }
  });
}

// Handle payment method item clicks (Bank Jago, QRIS, etc.)
document.addEventListener('DOMContentLoaded', () => {
  const pmItems = document.querySelectorAll('.pm-item');

  pmItems.forEach(item => {
    item.addEventListener('click', async function () {
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const whatsapp = document.getElementById('whatsapp').value.trim();
      const quantity = summaryQuantityInput ? parseInt(summaryQuantityInput.value) || 1 : 1;

      if (!name) { alert('Silakan isi nama Anda'); return; }
      if (!email) { alert('Silakan isi email Anda'); return; }
      if (!whatsapp) { alert('Silakan isi nomor WhatsApp'); return; }

      const { basePrice, displayPlan } = await fetchLifetimeProduct();
      const subtotal = basePrice * quantity;
      const finalPrice = subtotal - currentDiscount;
      const productSlug = isLifetime && currentLifetimeSlug ? currentLifetimeSlug : currentProductData?.slug;

      const span = this.querySelector('span');
      const paymentLabel = span ? span.textContent.trim() : 'Bank Transfer';

      const couponCode = summaryCouponInput ? summaryCouponInput.value.trim() : '';

      if (paymentLabel === 'Bank Jago') {
        const payload = {
          nama: name,
          email,
          whatsapp,
          productSlug,
          productName: displayPlan,
          quantity,
          subtotal,
          discount: currentDiscount,
          totalPrice: finalPrice,
          isLifetime,
          paymentMethod: 'bank_jago',
          kupon: couponCode
        };

        try {
          const response = await fetch('/process_bank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const result = await response.json();

          if (result.status !== 'success') {
            alert(result.message || 'Checkout gagal');
            return;
          }

          sessionStorage.setItem('paymentResult', JSON.stringify(result.data));
          window.location.href = '/thankyou';
        } catch (error) {
          console.error('Bank Jago payment error:', error);
          alert('Terjadi kesalahan. Silakan coba lagi.');
        }
      } else {
        alert('Metode pembayaran ' + paymentLabel + ' belum tersedia. Silakan pilih Bank Jago.');
      }
    });
  });
});
