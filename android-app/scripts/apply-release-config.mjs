// Applies Sho't Left's Play release settings to the Android project that `npx cap add android` made.
// Safe to run again: every change checks first. Run from android-app/:  npm run release-config
import fs from "node:fs";
const VERSION = JSON.parse(fs.readFileSync("package.json", "utf8")).version;          // e.g. 2.17.0
const [MA, MI, PA] = VERSION.split(".").map(Number), VERSION_CODE = MA * 10000 + MI * 100 + PA;   // 2.17.0 -> 21700
const edit = (file, fn) => { const a = fs.readFileSync(file, "utf8"), b = fn(a); if (a !== b) { fs.writeFileSync(file, b); console.log("updated", file); } else console.log("ok     ", file); };
if (!fs.existsSync("android")) { console.error("No android/ folder yet. Run: npx cap add android"); process.exit(1); }

// 1. Target Android 16 (API 36): Play requires targetSdk and compileSdk 36 for new apps and updates
edit("android/variables.gradle", s => s
  .replace(/compileSdkVersion\s*=\s*\d+/, "compileSdkVersion = 36")
  .replace(/targetSdkVersion\s*=\s*\d+/, "targetSdkVersion = 36")
  .replace(/minSdkVersion\s*=\s*\d+/, m => (+m.match(/\d+/)[0] < 24 ? "minSdkVersion = 24" : m)));

// 2. The manifest: game category (exempts the game from Android 16's large-screen orientation override),
//    landscape on phones, no restart on rotation or keyboard
edit("android/app/src/main/AndroidManifest.xml", s => {
  if (!/android:appCategory=/.test(s)) s = s.replace(/<application\b/, '<application android:appCategory="game"');
  if (!/android:screenOrientation=/.test(s)) s = s.replace(/(<activity\b[^>]*android:name="\.MainActivity")/, '$1 android:screenOrientation="sensorLandscape"');
  return s;
});

// 3. Version code + name from package.json, and release signing from keystore.properties (never committed)
edit("android/app/build.gradle", s => {
  s = s.replace(/versionCode\s+\d+/, `versionCode ${VERSION_CODE}`).replace(/versionName\s+"[^"]*"/, `versionName "${VERSION}"`);
  if (!/keystore\.properties/.test(s)) {
    s = s.replace(/android\s*\{/, `def keystoreProps = new Properties()
def keystoreFile = rootProject.file("../keystore.properties")
if (keystoreFile.exists()) { keystoreProps.load(new FileInputStream(keystoreFile)) }

android {
    signingConfigs {
        release {
            if (keystoreFile.exists()) {
                storeFile file(keystoreProps["storeFile"])
                storePassword keystoreProps["storePassword"]
                keyAlias keystoreProps["keyAlias"]
                keyPassword keystoreProps["keyPassword"]
            }
        }
    }`);
    s = s.replace(/(buildTypes\s*\{\s*release\s*\{)/, `$1\n            signingConfig signingConfigs.release`);
  }
  return s;
});
console.log(`\nSho't Left ${VERSION} (versionCode ${VERSION_CODE}) is set for targetSdk 36, appCategory game, landscape.`);
console.log("Next: put your keystore next to package.json and fill in keystore.properties (see keystore.properties.example).");
