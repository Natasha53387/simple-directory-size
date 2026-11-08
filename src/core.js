import { promises as fs, lstatSync, readdirSync, realpathSync, statSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Asynchronously walks a directory tree and sums the sizes of all regular files.
 * Symlinks are followed, but cycles are detected via realpath and skipped.
 *
 * @param {string} root - The directory to measure.
 * @param {object} [options]
 * @param {boolean} [options.followSymlinks=true] - Whether to follow symlinks (default true).
 * @returns {Promise<number>} Total size in bytes.
 */
export async function directorySize(root, options = {}) {
  const followSymlinks = options.followSymlinks !== false;
  const seen = new Set();
  let total = 0;

  async function walk(dir) {
    let realDir;
    try {
      realDir = await fs.realpath(dir);
    } catch (err) {
      return;
    }
    if (seen.has(realDir)) return;
    seen.add(realDir);

    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      let stats;
      try {
        stats = await fs.lstat(fullPath);
      } catch (err) {
        // Ignore files that vanish or are inaccessible; continue with the rest.
        continue;
      }

      if (stats.isDirectory()) {
        await walk(fullPath);
      } else if (stats.isFile()) {
        total += stats.size;
      } else if (stats.isSymbolicLink()) {
        if (!followSymlinks) continue;
        let real;
        try {
          real = await fs.realpath(fullPath);
        } catch (err) {
          continue;
        }
        if (seen.has(real)) continue;
        seen.add(real);
        let targetStats;
        try {
          targetStats = await fs.stat(fullPath);
        } catch (err) {
          continue;
        }
        if (targetStats.isDirectory()) {
          await walk(fullPath);
        } else if (targetStats.isFile()) {
          total += targetStats.size;
        }
      }
    }
  }

  await walk(root);
  return total;
}

/**
 * Synchronous version of directorySize.
 *
 * @param {string} root
 * @param {object} [options]
 * @param {boolean} [options.followSymlinks=true]
 * @returns {number}
 */
export function directorySizeSync(root, options = {}) {
  const followSymlinks = options.followSymlinks !== false;
  const seen = new Set();
  let total = 0;

  function walk(dir) {
    let realDir;
    try {
      realDir = realpathSync(dir);
    } catch (err) {
      return;
    }
    if (seen.has(realDir)) return;
    seen.add(realDir);

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      let stats;
      try {
        stats = lstatSync(fullPath);
      } catch (err) {
        continue;
      }

      if (stats.isDirectory()) {
        walk(fullPath);
      } else if (stats.isFile()) {
        total += stats.size;
      } else if (stats.isSymbolicLink()) {
        if (!followSymlinks) continue;
        let real;
        try {
          real = realpathSync(fullPath);
        } catch (err) {
          continue;
        }
        if (seen.has(real)) continue;
        seen.add(real);
        let targetStats;
        try {
          targetStats = statSync(fullPath);
        } catch (err) {
          continue;
        }
        if (targetStats.isDirectory()) {
          walk(fullPath);
        } else if (targetStats.isFile()) {
          total += targetStats.size;
        }
      }
    }
  }

  walk(root);
  return total;
}
