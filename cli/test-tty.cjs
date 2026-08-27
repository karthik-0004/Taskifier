const fs = require('fs');

try {
  fs.writeFileSync('CON', 'Writing to CON\n');
} catch (e) {
  console.log('Failed CON:', e.message);
}

try {
  fs.writeFileSync('\\\\.\\CON', 'Writing to \\\\.\\CON\n');
} catch (e) {
  console.log('Failed \\\\.\\CON:', e.message);
}

try {
  const fd = fs.openSync('CONOUT$', 'w');
  fs.writeSync(fd, 'Writing to CONOUT$\n');
  fs.closeSync(fd);
} catch (e) {
  console.log('Failed CONOUT$:', e.message);
}
