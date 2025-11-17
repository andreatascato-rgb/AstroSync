import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Codici colore ANSI per terminale
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const PORTS = {
  backend: 3001,
  frontend: 3000
};

async function killProcessOnPort(port) {
  try {
    // Windows: trova il PID del processo sulla porta
    const { stdout } = await execAsync(`netstat -ano | findstr :${port} | findstr LISTENING`);
    
    if (stdout.trim()) {
      const lines = stdout.trim().split('\n');
      const pids = new Set();
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          pids.add(pid);
        }
      });
      
      // Termina i processi
      for (const pid of pids) {
        try {
          console.log(`${colors.cyan}   ⏳ Terminando processo ${pid} sulla porta ${port}...${colors.reset}`);
          await execAsync(`taskkill /F /PID ${pid}`);
          console.log(`${colors.green}   ✓ Processo ${pid} terminato${colors.reset}`);
        } catch (error) {
          // Processo già terminato o non accessibile
        }
      }
      
      // Aspetta un attimo per assicurarsi che la porta sia libera
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    // Nessun processo sulla porta, va bene
  }
}

async function checkPort(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port} | findstr LISTENING`);
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

async function ensurePortsFree() {
  console.log(`\n${colors.bright}${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║${colors.reset}  ${colors.cyan}🔍 Verifica porte in corso...${colors.reset}      ${colors.bright}${colors.blue}║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);
  
  for (const [name, port] of Object.entries(PORTS)) {
    const isOccupied = await checkPort(port);
    const serviceName = name === 'backend' ? '🔧 Backend' : '🎨 Frontend';
    
    if (isOccupied) {
      console.log(`${colors.yellow}⚠️  Porta ${port} (${serviceName}) è occupata${colors.reset}`);
      console.log(`${colors.dim}   Liberazione in corso...${colors.reset}`);
      await killProcessOnPort(port);
      
      // Verifica di nuovo dopo un breve attesa
      await new Promise(resolve => setTimeout(resolve, 500));
      const stillOccupied = await checkPort(port);
      
      if (stillOccupied) {
        console.error(`\n${colors.red}${colors.bright}✗ ERRORE CRITICO${colors.reset}`);
        console.error(`${colors.red}   Impossibile liberare la porta ${port} (${serviceName})${colors.reset}`);
        console.error(`${colors.red}   L'applicazione richiede la porta ${port} per funzionare.${colors.reset}`);
        console.error(`${colors.red}   Chiudi manualmente i processi e riprova.${colors.reset}\n`);
        process.exit(1);
      } else {
        console.log(`${colors.green}✓ Porta ${port} (${serviceName}) liberata con successo${colors.reset}\n`);
      }
    } else {
      console.log(`${colors.green}✓ Porta ${port} (${serviceName}) è libera${colors.reset}\n`);
    }
  }
  
  console.log(`${colors.bright}${colors.green}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.green}║${colors.reset}  ${colors.bright}✅ Tutte le porte sono libere!${colors.reset}      ${colors.bright}${colors.green}║${colors.reset}`);
  console.log(`${colors.bright}${colors.green}╚════════════════════════════════════════╝${colors.reset}\n`);
  console.log(`${colors.cyan}${colors.bright}🚀 Avvio applicazione...${colors.reset}\n`);
  console.log(`${colors.dim}   ${colors.blue}Frontend:${colors.reset} ${colors.bright}http://localhost:${PORTS.frontend}${colors.reset}`);
  console.log(`${colors.dim}   ${colors.magenta}Backend:${colors.reset}  ${colors.bright}http://localhost:${PORTS.backend}${colors.reset}\n`);
}

ensurePortsFree().catch(error => {
  console.error(`\n${colors.red}${colors.bright}✗ Errore durante la verifica porte:${colors.reset}`);
  console.error(`${colors.red}${error.message}${colors.reset}\n`);
  process.exit(1);
});

