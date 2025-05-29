# OpenCiv ![tile_city](https://github.com/rhin123/OpenCiv/blob/master/client/assets/archive/tile_city.png?raw=true)


![example workflow](https://github.com/rhin123/OpenCiv/actions/workflows/build.yml/badge.svg)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=RyanGrieb_OpenCiv&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=RyanGrieb_OpenCiv)
[![Discord](https://img.shields.io/discord/925176383792087081.svg?logo=discord&logoColor=white&logoWidth=20&labelColor=7289DA&label=Discord&color=17cf48)](https://discord.gg/WFteeen5fu)

![alt text](https://github.com/rhin123/OpenCiv/blob/master/meta/screenshots/new_ui_2.png?raw=true)

## About

OpenCiv is a love letter to turn-based strategy games inspired by Sid Meier's Civilization. The game mainly focuses on Civ 5 features and strives to improve on certain aspects that were lacking in the series.

The main objective of this project is to allow players who enjoy Civilization games to play it **directly on a web browser.**

## How do I build and run this?

1. Install either '[Docker](https://www.docker.com/)' or '[Node.js](https://nodejs.org/) with npm installed'.

2. Clone the repo at:
https://github.com/RyanGrieb/OpenCiv.git

    #### 3. Using docker
    Ensure Docker is installed, then run:
    `docker compose up -d`

    #### 4. Using your local machine
    Install dependencies and start the application:
    `npm run install-all`
    `npm start`

Once running, open your browser and go to http://localhost:1234 to play.

## How do I play this?

Currently, the project is being rewritten so no playable version is available without building the project.

## How do I run tests?
1. From the root directory of the repository, run
`npm run install-all`
2. Navigate to the server directory
`cd server`
3. Execute the test command
`npm run test`


## Keybinds

`ARROW KEYS` or `LEFT-CLICK DRAG` - Camera Movement

`SCROLL` - Zoom In/Out

`LEFT-CLICK` Unit `RIGHT-CLICK` Tile - Unit Movement

`SPACEBAR` - Skip turns

`ESC` - View settings

## Special thanks to the following:

Contributors -
[Will Pewitt](https://github.com/willpewitt)

Artists -
[lucasyoung988](https://www.fiverr.com/lucasyoung988?source=order_page_summary_seller_link)
[brysia](https://www.fiverr.com/brysia?source=order_page_summary_seller_link)
[pratamacam](https://www.fiverr.com/pratamacam?source=order_page_summary_seller_link)
[CharlesGabriel](https://opengameart.org/content/10-basic-message-boxes)
