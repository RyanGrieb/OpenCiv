# OpenCiv ![tile_city](https://github.com/rhin123/OpenCiv/blob/master/client/assets/archive/tile_city.png?raw=true)

![example workflow](https://github.com/rhin123/OpenCiv/actions/workflows/build.yml/badge.svg)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=RyanGrieb_OpenCiv&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=RyanGrieb_OpenCiv)
[![Discord](https://img.shields.io/discord/925176383792087081.svg?logo=discord&logoColor=white&logoWidth=20&labelColor=7289DA&label=Discord&color=17cf48)](https://discord.gg/WFteeen5fu)

![OpenCiv in game](https://github.com/rhin123/OpenCiv/blob/master/meta/screenshots/new_ui_2.png?raw=true)

OpenCiv is a turn-based strategy game inspired by Sid Meier's Civilization, focused on Civ 5's mechanics. It runs **in your web browser**, so there's nothing to install to play once a server is running.

> The game is under active development. There's no public server yet, so for now you run your own (below). Expect missing features and rough edges.

## Playing

### Start a game

You need either [Docker](https://www.docker.com/) or [Node.js](https://nodejs.org/) (which includes npm).

```bash
git clone https://github.com/RyanGrieb/OpenCiv.git
cd OpenCiv
```

**With Docker:**

```bash
docker compose up -d
```

**With Node.js:**

```bash
npm run install-all
npm start
```

Then open **http://localhost:1234** in your browser.

### Play with friends

The person running the server shares their address. Everyone else opens the game at `http://<their-address>:1234`, clicks **Join Game** and connects. The join screen also accepts an explicit `host:port` when the server runs on a non-default port. Players need to be on the same network, or the host needs to forward ports `1234` (the game page) and `2000` (the game server).

### Game options

The host can change options in the lobby before starting:

| Option | Default | What it does |
| --- | --- | --- |
| Map size | Medium | Duel, Tiny, Small, Medium, Large, Huge, or custom dimensions under advanced options. |
| City-states | 6 | How many city-states are placed on the map. |
| Barbarians | On | Whether barbarian camps spawn. |
| Wrap map | On | Connects the east and west edges so the world is a cylinder. |
| Reveal map | Off | Turns off fog of war (meant for debugging). |

### Controls

| Input | Action |
| --- | --- |
| `W A S D` / arrow keys / left-click drag | Move the camera |
| Mouse wheel / `=` and `-` | Zoom in and out |
| Left-click a unit, then right-click a tile | Move the unit |
| Left-click a city | Open the city screen |
| **Next Turn** button | End your turn |
| `Esc` | Settings |

## Community

Come say hi, report bugs or suggest features on [Discord](https://discord.gg/WFteeen5fu), or open an issue on GitHub.

Want to contribute? See [DEVELOPMENT.md](DEVELOPMENT.md).

## Credits

Contributors: [Will Pewitt](https://github.com/willpewitt)

### Artists

| Artist | Contribution |
| --- | --- |
| [lucasyoung988](https://www.fiverr.com/lucasyoung988?source=order_page_summary_seller_link) | Commissioned game art |
| [brysia](https://www.fiverr.com/brysia?source=order_page_summary_seller_link) | Commissioned game art |
| [pratamacam](https://www.fiverr.com/pratamacam?source=order_page_summary_seller_link) | Commissioned game art |
| [CharlesGabriel](https://opengameart.org/content/10-basic-message-boxes) | Message boxes |
| [BatzelChaos](https://www.pixilart.com/batzelchaos) | Shield icon |

## License

See [LICENSE](LICENSE).
