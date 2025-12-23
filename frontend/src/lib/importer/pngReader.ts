export async function readPngChunks(file: File): Promise<string | null> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  
  // Check PNG Signature
  if (view.getUint32(0) !== 0x89504E47 || view.getUint32(4) !== 0x0D0A1A0A) {
    throw new Error("Not a valid PNG file");
  }

  let offset = 8;
  const decoder = new TextDecoder('utf-8');

  while (offset < buffer.byteLength) {
    const length = view.getUint32(offset);
    const type = decoder.decode(buffer.slice(offset + 4, offset + 8));
    
    if (type === 'tEXt') {
      const chunkData = new Uint8Array(buffer, offset + 8, length);
      // tEXt: keyword + null + text
      let nullIndex = -1;
      for (let i = 0; i < length; i++) {
        if (chunkData[i] === 0) {
          nullIndex = i;
          break;
        }
      }

      if (nullIndex > 0) {
        const keyword = decoder.decode(chunkData.slice(0, nullIndex));
        if (keyword === 'chara') {
          const text = decoder.decode(chunkData.slice(nullIndex + 1));
          return text; // Base64 encoded string usually
        }
      }
    }

    offset += 12 + length; // Length + Type + Data + CRC
  }

  return null;
}
