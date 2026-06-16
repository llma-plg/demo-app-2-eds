// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'Serta Simmons Bedding HQ',
    address: '2451 Industry Avenue, Doraville, GA 30360',
    phone: '404-534-5000',
    hours: '',
    region: 'East'
  },
  {
    name: 'Charlotte Plant',
    address: '5100 W W.T.Harris Blvd, Charlotte, NC 28269',
    phone: '704-596-4935',
    hours: '',
    region: 'East'
  }
];

// Brand palette from BuildWidgetRequest — used to derive card backgrounds.
const PALETTE = ['#ffd400', '#3860be', '#555555', '#346e4a', '#696969'];

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
  let locations;
  let allLocations = [];

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      allLocations = SAMPLE_DATA;
      locations = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.locations — bare array outputSchema; key derived from actionName "find_location"
      allLocations = structuredContent?.locations || [];
      locations = allLocations;
    }
  } else {
    allLocations = SAMPLE_DATA;
    locations = SAMPLE_DATA;
  }

  block.textContent = '';
  
  // Filter card
  const filterCard = document.createElement('div');
  filterCard.className = 'filter-card';
  filterCard.style.cssText = `background: ${theme?.bg ?? '#1a3a5c'}; color: ${theme?.fg ?? '#fff'};`;

  const icon = document.createElement('div');
  icon.className = 'filter-icon';
  icon.innerHTML = `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
  filterCard.appendChild(icon);

  const heading = document.createElement('h2');
  heading.textContent = 'Find a Location';
  filterCard.appendChild(heading);

  const select = document.createElement('select');
  select.className = 'region-select';
  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'All Regions';
  select.appendChild(allOption);
  ['East', 'West', 'Canada'].forEach(region => {
    const opt = document.createElement('option');
    opt.value = region;
    opt.textContent = region;
    select.appendChild(opt);
  });
  filterCard.appendChild(select);

  const searchBtn = document.createElement('button');
  searchBtn.className = 'search-btn';
  searchBtn.textContent = 'Search';
  filterCard.appendChild(searchBtn);

  block.appendChild(filterCard);

  // Results container
  const results = document.createElement('div');
  results.className = 'results';
  block.appendChild(results);

  function renderResults(filtered) {
    results.textContent = '';
    const displayLocations = filtered.slice(0, 2);
    displayLocations.forEach(location => {
      const card = document.createElement('div');
      card.className = 'store-card';
      card.style.cssText = `background: ${theme?.bg ?? '#1a3a5c'}; color: ${theme?.fg ?? '#fff'};`;

      const pinCircle = document.createElement('div');
      pinCircle.className = 'pin-circle';
      pinCircle.innerHTML = `<svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
      card.appendChild(pinCircle);

      const name = document.createElement('h3');
      name.className = 'store-name';
      name.style.color = theme?.fg ?? '#fff';
      name.textContent = location.name || '';
      card.appendChild(name);

      const address = document.createElement('p');
      address.className = 'store-address';
      address.textContent = location.address || '';
      card.appendChild(address);

      const phone = document.createElement('p');
      phone.className = 'store-phone';
      phone.textContent = location.phone || '';
      card.appendChild(phone);

      if (location.hours) {
        const hours = document.createElement('p');
        hours.className = 'store-hours';
        hours.textContent = location.hours;
        card.appendChild(hours);
      }

      const btn = document.createElement('button');
      btn.className = 'directions-btn';
      btn.textContent = 'Get Directions';
      if (bridge) {
        btn.addEventListener('click', () => {
          bridge.sendMessage(`Get directions to ${location.name} at ${location.address}`);
        });
      }
      card.appendChild(btn);

      results.appendChild(card);
    });
  }

  searchBtn.addEventListener('click', () => {
    const selectedRegion = select.value;
    const filtered = selectedRegion 
      ? allLocations.filter(loc => loc.region === selectedRegion)
      : allLocations;
    renderResults(filtered);
  });

  select.addEventListener('change', () => {
    const selectedRegion = select.value;
    const filtered = selectedRegion 
      ? allLocations.filter(loc => loc.region === selectedRegion)
      : allLocations;
    renderResults(filtered);
  });

  renderResults(locations);

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