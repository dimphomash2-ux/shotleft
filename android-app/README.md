# Sho't Left! — Android app (Capacitor)

A fresh Capacitor shell around the game. The whole game is one file, `www/index.html`, written by `../build.py`
(the **store build**: no owner edition, no test unlock, no preview store; Full Tank only through Google Play).

Nothing here is built or signed yet. The release build waits for the word **BUILD** (Phase 10).

## One-time setup (on your computer)

1. Install Node.js 20+, Android Studio (with SDK 36), and JDK 21.
2. In this folder:
   ```bash
   npm install
   npx cap add android
   npm run sync
   ```
3. Open `android/` in Android Studio (`npm run open`). Phase 10 sets targetSdk/compileSdk 36, the game category,
   the version code and signing.

## What each plugin does

| Plugin | Used for |
| --- | --- |
| `cordova-plugin-purchase` 13.13.1+ | Google Play Billing Library 8: price, purchase, acknowledge, restore (`window.CdvPurchase`, wrapped by `SLBilling` in the game) |
| `@capacitor/app` | Back gesture and exit (`App.exitApp`), resume events |
| `@capacitor/haptics` | Crisp haptics (light / medium / heavy / success) |
| `@capacitor-community/in-app-review` | Play's in-app review sheet, on the podium after the 3rd finished game |
| `@capacitor/share` + `@capacitor/filesystem` | Sharing the 1080 × 1920 winner card through the Android share sheet |

## Google Play Console

- Create one **one-time product** with ID `full_tank_edition`. Set R29 for South Africa and a price for every other
  country you sell in. The game always shows the price Google Play sends, so never type it into the game.
- Add licence testers, then test on the internal track: buy, cancel, pending (slow card), error, refund, and
  reinstall then Restore purchase.
- The `com.mashmade.shotleft` app ID is a placeholder: change it in `capacitor.config.json` before the first upload.
  It can't be changed after that.

## Drop-in audio

Put your own recordings in `www/audio/` (see `../audio/README.md`). Missing files keep the built-in synth sounds.
After `npm run web`, copy the `audio` folder into `www/` again.
