const fs = require("fs");
const path = require("path");

const file = path.join(
  __dirname,
  "..",
  "node_modules",
  "@iternio",
  "react-native-tts",
  "index.ts",
);

if (!fs.existsSync(file)) {
  console.log("patch-tts: skipped (@iternio/react-native-tts not installed)");
  process.exit(0);
}

const MARKER =
  "/* ATLASYS_PATCHED: react-native never exported NativeModule */";

let src = fs.readFileSync(file, "utf8");
if (src.includes(MARKER)) {
  console.log("patch-tts: already patched");
  process.exit(0);
}

const importSource =
  "import { NativeModules, NativeEventEmitter, Platform, EmitterSubscription, NativeModule } from 'react-native';";
const listenerSource = "return this.addListener(type, handler);";

if (!src.includes(importSource) || !src.includes(listenerSource)) {
  throw new Error("patch-tts: expected source patterns were not found");
}

src = src.replace(
  importSource,
  [
    "import { NativeModules, NativeEventEmitter, Platform, EmitterSubscription } from 'react-native';",
    MARKER,
    "type NativeModule = { addListener(eventType: string): void; removeListeners(count: number): void; };",
  ].join("\n"),
);

src = src.replace(
  "return this.addListener(type, handler);",
  "return this.addListener(type, handler as (...args: readonly Object[]) => unknown);",
);

fs.writeFileSync(file, src);
console.log("patch-tts: patched");
