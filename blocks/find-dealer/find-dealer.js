// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DEALERS = [
  {
    name: 'Hyundai of Downtown',
    address: '123 Main Street, Los Angeles, CA 90012',
    phone: '(323) 555-0123',
    hours: 'Mon-Sat: 9AM-8PM, Sun: 10AM-6PM',
    services: 'Sales, Service, Parts'
  },
  {
    name: 'Pacific Hyundai',
    address: '456 Ocean Ave, Santa Monica, CA 90401',
    phone: '(310) 555-0456',
    hours: 'Mon-Fri: 8AM-7PM, Sat-Sun: 9AM-6PM',
    services: 'Sales, Service'
  }
];

// Brand palette from BuildWidgetRequest — used to derive card background.
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
  let dealers;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      dealers = SAMPLE_DEALERS;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.dealers — bare array outputSchema; key derived from actionName "find_dealer"
      dealers = structuredContent?.dealers || [];
    }
  } else {
    dealers = SAMPLE_DEALERS;
  }

  block.textContent = '';

  if (!dealers || dealers.length === 0) {
    renderEmptyState(block, bridge);
  } else {
    renderDealers(block, dealers, bridge);
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
  const card = document.createElement('div');
  card.className = 'search-card';
  card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

  const icon = document.createElement('div');
  icon.className = 'pin-icon';
  icon.innerHTML = '📍';
  icon.style.cssText = `opacity:0.7;color:${theme?.fg ?? '#fff'}`;
  card.appendChild(icon);

  const heading = document.createElement('h2');
  heading.textContent = 'Find a store near you';
  heading.style.cssText = `color:${theme?.fg ?? '#fff'}`;
  card.appendChild(heading);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'zip-input';
  input.placeholder = 'Enter ZIP code...';
  input.setAttribute('aria-label', 'ZIP code');
  card.appendChild(input);

  const button = document.createElement('button');
  button.className = 'search-btn';
  button.textContent = 'Find Nearby Dealers';
  if (bridge) {
    button.addEventListener('click', () => {
      const zip = input.value.trim();
      if (zip) {
        bridge.sendMessage(`Find dealers near ${zip}`);
      }
    });
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const zip = input.value.trim();
        if (zip) {
          bridge.sendMessage(`Find dealers near ${zip}`);
        }
      }
    });
  }
  card.appendChild(button);

  block.appendChild(card);
}

function renderDealers(block, dealers, bridge) {
  const container = document.createElement('div');
  container.className = 'dealers-container';

  const displayDealers = dealers.slice(0, 2);
  displayDealers.forEach((dealer) => {
    const card = document.createElement('div');
    card.className = 'dealer-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const pinCircle = document.createElement('div');
    pinCircle.className = 'pin-circle';
    pinCircle.innerHTML = '📍';
    card.appendChild(pinCircle);

    const name = document.createElement('h3');
    name.className = 'dealer-name';
    name.textContent = dealer.name || '';
    name.style.cssText = `color:${theme?.fg ?? '#fff'}`;
    card.appendChild(name);

    const address = document.createElement('p');
    address.className = 'dealer-address';
    address.textContent = dealer.address || '';
    card.appendChild(address);

    if (dealer.phone) {
      const phone = document.createElement('p');
      phone.className = 'dealer-phone';
      phone.textContent = dealer.phone;
      card.appendChild(phone);
    }

    if (dealer.hours) {
      const hours = document.createElement('p');
      hours.className = 'dealer-hours';
      hours.textContent = dealer.hours;
      card.appendChild(hours);
    }

    if (dealer.services) {
      const services = document.createElement('p');
      services.className = 'dealer-services';
      services.textContent = dealer.services;
      card.appendChild(services);
    }

    if (bridge) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${dealer.name}`);
      });
    }

    container.appendChild(card);
  });

  block.appendChild(container);
}
