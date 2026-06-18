// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'Downtown Auto Center',
    address: '123 Main Street, Springfield, IL 62701',
    phone: '(555) 123-4567',
    hours: 'Mon-Fri 9AM-7PM, Sat 10AM-6PM',
    distance_miles: 2.4
  },
  {
    name: 'Northside Motors',
    address: '456 Oak Avenue, Springfield, IL 62704',
    phone: '(555) 987-6543',
    hours: 'Mon-Sat 8AM-8PM, Sun 10AM-5PM',
    distance_miles: 5.1
  }
];

// Brand palette from BuildWidgetRequest
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
      dealers = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.dealers — bare array outputSchema; key derived from actionName "find_dealer"
      dealers = structuredContent?.dealers || [];
    }
  } else {
    dealers = SAMPLE_DATA;
  }

  block.textContent = '';
  renderDealers(block, dealers, bridge);
  
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

function renderDealers(block, dealers, bridge) {
  const container = document.createElement('div');
  container.className = 'dealer-container';

  if (!dealers || dealers.length === 0) {
    // Empty state: ZIP search form
    const searchCard = document.createElement('div');
    searchCard.className = 'dealer-search-card';
    searchCard.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const pinIcon = document.createElement('div');
    pinIcon.className = 'pin-icon';
    pinIcon.innerHTML = '📍';
    searchCard.appendChild(pinIcon);

    const heading = document.createElement('h2');
    heading.textContent = 'Find a store near you';
    searchCard.appendChild(heading);

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter ZIP code...';
    input.className = 'zip-input';
    input.setAttribute('aria-label', 'ZIP code');
    inputWrapper.appendChild(input);

    const searchBtn = document.createElement('button');
    searchBtn.className = 'search-btn';
    searchBtn.textContent = 'Find Nearby';
    if (bridge) {
      searchBtn.addEventListener('click', () => {
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
    inputWrapper.appendChild(searchBtn);

    searchCard.appendChild(inputWrapper);
    container.appendChild(searchCard);
  } else {
    // Results: store cards
    const resultsRow = document.createElement('div');
    resultsRow.className = 'dealer-results-row';

    dealers.slice(0, 2).forEach((dealer) => {
      const card = document.createElement('div');
      card.className = 'dealer-card';
      card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

      const pinCircle = document.createElement('div');
      pinCircle.className = 'pin-circle';
      pinCircle.textContent = '📍';
      card.appendChild(pinCircle);

      const name = document.createElement('div');
      name.className = 'dealer-name';
      name.textContent = dealer.name || '';
      card.appendChild(name);

      const address = document.createElement('div');
      address.className = 'dealer-address';
      address.textContent = dealer.address || '';
      card.appendChild(address);

      if (dealer.phone) {
        const phone = document.createElement('div');
        phone.className = 'dealer-phone';
        phone.textContent = dealer.phone;
        card.appendChild(phone);
      }

      if (dealer.hours) {
        const hours = document.createElement('div');
        hours.className = 'dealer-hours';
        hours.textContent = dealer.hours;
        card.appendChild(hours);
      }

      if (dealer.distance_miles !== undefined) {
        const distance = document.createElement('div');
        distance.className = 'dealer-distance';
        distance.textContent = `${dealer.distance_miles} miles`;
        card.appendChild(distance);
      }

      resultsRow.appendChild(card);
    });

    container.appendChild(resultsRow);
  }

  block.appendChild(container);
}