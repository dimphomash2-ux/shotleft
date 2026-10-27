# Sho't Left — Changelog

## 2.17.0 (release prep, Phase 10) — 27 Oct 2026
- **Android back**: in the Capacitor app, the system back gesture goes through the game's back map (Capacitor App `backButton`, an OnBackPressedCallback), so predictive back on Android 16 works and never exits by accident.
- **Release config script** (`android-app/scripts/apply-release-config.mjs`, run with `npm run release-config`). Safe to run again: a second run changes nothing. Tested on the standard Capacitor template files. It sets:
  - compileSdk and targetSdk 36, minSdk 24
  - `android:appCategory="game"`
  - sensorLandscape orientation
  - version code from the version (2.17.0 → 21700)
  - release signing from a `keystore.properties` that's never committed
- **Edge-to-edge**: `adjustMarginsForEdgeToEdge: auto` in capacitor.config.json, alongside the existing CSS safe-area insets.
- **`android-app/RELEASE.md`**: setup, what each setting does, the 16 KB check, the BUILD steps, the device test matrix and the Play Console checklist.
- **Verified**: the rules engine is unchanged from 2.9.1 apart from the two Phase 8 wording fixes. The simulation finishes every game in all modes. A full game in airplane mode makes zero network requests.

## 2.17.0 — Phase 8: Polish (27 Oct 2026)
- **Accessibility audit of all 14 screens** at 740×360, 844×390, 1024×768 and 1280×800, normal and Large text. It checks touch targets, accessible names, text contrast, clipped text and sideways scrolling. Fixed:
  - **Contrast**, now at least 4.5:1 (3:1 for large type):
    - the "Rank tip" label
    - the Full Tank canopy
    - the tutorial's step labels
    - the passenger-race "Going to" sign (dark text on green, 2.6:1, is now white text)
    - the tutorial title on tablets
  - **Touch targets**, now at least 44 px: the race driver buttons, the "Wrong sign?" toggle, and the volume sliders (the hit area was 12 px tall; the track still looks the same).
  - **Screen-reader labels**: the wrong-sign buttons now say "Thabo: wrong sign, −R10".
- **Tablets**: wider in-game panel, taller buttons, a bigger podium centred on the results screen, and a little more breathing room on every sheet.
- **Wording**:
  - Money questions now say "1 fare", not "1 fares".
  - The "Gogo with three bags" passenger is always a gogo (it could land on any name, like "Sbu").
- **Error log**: unexpected errors are kept on the phone (last 20) and attached to Contact support emails, which appear once the support email is set.
- **What's new at the rank**: a one-time card after an update, for returning players only. Never over another dialog.
- **App feel**: no long-press menus or pull-to-refresh bounce.
- **Performance with the processor slowed 4×**: 2.7 s from cold start to a usable menu, including the 1.5 s branded intro (budget 3 s). Menu frame rate matches 2.9.1, about 45 fps in game, and a 17 MB memory footprint.
- **Known**: real-device checks (budget phone, mid-range, tablet) and Android 130% font scaling need the built app (Phase 10). The 3D board is the main frame-rate cost on slow phones; Settings › Graphics › Low still helps there.

## 2.16.0 — Phase 7: Garage and Full Tank (27 Oct 2026)
- **Full Tank store, rebuilt.**
  - **Layout:** your own taxi pulls into a Full Tank fuel station. The screen has the title, "One payment. Yours forever. No ads. No subscriptions.", five benefits that are all built, "Fill up – [price]", Restore purchase and "One-time purchase through Google Play." There's a 48 dp close button.
  - **Every state is designed:**
    - loading: a shimmering button, then offline after 8 s
    - offline
    - buying: the store dims
    - pending: nothing unlocks
    - success: the gauge swings to F with a hooter chorus, confetti and a quick tour (Play Kasi Chaos, Open the Garage, Custom rules)
    - cancelled: closes quietly
    - error: Try again
    - already owned: a thank-you
    - refunded: locked again, with a plain note
  - **Price:** always the one Google Play sends, never typed into the game.
- **Lock badges open a bottom sheet** (Kasi Chaos and other modes in setup, Garage items) instead of a full-screen interruption. Back closes it.
- **One gentle prompt per session**, only after a finished game and only for non-owners: "Loved that? Fill the tank for more ways to play." with Maybe later. Never on first launch, never mid-game.
- **Google Play Billing**: a bridge (`SLBilling`) over cordova-plugin-purchase 13.13.1+ (Billing Library 8).
  - One non-consumable product, `full_tank_edition`.
  - A PURCHASED payment is acknowledged straight away. A PENDING one never unlocks.
  - Cancels and errors are told apart.
  - Purchases are re-checked at every start and every return to the app. The unlock is cached for offline play.
- **Owner edition and test unlock removed.** `SL_OWNER` is now `false` in every build. Old test unlocks are ignored. The Style Guide shows a read-only Full Tank status.
- **Two builds from `build.py`:**
  - **Store build** (`dist/store/index.html`, copied to `android-app/www/`): real Google Play only. In a plain browser it says purchases need the Google Play version.
  - **Artifact preview** (`dist/index.html`): a clearly labelled preview store ("no money changes hands here") with Buy, Pending, Fail and Cancel test choices, plus Reset the test purchase and Clear the pending payment, so every state can be tried without money.
- **The Garage** (new on the menu): pick a driver, drag the turntable to spin their taxi, and change six things. Every change plays its sound and pops the preview.

  | Tab | Choices | Sound |
  | --- | --- | --- |
  | Paint | 8 colours | spray-can hiss |
  | Stripes | 5 styles | tape |
  | Rims | 5 finishes | chrome ting |
  | Roof | colour sign, Sho't Left sign, luggage rack, spotlights, spoiler | thunk |
  | Stickers | 5 stickers | slap |
  | Hooter | 6 styles | the hooter itself |

  - Free: 4 paints and 2 hooters. Full Tank: everything. Locked items stay visible with the pump badge.
  - Each name keeps its look. It shows in setup, on the handoff card, the podium, the share card and the Hall of Fame. The chosen hooter plays at turn start, the roll-off, overtakes and the results chorus.
  - The colour band always stays, so drivers can still tell taxis apart (colour-blind safe).
  - On the 3D board, taxis keep their player colours.
- **Fresh Capacitor project** in `android-app/`: package.json, capacitor.config.json (placeholder app ID `com.mashmade.shotleft`), the plugin list and setup steps. Not built or signed: that waits for BUILD.
- **Menu**: How to Play, Garage, Settings, then a wide Full Tank button and Hall of Fame.
- **Known**: the Hall of Fame and awards stay free (more generous than the prompt's split). Whether Full Tank includes future content is still your call.

## 2.15.0 — Phase 6: Results and learning (27 Oct 2026)
- **New podium results screen.** After the winner's drive into the rank:
  - The podium rises and the winner's taxi drives onto first place, with second and third popping up beside it.
  - The mascot dances, everyone's hooters play from last place up to the winner, and confetti falls in the winner's colour. A tap skips the intro.
  - Every driver is ranked with money, passengers, earnings and fines. Five or six drivers go into two compact columns, so it never scrolls on a phone.
  - Buttons: Rematch (same crew), New game, Share, Main menu and Hall of Fame.
- **Three fun awards per game, picked from 16**: Bank Manager, Gaartjie of the Year, Clean Licence, Big Spender, Robot Runner, Speed Demon, Safety First, Roadblock Regular, Pothole Magnet, Lucky Charm, Maths Mfundisi, Overtake Ace, Hooter Champ, Slow Hand, Eagle Eye and Leaky Taxi.
  - An award only goes to a clear winner (no ties), and the three are spread across different drivers when possible.
  - The extra stats behind them (spaces, gears, cop stops, card luck, maths, overtakes, hooter results, sneaky catches, lost passengers) are counted from the game's own events. They're saved with the game.
- **Share card**: a 1080 × 1920 image for WhatsApp Status, TikTok and Instagram Stories, made on the phone with no internet. It has the logo, "King of the rank", the winner's name and taxi in their colour, the scores and "Get Sho't Left on Google Play".
  - In the Android app it goes to the system share sheet (Capacitor Share and Filesystem). In a browser it uses the web share sheet when there is one, or Save image.
- **Hall of Fame** (on the menu, replacing About, which is still in Settings): games played, best score, longest win streak, then every driver's wins, games, best score and favourite taxi colour. It's saved on this phone only. The empty state shows the mascot, "No trips yet. The rank is quiet... for now." and a Siyaya! button.
- **How to Play, rebuilt as a hub with four tabs:**
  - **Learn**: "Teach me (60 seconds)", an interactive mini turn in 5 steps (call, race, gear, robot, drop-off).
    - The new mascot explains one idea per step while a ghost finger glides to what to tap.
    - Includes the fuzzy dice, a card flip, the money counting up and a maths question that coaches you if you pick wrong.
    - Skippable, and replayable from the end screen or the Learn tab.
  - **Rules**: the illustrated sections from 2.9.1, restyled, with search ("cop", "gear", "maths"…). "Show me" buttons replay that step of the lesson and come back to the rules.
  - **Cards**: every road card and Kasi Chaos card with its good/bad/fun colour and effect icons, plus every passenger type and special passenger. Full Tank items stay visible with the lock badge.
  - **Slang**: 12 terms (sho't left, gaartjie, rank, robot, hooter, eish, sharp sharp, ayeye, hhayi bo, siyaya, kasi, taxi boss).
- **The mascot**: an original cheeky minibus in a jacaranda gaartjie cap. It blinks, waves, talks and dances, and keeps still with Reduce Motion.
- **First run**: "New to Sho't Left?" now offers "Teach me (60 seconds)", which opens the lesson.
- **Back**: the lesson and Hall of Fame return to where you came from. Back from the Hall of Fame opened on the results returns to the results.

## 2.14.0 — Phase 5: Game feel (27 Oct 2026)
- **Fuzzy dice replace the speedometer.** Choosing a gear rolls a fuzzy die in the driver's colour. It drops from a rear-view mirror, tumbles, lands with a clack, and the result shows big for about 0.6 s before the taxi moves: "3 SPACES · Rolled 5, low gear halves it". A roadblock roll flashes blue and red with a whistle. Every roll is still written to the "What happened?" log.
- **Every meaningful moment now has motion, sound and touch:**

  | Moment | Motion | Sound | Haptic |
  | --- | --- | --- | --- |
  | Taxi passes a space | Hop and dust puff | Engine blip | Light tick |
  | Passenger boards | Seat bar pops on the chip | Seat pop, sometimes "Sho't left!" | Light |
  | Money earned | Label and coins fly from the taxi to the chip, which counts up in green | Cha-ching | Medium |
  | Money lost | Coins fly out of the chip, which counts down in red | Deflated "eish" slide | Medium |
  | Bad road card | Red flash, card shakes | Low sting, "Eish!" or "Hhayi bo!" | Heavy |
  | Good road card | Green glow and sparkles | Bright sting | Medium |
  | Overtaking | Speed lines, "Overtook Lindiwe!" | Whoosh and the driver's hooter | Double tick |
  | Home stretch (a driver reaches 80% of the target) | Golden light over the city, banner | In-game music adds its final layer, "Siyaya!" | None |
  | Win | Confetti (podium in Phase 6) | Fanfare, crowd, "Ayeye!" | Celebration pattern |
  | Dice roll (extra) | Mirror drop, tumble, land | Rattle and clack | Light, then medium |
  | Roadblock roll (extra) | Die flashes blue/red | Whistle | Heavy |
  | Fare answer (extra) | Green glow if right, shake and red if wrong | Right/wrong stings, "Sharp sharp!" | Medium / heavy |
  | Sneaky passenger (extra) | — | "Sharp sharp!" when caught, "Eish!" when they escape | Medium / heavy |
  | Pothole (extra) | The board shakes | Bump | Heavy |
  | Full taxi (extra) | "Full taxi!" on the chip | "Full taxi!" | — |
  | Menus (extra) | — | Back, toggle on/off and error sounds | Light |

- **Road cards** slide up from the deck and flip over from a Sho't Left card back. Each card is tagged good (green top), bad (red top) or fun, with icon chips for its effect ("Miss a turn", "−1 passenger", "+R20"). The amounts come from the rules config. Two Kasi Chaos cards were shortened to stay under 20 words ("Two drivers, one passenger" and "Auntie takes charge"); the rules are unchanged.
- **Voice lines with captions**: "Sho't left!", "Sharp sharp!", "Ayeye!", "Eish!", "Hhayi bo!", "Siyaya!" and "Full taxi!" appear in a speech bubble. At most one plays every 3 turns, never the same one twice in a row; the win, home stretch and full taxi always play. Until real recordings are added they use a short synthesised "talkie" voice that follows the rhythm of the words.
- **Music**: a new layered amapiano groove at 112 BPM (log drum, shaker, jazzy keys on Fmaj9–Em9–Dm9–Am9), scheduled on the audio clock so it stays steady. The menu has the full groove. In game a lighter version plays, and its final layer (claps, open hats, log-drum fills, a rising pad) fades in for the home stretch. The win plays a 5-second fanfare. Music dips to about 60% under voice lines and big stings. Everything pauses in the background and resumes on return.
- **Drop-in audio**: put your own files in an `audio/` folder (`menu.ogg`, `game.ogg`, `final.ogg`, `win.ogg`, `voice/*.ogg`) and they replace the synth versions. See `audio/README.md`.
- **Settings › Sound** adds a Voice lines slider (it plays a sample line).
- **Fast Mode** halves every new animation and trims the new pauses. **Reduce Motion** drops the flights, flips, shakes, dust, speed lines and tumble, but keeps the colours, sounds, captions and haptics.
- **Haptics** use the platform haptics plugin when the Android build has one, otherwise short vibration pulses. All follow Settings › Vibration.
- **Known**: shake-to-roll isn't added, because choosing a gear is the roll. Voice lines are placeholders until recorded. The win podium comes in Phase 6.

## 2.13.0 — Phase 4: Board and HUD (27 Oct 2026)
- **New HUD in Rank-side Pop**: round, play-to and mode chips on the left, and four sticker icon buttons on the right: What happened?, Overview, Re-centre camera and Pause.
- **Player strip**: every driver chip shows their colour badge (colour + pattern + icon), money, seats and next stop. The driver whose turn it is gets an amber frame. Tap a chip to see that driver's taxi: passengers, where they're going, fares, delivered, earned and fines.
- **"What happened?"**: the last 14 moves, newest first, each with an icon (dice, seat, coin, runner) in the driver's colour. Dice rolls are now part of the log ("Thabo rolled a 3 in high gear: 3 spaces").
- **Long-press the board**: hold on any space for half a second to see what it is: the rank, its hand sign, how many passengers are heading there and who is parked on it. The tooltip always stays fully on screen.
- **Every in-game panel restyled** (passenger race, gears, fares, road cards, sneaky passenger, strikes) on the light taxi-white skin, with cards, a fuel-style timer bar and sticker answer buttons.
- **No more scrolling on short landscape phones**: wide panels use two columns (the card or passenger on the left, actions or answers on the right) and run down to the bottom edge. Long money questions step down in size (never below 13 px). If a long question still doesn't fit, its answers move under the card. Tested with 2, 4 and 6 drivers at 740×360, 844×390 and 915×412: no panel needs a scroll.
- **Turn banner** ("Thabo, you're driving!") now stays in the open space left of the panel instead of covering it, and its round line is readable over other messages.
- **Messages**: at most three stack over the city at once.
- **Kept**: the 3D city board art and camera from 2.9.1 (already in the new style's colours). No rules, money or save changes.
- **Known**: no undo (the rules engine has none). A few generated questions say "1 fares" (wording fix in Phase 8). How to Play, the shop and the podium keep the old style until Phases 6–7.

## 2.12.0 — Phase 3: Load the taxi, who goes first, pass the phone (27 Oct 2026)
- **Setup is now "Load the taxi"**, in Rank-side Pop: a drivers stepper (2–6), one row per driver and a fixed bottom bar with a summary and Start.
  - Each row has a live minibus in the driver's colour (tap it to pick a colour), the name (12 characters max, capitalised for you) and a dice button for a random South African taxi name.
  - The picker shows all 7 colour-blind-safe colours, each with its own pattern and icon. Colours already taken are greyed out with the owner's initial.
  - Each name remembers its favourite colour and gets it back when it's free.
  - "Same crew as last time?" restores the last crew's names and colours in one tap.
  - Game modes appear as cards, with Full Tank badges on the premium ones. Play-to, maths time and hand-sign hints use the new controls; the custom rules are restyled.
  - Start is greyed out with a reason when two drivers share a name, and tapping it says why.
- **New player colours** across the board, the taxis and the player strip: orange, sky blue, bluish green, yellow, blue, vermillion and reddish purple. They're applied after the game is created, so the rules engine is untouched.
- **Who goes first**: a fuzzy-dice roll-off. Dice tumble in each driver's colour, ties roll again, and the winner's hooter sounds. It only rotates the seating order, so who sits on whose left (and who does whose maths) never changes. A tap skips it.
- **Pass the phone**: between turns, a full-screen card in the next driver's colour and pattern shows their minibus, their name in big type, the round, their money and seats, plus "Let's go, [Name]" (which calls the first passenger straight away). Each driver has their own hooter pitch, with a double vibration.
  - Back or the pause button opens the pause menu. Resuming shows the card again.
  - Settings › Game › Turn handoff switches between Full card and Quick banner.
- **Table Mode** (Settings › Game): mark drivers "Across the table" in setup, and their handoff card and action panel turn 180° to face them. The front-seat maths panel faces whoever answers.
- **Rematch and Restart** keep everyone's colours. Old saves without colours still load.
- **Messages from full screens** (setup, settings) now appear above the screen. Before, they were hidden behind it.
- **Fixed**: the "Same crew" button could miss a tap while a name box had focus, because it was being rebuilt mid-press.

## 2.11.0 — Phase 2: App shell (27 Oct 2026)
- **Launch intro**: on a cold start, a minibus door slides open on the logo with a hooter, plus "a Mash Made game". It takes 1.5 s and a tap skips it. Warm starts and Reduce Motion skip it entirely. "Tap to start" is gone.
- **First run** (once): "Sound on?" with a hooter test button, then "New to Sho't Left?" (Show me how, or We know how to play). No sign-up, no permissions.
- **Living menu ("The Rank")**: a new Rank-side Pop panel with a Continue card (players, round, "Saved 2 min ago"), Siyaya!, How to Play, Full Tank, Settings and About. Over the city:
  - taxis drive between ranks on their own
  - a rank tip changes every 9 s (22 tips, never the same twice in a row; tap for the next)
  - tapping the city gets a hooter and a shout
  - the city look follows the phone's clock (Day 05–09, Bright 09–16, Sunset 16–19, Night after 19:00)
  - seasonal touches: jacaranda petals in October–November, festive lights in December, afternoon rain in summer
- **Signature transition**: the minibus sliding door wipes between major screens (menu ⇄ setup, starting, continuing, quitting, rematch). Reduce Motion uses a fade.
- **Back button map**:
  - launch: skips the intro
  - first run: skips it
  - dialogs: closes them
  - menu: "Leaving the rank? Your game is saved." with Stay or Exit
  - setup, settings, help, about, shop: back to where you came from (a real history stack)
  - in game: opens the pause menu
  - pause menu: resumes
  - podium: back to the menu
- **Pause menu**: Back to the game, How to Play, Settings, Restart (with confirm) and Save & quit. Save & quit keeps the game for Continue; the old "End game, progress lost" is gone.
- **Settings, rebuilt in five groups**:
  - Sound: master, effects, music, mute (sliders play a sample)
  - Feel: vibration, Fast Mode, Reduce Motion
  - Display: text size, city look (Auto, Day, Sunset, Night, Bright), graphics, keep the screen on
  - Game: hand-sign hints
  - Purchases and help: Restore purchase, How to Play, About, plus Contact support and Privacy policy once those details are filled in
  - Hold-to-reset clears everything except purchases.
- **Saves**: the previous good save is kept as a backup. A damaged save falls back to it, or shows a clear message. Starting a new game over a saved one asks first. "Welcome back" shows when you return to a game.
- **Friendly error screen**: any unexpected error saves the game and shows "Eish, something went wrong. Your game is saved." with Try again and Back to menu.
- **Fonts**: every screen now uses the bundled Nunito, and the Google Fonts download is removed. The game needs no internet at all.
- **Performance fix (renderer)**: the Sunset, Night and Bright looks filtered every character sprite on every frame (1–2 fps with the processor slowed 4×). The sprite sheet is now filtered once per look: Night 2 → 21 fps, Bright 2 → 23, Sunset 2 → 14. Day is unchanged.
- **Text**: all new screen text lives in `src/strings.js` (en-ZA).
- **Known**: the Contact support and Privacy policy rows stay hidden until `SL_SUPPORT_EMAIL` and `SL_PRIVACY_URL` are set. Setup, How to Play, the shop, the in-game panels and the podium keep the old dark style until Phases 3–7. On short landscape phones, the passenger panel still needs a scroll to reach the player buttons, as in 2.9.1 (Phase 4).

## 2.10.0 — Phase 1: Design system (27 Oct 2026)
- Added the Rank-side Pop design system in one theme stylesheet (`src/design-system.css`): colour, player, type, spacing, shape, depth and motion tokens.
- Bundled Bungee and Nunito inside the game (Latin subset, 51 KB). Fonts now work fully offline.
- Added reusable components: sticker buttons (primary, secondary, go, danger, Full Tank, disabled-with-reason, small, icon), Full Tank lock badge, player chip with colour + pattern + icon, stepper, toggle, slider, segmented control, event cards, bottom sheet, dialog, toast, long-press tooltip, fuel gauge and confetti.
- Added a hidden Style Guide screen: tap the version number 7 times in About (or open the game with `#styleguide`). It includes Fast Mode and Reduce Motion switches, live contrast checks and a working demo of every component.
- The developer test unlock moved from About into the Style Guide. It is still a known store blocker and is removed in Phase 7.
- No change to rules, existing screens or saves. Version bumped from 2.9.1.
