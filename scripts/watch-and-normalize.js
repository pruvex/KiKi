// Watcher-Skript für automatische Code-Normalisierung
// Läuft im Hintergrund und formatiert/lintet bei jeder Dateiänderung

const chokidar = require('chokidar');
const { exec } = require('child_process');

const WATCH_PATHS = [
  './main/**/*.ts',
  './renderer/**/*.ts',
  './Test-App/**/*.ts',
  './modules-meta/**/*.ts',
  './main/**/*.js',
  './renderer/**/*.js',
  './Test-App/**/*.js',
  './modules-meta/**/*.js',
];

const runCommand = (cmd) => {
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(`[Normalizer] Fehler bei "${cmd}":\n`, stderr);
    } else if (stdout) {
      console.log(`[Normalizer] ${cmd}:\n`, stdout);
    }
  });
};

console.log('[Normalizer] Starte Watcher für Code-Normalisierung...');

const watcher = chokidar.watch(WATCH_PATHS, {
  ignoreInitial: true,
});

watcher.on('change', (path) => {
  console.log(`[Normalizer] Datei geändert: ${path}`);
  runCommand('npm run format');
  runCommand('npm run lint');
});

watcher.on('error', (error) => {
  console.error('[Normalizer] Watcher-Fehler:', error);
});
