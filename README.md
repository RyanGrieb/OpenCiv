# OpenCiv ![tile_city](https://github.com/rhin123/OpenCiv/blob/master/assets/tile_city.png?raw=true)

![example workflow](https://github.com/rhin123/OpenCiv/actions/workflows/build.yml/badge.svg)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=rhin123_OpenCiv&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=rhin123_OpenCiv)
[![Discord](https://img.shields.io/discord/925176383792087081.svg?logo=discord&logoColor=white&logoWidth=20&labelColor=7289DA&label=Discord&color=17cf48)](https://discord.gg/WFteeen5fu)

A turn based strategy game built on [LibGDX](https://github.com/libgdx/libgdx), with a rouge-like tile set.

## About
OpenCiv is a love letter to turn based strategy games inspired by Sid Meier's Civilization. The game strives to improve on certain aspects that were lacking in the series, and experiment with new features. 
If you like game development, Java, or pixel art, consider contributing. We can make something great. 

Eventually, I'd like to add support modding through [LUAJ](https://www.gamedevelopment.blog/using-luaj-scripting-to-allow-modding-in-games/).

## Screenshot
![alt text](https://github.com/rhin123/OpenCiv/blob/master/meta/screenshots/new_ui_2.png?raw=true)

## How do I build and run this?
* Install [Java 11](https://www.oracle.com/java/technologies/javase/jdk11-archive-downloads.html) or higher. NOTE: OpenJDK has problems (at least for me on linux)
* Install [GIT](https://git-scm.com/downloads)
* Run -> ```git clone https://github.com/rhin123/OpenCiv.git```
* Open Eclipse or any other java editor, and ```import grade project``` (Eclipse is recommended, haven't tested on other IDEs)
* To import the project properly, make sure you select the ```OpenCiv``` folder, and not the subfolders.
* To get the game running you would run the OpenCiv-lwjgl3 ```Lwjgl3Launcher.java``` class & the OpenCiv-server ```Server.jar``` To start the Client & Server

Right click -> Run as -> Java Application

![run_client](https://user-images.githubusercontent.com/6068039/148315501-4f7f38c5-6f48-4289-820a-63b976298e92.png)

Right click -> Run as -> Java Application

![run_server](https://user-images.githubusercontent.com/6068039/148315505-e3511fbf-d4e5-47d4-bebe-810369c017d0.png)

* Click multiplayer & connect, then start the game.

If you have any issues when trying to set up a build environment, please comment [Here](https://github.com/rhin123/OpenCiv/issues/65).
I'm trying new ways make the set-up of this development environment easier. 

Currently, there is no releases available as the game is still in heavy development. Once AI is re-written & singleplayer mode is implemented, a release will be available.

## Keybinds
``WASD`` or ``ARROW KEYS`` or ``LEFT-CLICK DRAG`` - Camera Movement

``SCROLL`` - Zoom In/Out

``LEFT-CLICK`` Unit ``RIGHT-CLICK`` Tile - Unit Movement (In 2 tile radius)

```SPACEBAR``` - Skip turns

## Special thanks to the following:

Contributors - 
[Will Pewitt](https://github.com/willpewitt)

Artists - 
[lucasyoung988](https://www.fiverr.com/lucasyoung988?source=order_page_summary_seller_link)
[brysia](https://www.fiverr.com/brysia?source=order_page_summary_seller_link)
[pratamacam](https://www.fiverr.com/pratamacam?source=order_page_summary_seller_link)
[CharlesGabriel](https://opengameart.org/content/10-basic-message-boxes)
