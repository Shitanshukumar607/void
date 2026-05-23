# VOID

An SSH mystery game. Connect to an abandoned island research facility's relay system. Something escaped. Read the logs, find out what.

## Play

```
ssh void.shitanshu.me
```

No account, no password. Connect and start reading.

### How to play

1. Read the logs `cat day-1.log` through `cat day-7.log`
2. Certain files unlock new areas. Watch for it.
3. `scan` to see unlocked areas, `connect <area>` to move.
4. The story is in the files. Read everything.

## Run Locally

Requires Node.js v18+.

```bash
git clone https://github.com/Shitanshukumar607/void.git
cd void
npm install

ssh-keygen -t rsa -b 2048 -f host.key -N ""

cp .env.example .env
npm run dev
```

Connect with `ssh localhost -p 2222`.

## Project Structure

```
src/
├── index.ts          # boots the SSH server
├── ssh/server.ts     # connection handling, auth
├── renderer/tui.ts   # terminal UI (blessed)
├── engine/game.ts    # command parser, game logic, progression
├── world/data.ts     # areas, files, lore, story
└── test-client.ts    # automated test client
```

## Contributing

Fork it, follow the [local setup](#run-locally), make your changes, open a PR against `main`.

## License

ISC
