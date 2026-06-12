// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Boots', channel: 'online', url: 'https://www.boots.com/health-pharmacy/dental-oral-care/gum' },
  { name: 'Superdrug', channel: 'online', url: 'https://www.superdrug.com/dental/gum' },
  { name: 'Amazon UK', channel: 'online', url: 'https://www.amazon.co.uk/gum-oral-care' },
  { name: 'Lloyds Pharmacy', channel: 'online', url: 'https://www.lloydspharmacy.com/collections/gum' },
  { name: 'Tesco', channel: 'in_store', url: 'https://www.tesco.com/groceries/en-GB/shop/health-and-beauty/dental-care' },
  { name: 'Sainsbury\'s', channel: 'in_store', url: 'https://www.sainsburys.co.uk/shop/gb/groceries/dental-care' },
  { name: 'Asda', channel: 'in_store', url: 'https://www.asda.com/dept/health-beauty/dental-care' },
];

// Brand palette from BuildWidgetRequest.
const PALETTE = ['#00a3e0', '#ffffff', '#333333'];

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
    const mid = (lo + hi) / 2;
    if (relLum(Math.round(r * mid), Math.round(g * mid), Math.round(b * mid)) > 0.12) hi = mid; else lo = mid;
  }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let retailers;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      retailers = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.retailers — bare array outputSchema; key derived from actionName "find_where_to_buy"
      retailers = structuredContent?.retailers || [];
    }
  } else {
    retailers = SAMPLE_DATA;
  }

  block.textContent = '';

  if (!retailers || retailers.length === 0) {
    renderEmptyState(block, bridge);
  } else {
    renderRetailers(block, retailers, bridge);
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

function renderEmptyState(block, bridge) {
  const container = document.createElement('div');
  container.className = 'empty-state';
  container.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

  const icon = document.createElement('div');
  icon.className = 'pin-icon';
  icon.innerHTML = '📍';
  icon.style.cssText = `opacity:0.7;color:${theme?.fg ?? '#fff'}`;
  container.appendChild(icon);

  const heading = document.createElement('h3');
  heading.textContent = 'Find GUM Products Near You';
  heading.style.cssText = `color:${theme?.fg ?? '#fff'}`;
  container.appendChild(heading);

  const text = document.createElement('p');
  text.textContent = 'Visit our Where to Buy page to find retailers near you.';
  text.style.cssText = `color:${theme?.fg ?? '#fff'};opacity:0.85`;
  container.appendChild(text);

  const btn = document.createElement('button');
  btn.className = 'cta-btn';
  btn.textContent = 'Find a Retailer';
  if (bridge) {
    btn.addEventListener('click', () => {
      bridge.sendMessage('Show me where to buy GUM products');
    });
  }
  container.appendChild(btn);

  block.appendChild(container);
}

function renderRetailers(block, retailers, bridge) {
  const onlineRetailers = retailers.filter(r => r.channel === 'online');
  const inStoreRetailers = retailers.filter(r => r.channel === 'in_store');

  if (onlineRetailers.length > 0) {
    const section = createRetailerSection('Online Retailers', onlineRetailers, bridge);
    block.appendChild(section);
  }

  if (inStoreRetailers.length > 0) {
    const section = createRetailerSection('In-Store Retailers', inStoreRetailers, bridge);
    block.appendChild(section);
  }
}

function createRetailerSection(title, retailers, bridge) {
  const section = document.createElement('div');
  section.className = 'retailer-section';

  const heading = document.createElement('h3');
  heading.className = 'section-heading';
  heading.textContent = title;
  section.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'retailer-grid';

  retailers.slice(0, 6).forEach(retailer => {
    const card = document.createElement('div');
    card.className = 'retailer-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const pinCircle = document.createElement('div');
    pinCircle.className = 'pin-circle';
    pinCircle.innerHTML = '📍';
    card.appendChild(pinCircle);

    const name = document.createElement('div');
    name.className = 'retailer-name';
    name.textContent = retailer.name;
    name.style.cssText = `color:${theme?.fg ?? '#fff'}`;
    card.appendChild(name);

    const btn = document.createElement('button');
    btn.className = 'shop-btn';
    btn.textContent = 'Shop Now';
    if (bridge && retailer.url) {
      btn.addEventListener('click', () => {
        bridge.openLink(retailer.url);
      });
    } else if (retailer.url) {
      btn.addEventListener('click', () => {
        window.open(retailer.url, '_blank');
      });
    }
    card.appendChild(btn);

    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}