import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(scriptsDirectory, "..", "public");
const sourcePath = path.join(publicDirectory, "hero-assets", "soda", "diet-soda.glb");

function align4(value) {
  return (value + 3) & ~3;
}

function buildModel(outputName, textureUri) {
  const source = fs.readFileSync(sourcePath);
  const jsonLength = source.readUInt32LE(12);
  const json = JSON.parse(source.subarray(20, 20 + jsonLength).toString("utf8").replace(/\0+$/g, ""));
  const binaryHeaderOffset = 20 + jsonLength;
  const binaryLength = source.readUInt32LE(binaryHeaderOffset);
  const binary = source.subarray(binaryHeaderOffset + 8, binaryHeaderOffset + 8 + binaryLength);

  json.images[1] = {
    name: "ReserveUrTime_Mojo_BaseColor",
    uri: textureUri
  };
  json.textures[1] = {
    sampler: json.textures[1]?.sampler ?? 0,
    source: 1
  };

  const encodedJson = Buffer.from(JSON.stringify(json));
  const paddedJsonLength = align4(encodedJson.length);
  const paddedBinaryLength = align4(binary.length);
  const output = Buffer.alloc(12 + 8 + paddedJsonLength + 8 + paddedBinaryLength, 0x20);

  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(paddedJsonLength, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  encodedJson.copy(output, 20);

  const outputBinaryHeader = 20 + paddedJsonLength;
  output.writeUInt32LE(paddedBinaryLength, outputBinaryHeader);
  output.writeUInt32LE(0x004e4942, outputBinaryHeader + 4);
  binary.copy(output, outputBinaryHeader + 8);

  fs.writeFileSync(path.join(publicDirectory, "hero-assets", "soda", outputName), output);
}

buildModel("mojo-green.glb", "/hero-assets/mojo-green-bangladesh-v3.png");
buildModel("mojo-blue.glb", "/hero-assets/mojo-blue-bangladesh-v3.png");
