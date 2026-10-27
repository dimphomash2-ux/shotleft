# Sho't Left! — Release guide (2.17.0, versionCode 21700)

## 1. One-time setup (your computer)

1. Install Node.js 20+, Android Studio with **Android SDK 36** (SDK Manager › Android 16), and JDK 21.
2. In `android-app/`:
   ```bash
   npm install
   npx cap add android
   npm run release-config     # targetSdk/compileSdk 36, appCategory="game", landscape, version code, signing
   npm run sync               # rebuilds the game and copies it into the app
   ```
3. Make the upload key once, then fill in `keystore.properties` (copy `keystore.properties.example`):
   ```bash
   keytool -genkeypair -v -keystore shotleft-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
   Back up `shotleft-upload.jks` and both passwords in two safe places. In Play Console turn on **Play App Signing**.

## 2. What the release config sets (and why)

| Setting | Value | Why |
| --- | --- | --- |
| compileSdk / targetSdk | 36 | Play requires API 36 for new apps and updates since 31 Aug 2026 |
| Billing | cordova-plugin-purchase 13.13.1+ (Billing Library 8) | Billing 8+ required since 31 Aug 2026 |
| `android:appCategory` | `game` | Exempts the game from Android 16's large-screen orientation override |
| Orientation | `sensorLandscape` | The game is landscape; tablets keep landscape |
| Edge-to-edge | `adjustMarginsForEdgeToEdge: auto` + CSS safe-area insets | Compulsory on Android 16 |
| Back | Capacitor App `backButton` → the game's back map | Predictive back on Android 16; never an accidental exit |
| versionCode | major×10000 + minor×100 + patch (2.17.0 → 21700) | From `package.json` version; bump it there |

## 3. 16 KB page-size check

None of the plugins ship native `.so` libraries (Capacitor, Billing, Share, Filesystem, Haptics and In-app review are Java/Kotlin), so there should be nothing to align. Confirm after the first build:
```bash
unzip -l android/app/build/outputs/bundle/release/app-release.aab | grep "\.so$" || echo "no native libraries: 16 KB OK"
```
If any `.so` appears, run Android Studio's APK Analyzer on it (it flags 16 KB alignment), or `zipalign -c -P 16 -v 4` on the APK.

## 4. When you type BUILD

1. Bump `version` in `package.json` (e.g. 2.17.1). `npm run release-config` turns it into the version code.
2. `npm run sync`
3. `npm run bundle` → `android/app/build/outputs/bundle/release/app-release.aab` (upload this to Play)
4. `npm run apk` → `android/app/build/outputs/apk/release/app-release.apk` (for testing on phones)
5. Play Console › your app › Testing › Closed testing › Create release › upload the `.aab`.

## 5. Test matrix (before production)

Test on a budget phone (2–3 GB RAM), a mid-range phone and a tablet, with Android 16 on at least one.

| Area | Check |
| --- | --- |
| First launch | Intro ≤ 2 s, Sound on?, Teach me, lands on the menu |
| Back gesture | Every screen: dialogs close, sheets close, in game opens Pause, menu asks before exit |
| Resume | Close the app mid-turn (swipe away), reopen: Continue resumes the exact step |
| Airplane mode | Whole game plays; only the store says "No signal at the rank" |
| Full Tank (licence tester) | Price shows R29.00; buy; cancel; pending (slow test card); error; success tour |
| Restore | Uninstall, reinstall, Restore purchase unlocks; still unlocked in airplane mode |
| Refund | Refund in Play Console, reopen: locked again with a plain note |
| Display | Large text + Android font size 130%: nothing clipped; notch and gesture bar never cover buttons |
| Performance | Board stays smooth on the budget phone (Settings › Graphics › Low if needed); cold start < 3 s |
| Share | Share card opens the Android share sheet; WhatsApp Status gets the image |
| Review | After the 3rd finished game, Play's review sheet shows on the podium |

## 6. Play Console checklist

- [ ] Store listing, graphics and screenshots (see the Store Kit doc and `../store-kit/`)
- [ ] Privacy policy URL, Data safety ("no data collected"), content rating, target audience
- [ ] One-time product `full_tank_edition`, R29 in South Africa, prices for other countries, payments profile
- [ ] Closed test: 12+ testers opted in for 14 days in a row (personal accounts made after 13 Nov 2023)
- [ ] "Sho't Left" name check with CIPC or an IP attorney (South African Tourism runs a "Sho't Left" campaign)
