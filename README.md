# simple-directory-size

Calculates the total size in bytes of all regular files within a directory tree, with optional symlink following and cycle detection.

## Usage

```js
import { directorySize, directorySizeSync } from 'simple-directory-size';

// Asynchronous
const total = await directorySize('/path/to/dir');
console.log(total); // total bytes

// Synchronous
const totalSync = directorySizeSync('/path/to/dir');
console.log(totalSync);
```

## Why this exists

Most directory size utilities either follow symlinks blindly (risking infinite loops) or ignore them entirely. This library offers a middle ground: it follows symlinks by default but tracks visited real paths to break cycles. The trade-off is that it uses `realpath` on every symlink, which adds a small overhead; however, this guarantees termination even in adversarial filesystems.

## Edge cases

- **Broken symlinks**: Skipped silently, as they cannot be resolved.
- **Permission errors**: Files that cannot be read are skipped; the total reflects only accessible files.
- **Cycles**: Detected by comparing resolved paths; a symlink pointing to an already-visited directory is ignored.
- **Non-regular files**: Only directories, regular files, and symlinks are considered; other types (sockets, devices) are ignored.
