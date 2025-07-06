// Produktionsreifer Supervisor für das CascadeGehirn-Ökosystem
// Startet, überwacht und steuert alle Kernmodule (z.B. Code-Normalisierer)
// Erweiterbar für beliebige weitere Dienste

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error('Supervisor-Konfigurationsdatei fehlt: ' + CONFIG_PATH);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function startModule(module) {
  console.log(`[Supervisor] Starte Modul: ${module.name} -> ${module.start}`);
  const [cmd, ...args] = module.start.split(' ');
  const proc = spawn(cmd, args, {
    cwd: path.resolve(__dirname, '../../'),
    stdio: 'inherit',
    shell: true,
  });
  proc.on('close', (code) => {
    if (module.watch && code !== 0) {
      console.log(`[Supervisor] Modul ${module.name} unerwartet beendet (Code: ${code}), starte neu...`);
      setTimeout(() => startModule(module), 2000);
    } else {
      console.log(`[Supervisor] Modul ${module.name} beendet (Code: ${code})`);
    }
  });
  return proc;
}

function main() {
  console.log('[Supervisor] Lade Konfiguration...');
  const config = loadConfig();
  const processes = [];
  for (const module of config.modules) {
    processes.push(startModule(module));
  }
  // Optional: Hier können weitere Überwachungs-/Steuerungsfunktionen ergänzt werden
}

main();
