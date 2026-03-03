import fs from 'node:fs/promises';
import path from 'node:path';
import jszip from 'jszip';

function mkdirp(path: string) {
  return fs.mkdir(path, { recursive: true });
}

// Credits for the original function go to Rob--W
// https://github.com/Rob--W/crxviewer/blob/master/src/lib/crx-to-zip.js
function crxToZip(buf) {
  function calcLength(a, b, c, d) {
    let length = 0;

    length += a << 0;
    length += b << 8;
    length += c << 16;
    length += (d << 24) >>> 0;
    return length;
  }

  // 50 4b 03 04
  // This is actually a zip file
  if (buf[0] === 80 && buf[1] === 75 && buf[2] === 3 && buf[3] === 4) {
    return buf;
  }

  // 43 72 32 34 (Cr24)
  if (buf[0] !== 67 || buf[1] !== 114 || buf[2] !== 50 || buf[3] !== 52) {
    throw new Error('Invalid header: Does not start with Cr24');
  }

  // 02 00 00 00
  // or
  // 03 00 00 00
  const isV3 = buf[4] === 3;
  const isV2 = buf[4] === 2;

  if ((!isV2 && !isV3) || buf[5] || buf[6] || buf[7]) {
    throw new Error('Unexpected crx format version number.');
  }

  if (isV2) {
    const publicKeyLength = calcLength(buf[8], buf[9], buf[10], buf[11]);
    const signatureLength = calcLength(buf[12], buf[13], buf[14], buf[15]);

    // 16 = Magic number (4), CRX format version (4), lengths (2x4)
    const zipStartOffset = 16 + publicKeyLength + signatureLength;

    return buf.slice(zipStartOffset, buf.length);
  }
  // v3 format has header size and then header
  const headerSize = calcLength(buf[8], buf[9], buf[10], buf[11]);
  const zipStartOffset = 12 + headerSize;

  return buf.slice(zipStartOffset, buf.length);
}

/**
 * Custom error class for unzip-crx with helpful error messages
 */
export class UnzipError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'UnzipError';
    if (originalError?.stack) {
      this.stack = originalError.stack;
    }
  }
}

export const UnzipErrorCode = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_CRX_FORMAT: 'INVALID_CRX_FORMAT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_ZIP: 'INVALID_ZIP',
  WRITE_FAILED: 'WRITE_FAILED',
} as const;

/**
 * Unzip chrome extension files
 * @param crxFilePath path to crx file
 * @param destination unzip destination folder, default is crx file name
 * @returns
 * @throws {UnzipError} When file operations fail
 */
export async function unzip(crxFilePath: string, destination?: string) {
  const filePath = path.resolve(crxFilePath);

  let dest: string;
  if (destination) {
    dest = destination;
  } else {
    const extname = path.extname(crxFilePath);
    const basename = path.basename(crxFilePath, extname);
    const dirname = path.dirname(crxFilePath);
    dest = path.resolve(dirname, basename);
  }

  // Read file with error handling
  let buf: Buffer;
  try {
    buf = await fs.readFile(filePath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      throw new UnzipError(
        `CRX file not found: "${filePath}". Please check that the file path is correct and the file exists.`,
        UnzipErrorCode.FILE_NOT_FOUND,
        err
      );
    }
    if (err.code === 'EACCES' || err.code === 'EPERM') {
      throw new UnzipError(
        `Permission denied: Cannot read "${filePath}". Check file permissions.`,
        UnzipErrorCode.PERMISSION_DENIED,
        err
      );
    }
    throw new UnzipError(
      `Failed to read CRX file: ${err.message}. File: "${filePath}"`,
      UnzipErrorCode.FILE_NOT_FOUND,
      err
    );
  }

  // Parse ZIP with error handling
  let zip;
  try {
    zip = await jszip.loadAsync(crxToZip(buf));
  } catch (error) {
    const err = error as Error;
    throw new UnzipError(
      `Failed to parse CRX/ZIP file: ${err.message}. The file may be corrupted or not a valid Chrome extension (.crx) file. ` +
      `Ensure you're using a valid Chrome extension file exported from the Chrome Web Store or packed with Chrome.`,
      UnzipErrorCode.INVALID_ZIP,
      err
    );
  }

  return Promise.all(
    Object.keys(zip.files).map(async filename => {
      const isFile = !zip.files[filename].dir;
      const fullPath = path.join(dest, filename);
      const directory = (isFile && path.dirname(fullPath)) || fullPath;

      try {
        await mkdirp(directory);
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        throw new UnzipError(
          `Failed to create directory "${directory}": ${err.message}. Check write permissions in the destination path.`,
          UnzipErrorCode.WRITE_FAILED,
          err
        );
      }

      if (isFile) {
        try {
          const content = await zip.files[filename].async('nodebuffer');
          await fs.writeFile(fullPath, content);
        } catch (error) {
          const err = error as NodeJS.ErrnoException;
          throw new UnzipError(
            `Failed to write file "${fullPath}": ${err.message}. Check disk space and write permissions.`,
            UnzipErrorCode.WRITE_FAILED,
            err
          );
        }
      }
    }),
  );
}

export default unzip;
