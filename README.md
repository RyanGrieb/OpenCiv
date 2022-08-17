# OpenWargame - An open source [wargame](https://en.wikipedia.org/wiki/Wargame) simulator 

A program where the user can simulate local and global battle scenarios.
An emphasis on customization is given. Where mods can enable the user to
come up with anything they can imagine. From actual military wargames to
videogames like Hearts of Iron 4.

### Development Setup Instructions:
<sub><sup>Please post an issue if you run into problems. I want these instructions to be as clear as possible.</sup></sub>

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
