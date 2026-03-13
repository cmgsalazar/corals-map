// set up map
let map = L.map("map", {
    // dragging: false,
    // zoomControl: false,
    // scrollWheelZoom: false,
    // doubleClickZoom: false,
    // boxZoom: false,
    // keyboard: false,
    // tap: false,
    // touchZoom: false,
    minZoom: 2,
    maxZoom: 19,
}).setView([21, 0], 2);

// max bounds to limit panning
map.setMaxBounds([
    [-90, -240], // southwest corner
    [90, 240] // northeast corner
]);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

// color legend
const colorLegend = {
  "Origin Location": "#2563eb",
  "Transit Location": "#ea580c"
};

// load data
async function loadData() {
  try {
    let response = await fetch("map.json");
    let data = await response.json();
    renderMap(data);
  } catch (error) {
    console.error("Error loading JSON:", error);
  }
};

function renderMap(data) {
  // prep data for markers
  let locationCounts = {};
  let locationDetails = {};
  let locationYears = {};
    
  data.forEach(point => {
    if (!point.lat || !point.lng) return; // skip rows without latlng
    let key = `${point.lat},${point.lng}`;

    locationCounts[key] = (locationCounts[key] || 0) + 1; // count occurences
    
    if (!locationDetails[key]) {
      locationDetails[key] = point; // collect details
    }

    if (!locationYears[key]) { 
      locationYears[key] = new Set(); // collect unique years
    }

    if (point.year) {
      locationYears[key].add(point.year);
    }
  });

  // set up markers
  let mappedLocations = {};
  data.forEach(point => {
    if (!point.lat || !point.lng) return;
    let key = `${point.lat},${point.lng}`;
    
    if (!mappedLocations[key]) {
      let count = locationCounts[key]; // final count per latlng key
      let color = colorLegend[point.role] || "#999999"; 
      let detail = locationDetails[key];
      
      let radiusSize = Math.sqrt(count) * 5;
            
      let marker = L.circleMarker([point.lat, point.lng], {
        radius: radiusSize,
        fillColor: color, // fill color based on role
        color: "#ffffff", // outline color
        weight: 1,
        fillOpacity: 0.7,
      }).addTo(map);
            
      let tooltip = [];
      if (detail.county) {
        tooltip.push(detail.county);
      }
      if (detail.state) {
        tooltip.push(detail.state);
      }
      if (detail.country) {
        tooltip.push(detail.country);
      }

      let locationStr = tooltip.length > 0 ? tooltip.join(", ") : "Unknown";
      let yearsList = Array.from(locationYears[key]).sort((a, b) => a - b);
      let yearsStr = yearsList.join(", ");
                    
      const popup = `
        <div class="popup">
          <span class="tooltip-role" style="color: ${colorLegend[point.role]}">${point.role}</span> <span class="tooltip-location">${locationStr}</span><br>
          <hr>
          <span class="tooltip-years">Year${count > 1 ? "s" : ""} with coral trafficking incidents reported: ${yearsStr} <em>(${count}&nbsp;occurrence${count > 1 ? "s" : ""})</em></span>
        </div>
        `;
    
      marker.bindPopup(popup);

      marker.on("popupopen", function() {
          lastCenter = map.getCenter();
      });

      marker.on("popupclose", function() {
          if (lastCenter) {
              map.setView(lastCenter, map.getZoom(), { animate: true });
          }
      });

      mappedLocations[key] = true;
    }
  });
}

loadData();
