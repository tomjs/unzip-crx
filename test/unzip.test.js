const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { afterEach, beforeEach, expect, it, describe } = require('@jest/globals');
const { unzip } = require('../');

const tempDir = path.join(os.tmpdir(), 'tomjs-unzip-crx-test');

beforeEach(() => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir, { recursive: true, mode: 0o777 });
});

afterEach(() => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
});

it('should unpack the given crx v2 file', () => {
  const unzipPath = path.resolve(tempDir, 'ext');
  const readmeFile = path.resolve(tempDir, 'ext/README.md');

  return unzip('./test/fixtures/extension-v2.crx', unzipPath).then(() => {
    const file = fs.readFileSync(readmeFile, 'utf-8');
    expect(file.trim()).toBe('# Manifest V2 Extension');
  });
});

it('should unpack the given crx v3 file', () => {
  const unzipPath = path.resolve(tempDir, 'ext');
  const readmeFile = path.resolve(tempDir, 'ext/README.md');

  return unzip('./test/fixtures/extension-v3.crx', unzipPath).then(() => {
    const file = fs.readFileSync(readmeFile, 'utf-8');
    expect(file.trim()).toBe('# Manifest V3 Extension');
  });
});

it('should unpack the given regular zip file', () => {
  const expectBinary = fs.readFileSync(path.join(__dirname, './fixtures/extension/test.bin'));

  const unzipPath = path.resolve(tempDir, 'ext');
  const readmeFile = path.resolve(tempDir, 'ext/README.md');
  const binaryFile = path.resolve(tempDir, 'ext/test.bin');

  return unzip('./test/fixtures/extension-zipped.crx', unzipPath).then(() => {
    const file = fs.readFileSync(readmeFile, 'utf8');
    const binaryContent = fs.readFileSync(binaryFile);

    expect(file).toBe('# Crazy Readme File');
    expect(binaryContent).toEqual(expectBinary);
  });
});

it('should throw if crx file header malformed', () => {
  const unzipPath = path.resolve(tempDir, 'ext');

  return unzip('./test/fixtures/extension-malformed.crx', unzipPath).catch(err => {
    expect(err.message).toBe('Invalid header: Does not start with Cr24');
  });
});

it('should throw if crx version number is malformed', () => {
  const unzipPath = path.resolve(tempDir, 'ext');

  return unzip('./test/fixtures/extension-malformed-v.crx', unzipPath).catch(err => {
    expect(err.message).toBe('Unexpected crx format version number.');
  });
});

describe('- ext dir is not writable', () => {
  it('should throw if directory is not writable', () => {
    const unzipPath = path.resolve(tempDir);

    fs.chmodSync(unzipPath, '644');

    return unzip('./test/fixtures/extension-v2.crx', unzipPath).catch(err => {
      expect(err.message).toBe('EACCES: permission denied');
    });
  });
});
