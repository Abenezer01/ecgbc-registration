
const jwt = require('jsonwebtoken');
const http = require('http');

const secret = "your-super-secret-access-key-here";
const gezuId = "9d6e7fb1-ce92-49a0-93dc-242da058c269";

const payload = {
  staff: { id: gezuId },
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60
};

const token = jwt.sign(payload, secret);
console.log("Generated Token:", token);

const options = {
  hostname: 'localhost',
  port: 8099,
  path: '/api/v1/members?_limit=1',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
        const json = JSON.parse(data);
        console.log("Total members in response:", json.data?.meta?.total);
    } catch (e) {
        console.log("Response (not JSON?):", data);
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
