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
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}

const theme = getThemedCardBg(PALETTE);
const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.products — bare array outputSchema; key derived from actionName "search_products"
      items = structuredContent?.products || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderCarousel(block, items, bridge);

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

function renderCarousel(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const container = document.createElement('div');
  container.className = 'carousel-container';

  items.slice(0, 5).forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image';

    const fallbackColor = CARD_COLORS[index % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.className = 'image-fallback';
      d.style.cssText = `background-color:${fallbackColor};`;
      return d;
    };

    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || 'Product image';
      img.onerror = () => {
        if (img.parentNode) {
          img.parentNode.replaceChild(colorDiv(), img);
        }
      };
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-button';
    ctaBtn.textContent = 'View Details';
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    const content = document.createElement('div');
    content.className = 'card-content';
    content.style.cssText = `background: ${theme?.bg ?? '#1a1a1a'}; color: ${theme?.fg ?? '#fff'};`;

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = item.name || '';
    content.appendChild(name);

    if (item.brand) {
      const brand = document.createElement('p');
      brand.className = 'product-brand';
      brand.textContent = item.brand;
      content.appendChild(brand);
    }

    const footer = document.createElement('div');
    footer.className = 'product-footer';

    const price = document.createElement('p');
    price.className = 'product-price';
    price.textContent = item.price || '';
    footer.appendChild(price);

    if (item.category) {
      const category = document.createElement('span');
      category.className = 'product-category';
      category.textContent = item.category;
      footer.appendChild(category);
    }

    content.appendChild(footer);

    card.appendChild(imageContainer);
    card.appendChild(content);
    container.appendChild(card);
  });

  wrapper.appendChild(container);

  const leftBtn = document.createElement('button');
  leftBtn.className = 'scroll-button scroll-left hidden';
  leftBtn.setAttribute('aria-label', 'Scroll left');
  leftBtn.textContent = '◀';
  leftBtn.addEventListener('click', () => {
    container.scrollBy({ left: -236, behavior: 'smooth' });
  });
  leftBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      container.scrollBy({ left: -236, behavior: 'smooth' });
    }
  });

  const rightBtn = document.createElement('button');
  rightBtn.className = 'scroll-button scroll-right';
  rightBtn.setAttribute('aria-label', 'Scroll right');
  rightBtn.textContent = '▶';
  rightBtn.addEventListener('click', () => {
    container.scrollBy({ left: 236, behavior: 'smooth' });
  });
  rightBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      container.scrollBy({ left: 236, behavior: 'smooth' });
    }
  });

  const updateArrows = () => {
    const { scrollLeft, scrollWidth, clientWidth } = container;
    leftBtn.classList.toggle('hidden', scrollLeft <= 0);
    rightBtn.classList.toggle('hidden', scrollLeft + clientWidth >= scrollWidth - 1);
  };

  container.addEventListener('scroll', updateArrows);
  updateArrows();

  const fade = document.createElement('div');
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  wrapper.appendChild(leftBtn);
  wrapper.appendChild(rightBtn);

  block.appendChild(wrapper);
}