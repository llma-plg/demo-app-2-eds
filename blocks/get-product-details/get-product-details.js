// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult as a single product object.
const SAMPLE_DATA = [
  {
    "name": "T&N Original Mattress",
    "description": "Bounce-back support mattress with T&N Flex Foam and T&N Adaptive foam for responsive comfort.",
    "image_url": "https://www.tuftandneedle.com/cdn/shop/files/oksvmhgrhub0norly5ko.jpg?v=1752099260&width=533",
    "price": "$695 - $1,345",
    "category": "Mattresses",
    "brand": "Tuft & Needle"
  },
  {
    "name": "T&N Mint Mattress",
    "description": "Award-winning foam mattress with 2x T&N Adaptive foam for enhanced cooling and contouring comfort.",
    "image_url": "https://www.tuftandneedle.com/cdn/shop/files/2604-TN-NL-OptPDP-Mint-Foam-Carousel-NapLap-Hero-v2.jpg?v=1779210844&width=533",
    "price": "$845 - $1,845",
    "category": "Mattresses",
    "brand": "Tuft & Needle"
  },
  {
    "name": "T&N Mint Hybrid Mattress",
    "description": "Premium hybrid mattress with micro coils for personalized support and individually-wrapped coils for motion control.",
    "image_url": "https://www.tuftandneedle.com/cdn/shop/files/MintHybrid-Hero-01_2x_41ff9788-9490-4752-9fc1-bfe2ef154e66.jpg?v=1752099233&width=533",
    "price": "$1,445 - $2,645",
    "category": "Mattresses",
    "brand": "Tuft & Needle"
  }
];

// Brand palette from BuildWidgetRequest — used to derive card background.
const PALETTE = ['#ffd400', '#3860be', '#555555', '#346e4a', '#696969'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (r, g, b) => 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return {
    bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`,
    fg: '#ffffff'
  };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let product;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      product = SAMPLE_DATA[0];
    } else {
      // Production: outputSchema is a single object (not array)
      const result = await bridge.toolResult;
      const structuredContent = result?.structuredContent || result;
      product = structuredContent;
    }
  } else {
    // Standalone EDS preview
    product = SAMPLE_DATA[0];
  }

  block.textContent = '';
  renderProduct(block, product, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderProduct(block, product, bridge) {
  const card = document.createElement('div');
  card.className = 'product-detail-card';

  // Left: Image section with CTA button overlay
  const imageSection = document.createElement('div');
  imageSection.className = 'image-section';

  if (product.image_url) {
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name || 'Product image';
    img.className = 'product-image';
    const fallbackColor = '#ffd400';
    img.onerror = () => {
      const colorDiv = document.createElement('div');
      colorDiv.className = 'product-image';
      colorDiv.style.cssText = `background-color:${fallbackColor};`;
      img.parentNode.replaceChild(colorDiv, img);
    };
    imageSection.appendChild(img);
  } else {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'product-image';
    colorDiv.style.cssText = 'background-color:#ffd400;';
    imageSection.appendChild(colorDiv);
  }

  // CTA button on image
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-button';
  ctaBtn.textContent = 'Shop Now';
  ctaBtn.setAttribute('aria-label', `Shop ${product.name || 'product'}`);
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`I want to shop for ${product.name}`);
    });
  }
  imageSection.appendChild(ctaBtn);

  card.appendChild(imageSection);

  // Right: Content section with darkened palette background
  const contentSection = document.createElement('div');
  contentSection.className = 'content-section';
  contentSection.style.cssText = `background: ${theme?.bg ?? '#1a1a1a'}; color: ${theme?.fg ?? '#fff'}`;

  // Brand
  if (product.brand) {
    const brand = document.createElement('div');
    brand.className = 'brand';
    brand.textContent = product.brand;
    contentSection.appendChild(brand);
  }

  // Name
  const name = document.createElement('h3');
  name.className = 'product-name';
  name.textContent = product.name || '';
  contentSection.appendChild(name);

  // Description
  if (product.description) {
    const desc = document.createElement('p');
    desc.className = 'product-description';
    desc.textContent = product.description;
    contentSection.appendChild(desc);
  }

  // Price
  if (product.price) {
    const price = document.createElement('div');
    price.className = 'product-price';
    price.textContent = product.price;
    contentSection.appendChild(price);
  }

  // Category badge
  if (product.category) {
    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = product.category;
    contentSection.appendChild(badge);
  }

  card.appendChild(contentSection);
  block.appendChild(card);
}
