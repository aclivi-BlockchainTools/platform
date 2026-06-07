import { execFile } from 'child_process';

export function execScript(scriptPath, args = [], options = {}) {
  const timeout = options.timeout || 30000;
  return new Promise((resolve, reject) => {
    execFile('bash', [scriptPath, ...args], {
      timeout,
      maxBuffer: 1024 * 1024,
      ...options
    }, (error, stdout, stderr) => {
      if (error && !options.allowError) {
        reject({ error, stderr, stdout });
      } else {
        resolve({ stdout, stderr, error });
      }
    });
  });
}

export function execCommand(cmd, options = {}) {
  const timeout = options.timeout || 30000;
  return new Promise((resolve, reject) => {
    execFile('bash', ['-c', cmd], {
      timeout,
      maxBuffer: 1024 * 1024,
      ...options
    }, (error, stdout, stderr) => {
      if (error && !options.allowError) {
        reject({ error, stderr, stdout });
      } else {
        resolve({ stdout, stderr, error });
      }
    });
  });
}
