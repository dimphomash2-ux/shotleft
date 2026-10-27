# Sho't Left — drop-in audio

The game makes all its sound in code, so this folder can stay empty. To use your own recordings,
put files with these exact names next to `index.html` in the app build (for Capacitor: `www/audio/`).
Any file that's missing just keeps the built-in synth version.

| File | What it is | Notes |
| --- | --- | --- |
| `audio/menu.ogg` | Menu music | Loops. ~112 BPM, laid-back amapiano. 60–120 s. |
| `audio/game.ogg` | In-game music | Loops. Lighter than the menu loop. |
| `audio/final.ogg` | Home-stretch layer | Loops in sync on top of `game.ogg` and fades in when a driver reaches 80% of the target. Same length and tempo as `game.ogg`. |
| `audio/win.ogg` | Results stinger | Plays once, about 5 s. |
| `audio/voice/shotleft.ogg` | "Sho't left!" | Each voice line under 1.5 s. |
| `audio/voice/sharp.ogg` | "Sharp sharp!" | |
| `audio/voice/ayeye.ogg` | "Ayeye!" | |
| `audio/voice/eish.ogg` | "Eish!" | |
| `audio/voice/hhayibo.ogg` | "Hhayi bo!" | |
| `audio/voice/siyaya.ogg` | "Siyaya!" | |
| `audio/voice/fulltaxi.ogg` | "Full taxi!" | |

Export as OGG Vorbis, 96–128 kbps. Music around −16 LUFS, voice and effects peaking near −3 dBFS,
silence trimmed from both ends. Log every file in `LICENSES.md`.
