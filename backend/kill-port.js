const { execSync } = require('child_process');
try {
  const out = execSync('netstat -ano').toString();
  const lines = out.split('\n').filter(l => l.includes(':5001') && l.includes('LISTENING'));
  lines.forEach(line => {
    const pid = line.trim().split(/\s+/).pop();
    if (pid && !isNaN(pid)) {
      try { execSync(`taskkill /PID ${pid} /F`); console.log(`Killed PID ${pid} on port 5001`); }
      catch {}
    }
  });
} catch {}
