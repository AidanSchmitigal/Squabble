# Squabble

It is competative Wordle.

Copied from [Ottomated's Squabble](https://squabble.me/) that doesn't seem to work anymore.

---

A game called Squabble for Competative Wordle. Here is the original website: `https://squabble.me/`. But you can no longer make games on it, so I want to remake the game.
I want it to be fun and modern with animations, sounds, and leaning heavily into the Gray / Green / Yellow themes of Wordle.
The header of that website (https://squabble.me/) has a beatiful animation, I want to mimic.
In this design you need to create the element and pages / screens that will go into this game. Here are some, but please come up with more:

1. Main screen w/ title, personal settings & preferences, Join with code or Create game.
2. The lobby screen with the game code & QR code. A player list of players that have joined (each with their own hand-drawn character icon). In this lobby, when players joins they should be able to name themselves and draw a low-res image to use as their icon. For the room host, there should be some game setting toggles / selects.
3. In the game. It works like this: There is fixed world list / order that everyone goes through. They need to play classic Wordle to solve the word. Keep guessing words until you're the last one standing.
   Guess right and deal damage, guess wrong and take damage.
   You take 1 damage every second, and heal damage when you guess right.
   Yellow letters indicate that the letter is in the word in a different position.
   Green letters indicate that the letter is in the correct position. When you finish a word, like in Tetris 99, it sends garbage to another player and fills one of their rows / letters. In this game view you can see all the other players on the side along with their health, icons, what tiles they have filled in (but no letters visible).
4. There also needs to be a win / loss screen for the players to see their standing and store their score in localstorage.
