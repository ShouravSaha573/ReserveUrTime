import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(scriptsDirectory, "..", "public");
const sourcePath = path.join(publicDirectory, "hero-assets", "soda", "diet-soda.glb");

function align4(value) {
  return (value + 3) & ~3;
}

function buildModel(outputName, texturePath) {
  const source = fs.readFileSync(sourcePath);
  const jsonLength = source.readUInt32LE(12);
  const json = JSON.parse(source.subarray(20, 20 + jsonLength).toString("utf8").replace(/\0+$/g, ""));
  const binaryHeaderOffset = 20 + jsonLength;
  const binaryLength = source.readUInt32LE(binaryHeaderOffset);
  const sourceBinary = source.subarray(binaryHeaderOffset + 8, binaryHeaderOffset + 8 + binaryLength);
  const replacementTexture = fs.readFileSync(texturePath);

  const binaryParts = [];
  let rebuiltBinaryLength = 0;
  json.bufferViews.forEach((view, index) => {
    const part = index === 2
      ? replacementTexture
      : sourceBinary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
    rebuiltBinaryLength = align4(rebuiltBinaryLength);
    view.byteOffset = rebuiltBinaryLength;
    view.byteLength = part.length;
    binaryParts.push({ offset: rebuiltBinaryLength, part });
    rebuiltBinaryLength += part.length;
  });
  rebuiltBinaryLength = align4(rebuiltBinaryLength);
  json.buffers[0].byteLength = rebuiltBinaryLength;

  json.images[1] = {
    name: "ReserveUrTime_Mojo_BaseColor",
    bufferView: 2,
    mimeType: "image/png"
  };
  json.textures[1] = {
    sampler: json.textures[1]?.sampler ?? 0,
    source: 1
  };

  const encodedJson = Buffer.from(JSON.stringify(json));
  const paddedJsonLength = align4(encodedJson.length);
  const output = Buffer.alloc(12 + 8 + paddedJsonLength + 8 + rebuiltBinaryLength);

  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(paddedJsonLength, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  output.fill(0x20, 20, 20 + paddedJsonLength);
  encodedJson.copy(output, 20);

  const outputBinaryHeader = 20 + paddedJsonLength;
  output.writeUInt32LE(rebuiltBinaryLength, outputBinaryHeader);
  output.writeUInt32LE(0x004e4942, outputBinaryHeader + 4);
  binaryParts.forEach(({ offset, part }) => part.copy(output, outputBinaryHeader + 8 + offset));

  fs.writeFileSync(path.join(publicDirectory, "hero-assets", "soda", outputName), output);
}

buildModel("mojo-green.glb", path.join(publicDirectory, "hero-assets", "mojo-green-bangladesh-v3.png"));
buildModel("mojo-blue.glb", path.join(publicDirectory, "hero-assets", "mojo-blue-bangladesh-v3.png"));
