//
// Created by ryan on 8/17/22.
//

#ifndef OPENCIV_APPWINDOW_H
#define OPENCIV_APPWINDOW_H

#include <SDL.h>
#include "LTexture.h"

class AppWindow {
public:
    AppWindow(int width, int height);
    ~AppWindow() {}

    void beginWindowLoop();

    SDL_Renderer *gRenderer = NULL; //FIXME: Create getter for this

private:
    SDL_Window *gWindow = NULL;
    SDL_Rect gSpriteClips[4];
    LTexture gSpriteSheetTexture;
    bool running;
    bool fullscreen = false;
    int width;
    int height;
};
#endif //OPENCIV_APPWINDOW_H
