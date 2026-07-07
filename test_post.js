const http = require('http');

const data = JSON.stringify({
  brand: "Toyota",
  model: "Camry",
  category: "sedan",
  year: 2022,
  price_per_day: 50,
  location: "Kathmandu",
  license_plate: "TEST-123",
  seats: 5
});

const req = http.request('http://localhost:3000/api/owner/cars', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'session=dummy_if_needed' // this won't work without a real session
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', console.error);
req.write(data);
req.end();
