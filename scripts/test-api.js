const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const authPath = path.join(os.homedir(), '.taskifier-auth.json');
if (!fs.existsSync(authPath)) {
  console.log('No auth file');
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const token = config.accessToken;

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/attendance',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});
req.end();
