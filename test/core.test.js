import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, symlink, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { directorySize, directorySizeSync } from '../src/index.js';

test('directorySize sums file sizes recursively', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'dirsize-'));
  try {
    await writeFile(join(tmp, 'a.txt'), 'hello'); // 5 bytes
    await writeFile(join(tmp, 'b.txt'), 'world!'); // 6 bytes
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'c.txt'), 'test'); // 4 bytes
    const size = await directorySize(tmp);
    assert.equal(size, 15);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('directorySizeSync sums file sizes recursively', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'dirsize-'));
  try {
    await writeFile(join(tmp, 'a.txt'), 'hello');
    await writeFile(join(tmp, 'b.txt'), 'world!');
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'c.txt'), 'test');
    const size = directorySizeSync(tmp);
    assert.equal(size, 15);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('directorySize follows symlinks and detects cycles', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'dirsize-'));
  try {
    await writeFile(join(tmp, 'file.txt'), 'data'); // 4 bytes
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'nested.txt'), 'more'); // 4 bytes
    // Create a symlink pointing back to the root, causing a cycle.
    await symlink(tmp, join(tmp, 'sub', 'loop'));
    const size = await directorySize(tmp);
    // Should count file.txt (4) + nested.txt (4) = 8, not infinite.
    assert.equal(size, 8);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('directorySize with followSymlinks=false ignores symlinks', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'dirsize-'));
  try {
    await writeFile(join(tmp, 'real.txt'), 'real'); // 4 bytes
    await symlink(join(tmp, 'real.txt'), join(tmp, 'link.txt'));
    const size = await directorySize(tmp, { followSymlinks: false });
    assert.equal(size, 4); // Only real.txt counted
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('directorySizeSync follows symlinks and detects cycles', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'dirsize-'));
  try {
    await writeFile(join(tmp, 'file.txt'), 'data');
    await mkdir(join(tmp, 'sub'));
    await writeFile(join(tmp, 'sub', 'nested.txt'), 'more');
    await symlink(tmp, join(tmp, 'sub', 'loop'));
    const size = directorySizeSync(tmp);
    assert.equal(size, 8);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('directorySizeSync with followSymlinks=false ignores symlinks', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'dirsize-'));
  try {
    await writeFile(join(tmp, 'real.txt'), 'real');
    await symlink(join(tmp, 'real.txt'), join(tmp, 'link.txt'));
    const size = directorySizeSync(tmp, { followSymlinks: false });
    assert.equal(size, 4);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
