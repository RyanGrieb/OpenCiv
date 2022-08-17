# OpenCiv

![example workflow](https://github.com/rhin123/OpenCiv/actions/workflows/build.yml/badge.svg)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=rhin123_OpenCiv&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=rhin123_OpenCiv)
[![Discord](https://img.shields.io/discord/925176383792087081.svg?logo=discord&logoColor=white&logoWidth=20&labelColor=7289DA&label=Discord&color=17cf48)](https://discord.gg/WFteeen5fu)

A turn based strategy game built on [SDL2](https://www.libsdl.org/), with a rouge-like tile set.

### Development Setup Instructions:
<sup>Please post an issue if you run into problems. I want these instructions to be as clear as possible.</sup>

### Windows:
* Install [git](https://git-scm.com/downloads)
* [Ensure the ability to compile c++](https://code.visualstudio.com/docs/cpp/config-mingw) is on the machine
* Open git & run ```git clone https://github.com/RyanGrieb/OpenWargame.git```
* Installation of sdl2 isn't needed. It's included in the [libraries](https://github.com/RyanGrieb/OpenWargame/tree/master/libraries) directory specifically for windows
* Ensure .dll files are inside the same directory as OpenWargame.exe
* Import the project to your respective IDE

### Linux:
* Ensure the following is installed: git, g++, libsdl2-dev, libsdl2-image-dev, libsdl-image1.2-dev, cmake
* For ubuntu based distributions: ```sudo apt install git cmake libsdl2-dev libsdl2-image-dev libsdl-image1.2-dev g++```
* Run ```git clone https://github.com/RyanGrieb/OpenWargame.git```
* Import the project to your respective IDE
