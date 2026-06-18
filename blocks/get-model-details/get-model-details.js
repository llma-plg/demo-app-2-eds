const SAMPLE_DATA = [
  {
    "name": "2026 IONIQ 5",
    "description": "Award-winning electric SUV with up to 320 hp and EPA-estimated 303-mile range.",
    "image_url": "https://s7d1.scene7.com/is/image/hyundai/2025-ioniq-5-se-standard-range-rwd-digital-teal-ev-tool?wid=800&fmt=webp",
    "price": "$35,000",
    "category": "Electric SUV"
  },
  {
    "name": "2026 Elantra",
    "description": "Compact sedan featuring bold design and technical innovations inside and out.",
    "image_url": "https://s7d1.scene7.com/is/image/hyundai/2025-elantra-ice-se-fwd-intense-blue-pearl-vehicle-browse-hero?wid=800&fmt=webp",
    "price": "$22,625",
    "category": "Sedan"
  },
  {
    "name": "2026 Santa Fe",
    "description": "Adventurous compact SUV with wider aggressive front grille and up to 271 hp.",
    "image_url": "https://s7d1.scene7.com/is/image/hyundai/2026-santa-fe-calligraphy-fwd-earthy-brass-matte-vehicle-browse-hero?wid=800&fmt=webp",
    "price": "$35,050",
    "category": "SUV"
  }
];

const PALETTE = ['#002c5e', '#32f596'];

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
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = SAMPLE_DATA[0];
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      item = structuredContent || SAMPLE_DATA[0];
    }
  } else {
    item = SAMPLE_DATA[0];
  }

  block.textContent = '';
  renderDetailCard(block, item, bridge);

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

function renderDetailCard(block, item, bridge) {
  const card = document.createElement('div');
  card.className = 'detail-card';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'detail-image';

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];
  const fallbackColor = CARD_COLORS[0];

  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };

  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.name || '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
    imageContainer.appendChild(img);

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-on-image';
    ctaBtn.textContent = 'Build & Price';
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`I want to build and price the ${item.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);
  } else {
    imageContainer.appendChild(colorDiv());
  }

  card.appendChild(imageContainer);

  const contentContainer = document.createElement('div');
  contentContainer.className = 'detail-content';
  contentContainer.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

  const name = document.createElement('h2');
  name.className = 'detail-name';
  name.textContent = item.name || '';
  contentContainer.appendChild(name);

  if (item.category) {
    const categoryChip = document.createElement('span');
    categoryChip.className = 'category-chip';
    categoryChip.textContent = item.category;
    contentContainer.appendChild(categoryChip);
  }

  const description = document.createElement('p');
  description.className = 'detail-description';
  description.textContent = item.description || '';
  contentContainer.appendChild(description);

  const price = document.createElement('div');
  price.className = 'detail-price';
  price.textContent = item.price || '';
  contentContainer.appendChild(price);

  card.appendChild(contentContainer);
  block.appendChild(card);
}
