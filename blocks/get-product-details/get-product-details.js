// Sample data for standalone/preview mode
const SAMPLE_DATA = [
  {
    "name": "GUM Technique Plus Toothbrush",
    "description": "Multi-level bristle toothbrush with Quad-Grip handle for advanced cleaning below the gumline.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--9b34efe3-0f17-44ed-9b43-072f07f418a3/491btm-gum-technique-plus-toothbrush-n5-p1.jpg?preferwebp=true&width=1200&quality=85",
    "category": "Toothbrushes"
  },
  {
    "name": "GUM Easy Floss",
    "description": "Shred-resistant dental floss that slides easily between tight spaces for effective plaque removal.",
    "image_url": "https://www.sunstargum.com/content/dam/sunstar-europe/gum/product-catalogue/gb/con/floss/easy/2000-GUM-EASYFLOSS-INTERDENTALS-30m-N6.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg",
    "category": "Floss"
  },
  {
    "name": "GUM Soft-Picks Original",
    "description": "Flexible rubber bristle interdental picks for gentle cleaning between teeth, suitable for sensitive gums.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--971419e8-f384-4b56-9e10-6bed87869a88/632-gum-soft-picksoriginal-interdentals-lightgreen-medium-n1.jpg?preferwebp=true&quality=85",
    "category": "Rubber Picks"
  },
  {
    "name": "GUM Paroex 0.12% Intensive Action Mouthwash",
    "description": "Professional-grade mouthwash with chlorhexidine for advanced gum care and treatment of gum conditions.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--d1e4b9ff-6c81-4bf4-84db-1c098f2b77ad/1784emea1-emea-gum-paroex-012-mouthrinse-red-300ml-bottle-n1.jpg?preferwebp=true&quality=85",
    "category": "Mouthwashes"
  },
  {
    "name": "GUM Original White Toothpaste",
    "description": "Whitening toothpaste that gently restores natural whiteness while reinforcing and protecting enamel.",
    "image_url": "https://www.sunstargum.com/adobe/dynamicmedia/deliver/dm-aid--e3c1aee8-7d6c-41ef-b197-a131089b7a5b/1745ee1-en-cs-gr-bg-ar-gum-original-white-toothpaste-white-75ml-tube-n1.jpg?quality=85",
    "category": "Toothpastes"
  }
];

const PALETTE = ['#00a3e0','#ffffff','#333333'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const relLum = (r,g,b) => 0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if (relLum(r,g,b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo=0, hi=1;
  for (let i=0; i<20; i++) {
    const m=(lo+hi)/2;
    if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m;
  }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let productData;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      productData = SAMPLE_DATA[0];
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      const products = structuredContent?.products;
      productData = Array.isArray(products) ? products[0] : (products || structuredContent);
    }
  } else {
    productData = SAMPLE_DATA[0];
  }

  block.textContent = '';
  if (productData) {
    renderProduct(block, productData, bridge);
  }

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

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];
  const fallbackColor = CARD_COLORS[0];

  // Left: Image section
  const imageSection = document.createElement('div');
  imageSection.className = 'product-image';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

  if (product.image_url) {
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name || 'Product image';
    img.onerror = () => {
      const colorDiv = document.createElement('div');
      colorDiv.className = 'image-fallback';
      colorDiv.style.backgroundColor = fallbackColor;
      img.parentNode.replaceChild(colorDiv, img);
    };
    imageContainer.appendChild(img);
  } else {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'image-fallback';
    colorDiv.style.backgroundColor = fallbackColor;
    imageContainer.appendChild(colorDiv);
  }

  imageSection.appendChild(imageContainer);

  // CTA button on image
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-button';
  ctaBtn.textContent = 'Where to Buy';
  ctaBtn.setAttribute('aria-label', 'Find where to buy this product');
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`Where can I buy ${product.name || 'this product'}?`);
    });
  }
  imageSection.appendChild(ctaBtn);

  card.appendChild(imageSection);

  // Right: Content section
  const contentSection = document.createElement('div');
  contentSection.className = 'product-content';
  contentSection.style.cssText = `background: ${theme?.bg ?? '#00578a'}; color: ${theme?.fg ?? '#fff'};`;

  // Category badge
  if (product.category) {
    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = product.category;
    contentSection.appendChild(badge);
  }

  // Product name
  const name = document.createElement('h2');
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

  // Features
  if (product.features && Array.isArray(product.features) && product.features.length > 0) {
    const featuresList = document.createElement('ul');
    featuresList.className = 'product-features';
    product.features.forEach(feature => {
      const li = document.createElement('li');
      li.textContent = feature;
      featuresList.appendChild(li);
    });
    contentSection.appendChild(featuresList);
  }

  card.appendChild(contentSection);
  block.appendChild(card);
}
