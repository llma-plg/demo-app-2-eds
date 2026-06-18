// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'EcoSport', category: 'SUV', starting_price: 28990, image_url: 'https://via.placeholder.com/400x225/2563eb/ffffff?text=EcoSport' },
  { name: 'Fusion', category: 'Sedan', starting_price: 24995, image_url: 'https://via.placeholder.com/400x225/555555/ffffff?text=Fusion' },
  { name: 'Explorer', category: 'SUV', starting_price: 36995, image_url: 'https://via.placeholder.com/400x225/6699cc/ffffff?text=Explorer' },
];

// Brand palette from BuildWidgetRequest — replace with actual palette[] from the action payload.
// getThemedCardBg() darkens palette[0] to luminance ≤ 0.12 so white text has WCAG AA contrast.
const PALETTE = [];

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
  for (let i=0; i<20; i++) { const m=(lo+hi)/2; if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m; }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

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
      // structuredContent.models — bare array outputSchema; key derived from actionName "list_models"
      items = structuredContent?.models || [];
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
  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'carousel-container';

  const itemsToShow = items.slice(0, 5);

  itemsToShow.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image';

    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
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
    } else {
      imageContainer.appendChild(colorDiv());
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-button';
    ctaBtn.textContent = 'View Details';
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about the ${item.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    const content = document.createElement('div');
    content.className = 'card-content';
    content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = item.name || '';
    content.appendChild(name);

    const priceRow = document.createElement('div');
    priceRow.className = 'card-price-row';

    if (item.starting_price !== undefined && item.starting_price !== null) {
      const price = document.createElement('span');
      price.className = 'card-price';
      price.textContent = `$${item.starting_price.toLocaleString()}`;
      priceRow.appendChild(price);
    }

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'card-badge';
      badge.textContent = item.category;
      priceRow.appendChild(badge);
    }

    content.appendChild(priceRow);
    card.appendChild(content);

    carouselContainer.appendChild(card);
  });

  wrapper.appendChild(carouselContainer);

  // Left arrow
  const leftArrow = document.createElement('button');
  leftArrow.className = 'carousel-arrow carousel-arrow-left';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.textContent = '◀';
  leftArrow.style.display = 'none';
  wrapper.appendChild(leftArrow);

  // Right arrow
  const rightArrow = document.createElement('button');
  rightArrow.className = 'carousel-arrow carousel-arrow-right';
  rightArrow.setAttribute('aria-label', 'Scroll right');
  rightArrow.textContent = '▶';
  wrapper.appendChild(rightArrow);

  // Right fade gradient
  const fade = document.createElement('div');
  fade.className = 'carousel-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  block.appendChild(wrapper);

  // Arrow navigation logic
  const updateArrows = () => {
    const scrollLeft = carouselContainer.scrollLeft;
    const maxScroll = carouselContainer.scrollWidth - carouselContainer.clientWidth;
    leftArrow.style.display = scrollLeft <= 1 ? 'none' : 'block';
    rightArrow.style.display = scrollLeft >= maxScroll - 1 ? 'none' : 'block';
  };

  const scrollByCard = (direction) => {
    const cardWidth = 220 + 16; // card width + gap
    carouselContainer.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  leftArrow.addEventListener('click', () => scrollByCard(-1));
  rightArrow.addEventListener('click', () => scrollByCard(1));

  leftArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(-1);
    }
  });

  rightArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(1);
    }
  });

  carouselContainer.addEventListener('scroll', updateArrows);
  updateArrows();
}
