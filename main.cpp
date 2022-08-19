/*This source code copyrighted by Lazy Foo' Productions (2004-2022)
and may not be redistributed without written permission.*/

//Using SDL, SDL_image, standard math, and strings
#include <SDL.h>
#include <SDL_image.h>
#include <stdio.h>
#include <string>
#include "AppWindow.h"

//Screen dimension constants
const int SCREEN_WIDTH = 640;
const int SCREEN_HEIGHT = 480;


int main(int argc, char *args[]) {
    auto appWindow = AppWindow(SCREEN_WIDTH, SCREEN_HEIGHT);
    appWindow.beginWindowLoop();
    return 0;
}