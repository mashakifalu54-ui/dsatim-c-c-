# CS Quest

A study game for the TVET CDACC Level 6 Computer Science units. Each unit is a
world, each topic is a level, and every correct answer earns XP.

## How it fits together

```
Android app (Expo)  --->  API (Neon Function)  --->  Postgres database (Neon)
     app/                     api/                      database/
```

- **app/** is the game itself: React Native screens built with Expo.
- **api/** is a small server. The app only talks to this API, so the database
  password is never inside the APK. Answers are checked here, not on the phone.
- **database/schema.sql** recreates the tables. The questions live in the database.

## Screens

| Screen  | File                              | What it does                           |
| ------- | --------------------------------- | -------------------------------------- |
| Welcome | `app/src/screens/WelcomeScreen.js` | Pick a player name (first launch only) |
| Home    | `app/src/screens/HomeScreen.js`    | XP, streak and the list of worlds      |
| World   | `app/src/screens/WorldScreen.js`   | Level map; levels unlock in order      |
| Quiz    | `app/src/screens/QuizScreen.js`    | Answer questions, get instant feedback |
| Result  | `app/src/screens/ResultScreen.js`  | Stars, score and streak for the level  |

## Rules of the game

- Three question types: multiple choice, fill in the blank, and find the bug.
- 10 XP for a first correct answer, 2 XP for repeating one you already got right.
- Stars per level: 50% = 1 star, 70% = 2 stars, 90% = 3 stars.
- One star unlocks the next level.
- Playing on consecutive days builds a streak (days are counted in Nairobi time).

## Run it on your computer

```
cd cs-quest/app
npm install
npx expo start
```

Then scan the QR code with the Expo Go app on your phone.

## Build the APK

```
cd cs-quest/app
eas build --platform android --profile preview
```

## Not built yet

- Countdown timer for boss levels
- Lives
- Weak Spots review mode (the database view already exists)
