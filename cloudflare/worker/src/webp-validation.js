export async function validateWebp(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const readFourCC = offset => String.fromCharCode(...data.subarray(offset, offset + 4));
  if (data.byteLength < 30 || readFourCC(0) !== "RIFF" || readFourCC(8) !== "WEBP" || view.getUint32(4, true) + 8 !== data.byteLength) {
    throw new Error("Invalid WebP container.");
  }

  let offset = 12;
  let dimensions;
  let hasImageData = false;
  while (offset + 8 <= data.byteLength) {
    const type = readFourCC(offset);
    const length = view.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + length;
    if (end > data.byteLength) throw new Error("Invalid WebP chunk.");

    if (type === "VP8X" && length >= 10) {
      dimensions = [1 + data[start + 4] + (data[start + 5] << 8) + (data[start + 6] << 16), 1 + data[start + 7] + (data[start + 8] << 8) + (data[start + 9] << 16)];
    } else if (type === "VP8 " && length >= 10 && data[start + 3] === 0x9d && data[start + 4] === 0x01 && data[start + 5] === 0x2a) {
      dimensions ||= [(data[start + 6] | data[start + 7] << 8) & 0x3fff, (data[start + 8] | data[start + 9] << 8) & 0x3fff];
      hasImageData = true;
    } else if (type === "VP8L" && length >= 5 && data[start] === 0x2f) {
      dimensions ||= [1 + data[start + 1] + ((data[start + 2] & 0x3f) << 8), 1 + (data[start + 2] >> 6) + (data[start + 3] << 2) + ((data[start + 4] & 0x0f) << 10)];
      hasImageData = true;
    }

    offset = end + (length & 1);
  }

  if (offset !== data.byteLength || !hasImageData || !dimensions || !dimensions[0] || !dimensions[1] || dimensions[0] * dimensions[1] > 40_000_000) {
    throw new Error("Image dimensions are not allowed.");
  }
}
