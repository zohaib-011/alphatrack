// Test script for the Excel endpoint with full routes payload
// Run with: node test-excel-endpoint.js (after starting dev server)

const http = require('http');

// Example: export all routes
const allRoutesPayload = {
  status: "success",
  data: [
    // Paste a small subset here for quick testing, or the full array from your data
    {
      id: 2,
      code: "R-002",
      name: "GTS Chowk To UOG Gate2",
      description: "NA",
      stops: [
        { name: "UOG Bus Stop GTS Chowk", lat: "32.568752", lng: "74.072978", station_id: 525 },
        { name: "UOG Bus Stop Eid Gaah Gujrat", lat: "32.573097", lng: "74.068057", station_id: 530 },
        { name: "UOG Bus Stop Science College Gujrat", lat: "32.574800", lng: "74.066215", station_id: 549 },
        { name: "UOG Bus Stop Gate 2", lat: "32.642769", lng: "74.165219", station_id: 146 }
      ],
      startTime: "7:40 AM",
      endTime: null,
      assignedBus: "20",
      assignedDriver: "Driver-D-003",
      driverId: null,
      vehicleId: 1,
      timeSlotId: 14,
      status: "active",
      frequency: null,
      distance: null
    }
  ]
};

// Example: single route export
const singleRoutePayload = {
  routeId: 2,
  data: allRoutesPayload.data
};

const postData = JSON.stringify(singleRoutePayload); // switch to allRoutesPayload to test all

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/transport/generate-route-excel',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  if (res.statusCode === 200) {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      const buf = Buffer.concat(chunks);
      console.log(`Excel file size: ${buf.length} bytes`);
      const filename = `test_route_report_${Date.now()}.xlsx`;
      require('fs').writeFileSync(filename, buf);
      console.log(`Saved as ${filename}`);
    });
  } else {
    res.setEncoding('utf8');
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log('ERROR RESPONSE:', data));
  }
});

req.on('error', (e) => console.error('PROBLEM WITH REQUEST:', e));
req.write(postData);
req.end();
