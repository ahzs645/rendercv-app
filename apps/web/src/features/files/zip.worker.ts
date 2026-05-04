import { SECTION_KEYS, type CvFileSections } from '@rendercv/contracts';

export interface ZipFile {
  name: string;
  sections: CvFileSections;
  group?: string;
}

const textEncoder = new TextEncoder();
const DOS_EPOCH = new Date('1980-01-01T00:00:00Z').getTime();

const crcTable = new Uint32Array(256);
for (let index = 0; index < crcTable.length; index += 1) {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  crcTable[index] = crc >>> 0;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function dosDateTime(date = new Date()) {
  const safeDate = date.getTime() < DOS_EPOCH ? new Date(DOS_EPOCH) : date;
  const year = Math.max(1980, safeDate.getFullYear());
  const time =
    (safeDate.getHours() << 11) | (safeDate.getMinutes() << 5) | Math.floor(safeDate.getSeconds() / 2);
  const day = (year - 1980) << 9 | ((safeDate.getMonth() + 1) << 5) | safeDate.getDate();
  return { time, day };
}

function sanitizePathPart(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^\.+$/, '')
    || 'Untitled';
}

function makeUniqueFolderName(name: string, used: Set<string>) {
  const baseName = sanitizePathPart(name);
  let candidate = baseName;
  let suffix = 2;

  while (used.has(candidate.toLowerCase())) {
    candidate = `${baseName} ${suffix}`;
    suffix += 1;
  }

  used.add(candidate.toLowerCase());
  return candidate;
}

function createZip(entries: Array<{ path: string; data: Uint8Array }>) {
  const output: number[] = [];
  const centralDirectory: number[] = [];
  const { time, day } = dosDateTime();

  for (const entry of entries) {
    const pathBytes = textEncoder.encode(entry.path);
    const data = entry.data;
    const checksum = crc32(data);
    const localHeaderOffset = output.length;

    writeUint32(output, 0x04034b50);
    writeUint16(output, 20);
    writeUint16(output, 0x0800);
    writeUint16(output, 0);
    writeUint16(output, time);
    writeUint16(output, day);
    writeUint32(output, checksum);
    writeUint32(output, data.length);
    writeUint32(output, data.length);
    writeUint16(output, pathBytes.length);
    writeUint16(output, 0);
    output.push(...pathBytes, ...data);

    writeUint32(centralDirectory, 0x02014b50);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 0x0800);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, time);
    writeUint16(centralDirectory, day);
    writeUint32(centralDirectory, checksum);
    writeUint32(centralDirectory, data.length);
    writeUint32(centralDirectory, data.length);
    writeUint16(centralDirectory, pathBytes.length);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, 0);
    writeUint32(centralDirectory, localHeaderOffset);
    centralDirectory.push(...pathBytes);
  }

  const centralDirectoryOffset = output.length;
  output.push(...centralDirectory);
  writeUint32(output, 0x06054b50);
  writeUint16(output, 0);
  writeUint16(output, 0);
  writeUint16(output, entries.length);
  writeUint16(output, entries.length);
  writeUint32(output, centralDirectory.length);
  writeUint32(output, centralDirectoryOffset);
  writeUint16(output, 0);

  return new Blob([new Uint8Array(output)], { type: 'application/zip' });
}

self.onmessage = (event: MessageEvent<{ files: ZipFile[] }>) => {
  try {
    const usedFolderNames = new Set<string>();
    const entries: Array<{ path: string; data: Uint8Array }> = [];

    for (const file of event.data.files) {
      const group = file.group ? `${sanitizePathPart(file.group)}/` : '';
      const folder = makeUniqueFolderName(`${group}${file.name}`, usedFolderNames);

      for (const key of SECTION_KEYS) {
        entries.push({
          path: `${folder}/${key}.yaml`,
          data: textEncoder.encode(file.sections[key])
        });
      }
    }

    self.postMessage({ type: 'SUCCESS', blob: createZip(entries) });
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
