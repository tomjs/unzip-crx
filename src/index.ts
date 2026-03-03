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
    // Show first few bytes to help with debugging
    const headerBytes = Array.from(buf.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' ');
    throw new Error(`Invalid CRX file: File does not start with CRX header (Cr24). Found header bytes: ${headerBytes}. This may be a plain ZIP file, .exe installer, or corrupted file. Try renaming the .crx to .zip and opening directly.`);
  }

  // 02 00 00 00
  // or
  // 03 00 00 00
  const isV3 = buf[4] === 3;
  const isV2 = buf[4] === 2;

  if ((!isV2 && !isV3) || buf[5] || buf[6] || buf[7]) {
    const version = buf[4];
    throw new Error(`Unsupported CRX format version: ${version}. This extension was packaged with a newer Chrome version that is not supported by this tool. Supported versions are CRX2 and CRX3. Try using a newer version of this library or Chrome's official tools.`);
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
 * Unzip chrome extension files
 * @param crxFilePath path to crx file
 * @param destination unzip destination folder, default is crx file name
 * @returns
 */
export async function unzip(crxFilePath: string, destination?: string) {
  // Validate input
  if (!crxFilePath || typeof crxFilePath !== 'string') {
    throw new Error('crxFilePath is required and must be a string. Usage: unzip("./extension.crx", "./output")');
  }

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

  let buf: Buffer;
  try {
    buf = await fs.readFile(filePath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      throw new Error(`CRX file not found: "${filePath}". Please check that the file exists and the path is correct.`);
    }
    if (err.code === 'EISDIR') {
      throw new Error(`Expected a file but found a directory: "${filePath}". Please provide a path to a .crx file.`);
    }
    if (err.code === 'EACCES') {
      throw new Error(`Permission denied reading file: "${filePath}". Check file permissions.`);
    }
    throw new Error(`Failed to read CRX file "${filePath}": ${err.message || String(error)}`);
  }

  let zip;
  try {
    zip = await jszip.loadAsync(crxToZip(buf));
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to parse CRX file: Invalid or corrupted CRX format. ${err.message}`);
  }

  try {
    return await Promise.all(
      Object.keys(zip.files).map(async filename => {
        const isFile = !zip.files[filename].dir;
        const fullPath = path.join(dest, filename);
        const directory = (isFile && path.dirname(fullPath)) || fullPath;

        try {
          await mkdirp(directory);
          if (isFile) {
            const content = await zip.files[filename].async('nodebuffer');
            await fs.writeFile(fullPath, content);
          }
        } catch (error) {
          const err = error as NodeJS.ErrnoException;
          throw new Error(`Failed to extract "${filename}": ${err.message || String(error)}. Check disk space and write permissions in "${dest}".`);
        }
      }),
    );
  } catch (error) {
    const err = error as Error;
    throw new Error(`Extraction failed: ${err.message || String(error)}. Some files may have been partially extracted.`);
  }
}

export default unzip;
