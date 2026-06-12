const SAMPLE_DATA = {
  name: 'Explorer XLT',
  category: 'SUV',
  starting_price: 36995,
  horsepower: 300,
  mpg: '24 combined',
  description: 'A versatile midsize SUV with advanced safety features, spacious seating for seven, and powerful performance for both city driving and weekend adventures.',
  image_url: 'https://picsum.photos/520/560?random=1'
};

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

const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

export default async function decorate(block, bridge) {
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = SAMPLE_DATA;
    } else {
      const result = await bridge.toolResult;
      const structuredContent = result?.structuredContent || result;
      item = structuredContent || {};
    }
  } else {
    item = SAMPLE_DATA;
  }

  block.textContent = '';
  renderDetail(block, item, bridge);

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

function renderDetail(block, item, bridge) {
  const card = document.createElement('div');
  card.className = 'detail-card';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container';

  const fallbackColor = CARD_COLORS[0];
  const colorDiv = () => {
    const d = document.createElement('div');
    d.className = 'fallback-color';
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };

  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.name || 'Vehicle model';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
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
  ctaBtn.className = 'cta-overlay';
  ctaBtn.textContent = 'Learn More';
  ctaBtn.setAttribute('aria-label', `Learn more about ${item.name || 'this vehicle'}`);
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`Tell me more about the ${item.name || 'vehicle'}`);
    });
  }
  imageContainer.appendChild(ctaBtn);

  card.appendChild(imageContainer);

  const contentPanel = document.createElement('div');
  contentPanel.className = 'content-panel';
  if (theme?.bg) {
    contentPanel.style.cssText = `background:${theme.bg};color:${theme.fg}`;
  }

  if (item.category) {
    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = item.category;
    contentPanel.appendChild(badge);
  }

  const name = document.createElement('h2');
  name.className = 'model-name';
  name.textContent = item.name || 'Vehicle Model';
  contentPanel.appendChild(name);

  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'description';
    desc.textContent = item.description;
    contentPanel.appendChild(desc);
  }

  if (item.horsepower || item.mpg) {
    const specsRow = document.createElement('div');
    specsRow.className = 'specs-row';

    if (item.horsepower) {
      const hpSpec = document.createElement('div');
      hpSpec.className = 'spec-item';
      const hpLabel = document.createElement('div');
      hpLabel.className = 'spec-label';
      hpLabel.textContent = 'Horsepower';
      const hpValue = document.createElement('div');
      hpValue.className = 'spec-value';
      hpValue.textContent = `${item.horsepower} HP`;
      hpSpec.appendChild(hpLabel);
      hpSpec.appendChild(hpValue);
      specsRow.appendChild(hpSpec);
    }

    if (item.mpg) {
      const mpgSpec = document.createElement('div');
      mpgSpec.className = 'spec-item';
      const mpgLabel = document.createElement('div');
      mpgLabel.className = 'spec-label';
      mpgLabel.textContent = 'Fuel Economy';
      const mpgValue = document.createElement('div');
      mpgValue.className = 'spec-value';
      mpgValue.textContent = item.mpg;
      mpgSpec.appendChild(mpgLabel);
      mpgSpec.appendChild(mpgValue);
      specsRow.appendChild(mpgSpec);
    }

    contentPanel.appendChild(specsRow);
  }

  if (item.starting_price != null) {
    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = `$${item.starting_price.toLocaleString()}`;
    contentPanel.appendChild(price);
  }

  card.appendChild(contentPanel);
  block.appendChild(card);
}