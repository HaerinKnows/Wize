import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..', '..');
const localNortonCertPath = path.join(repoRoot, '.certs', 'norton-web-mail-shield-root.pem');

const env = { ...process.env };
if (!env.NODE_EXTRA_CA_CERTS && fs.existsSync(localNortonCertPath)) {
  env.NODE_EXTRA_CA_CERTS = localNortonCertPath;
}

const child = spawn(process.execPath, [path.join(__dirname, 'server.mjs')], {
  cwd: repoRoot,
  env,
  stdio: 'inherit'
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
