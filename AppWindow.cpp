//
// Created by ryan on 8/17/22.
//

#include "AppWindow.h"
#include <iostream>
#include <SDL_image.h>
#include "LTexture.h"

AppWindow::AppWindow(int width, int height) {

    this->width = width;
    this->height = height;

    //Initialize SDL
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        printf("SDL could not initialize! SDL Error: %s\n", SDL_GetError());
        exit(1);
    }

    //Set texture filtering to linear
    if (!SDL_SetHint(SDL_HINT_RENDER_SCALE_QUALITY, "1")) {
        printf("Warning: Linear texture filtering not enabled!");
    }

    //Create window
    gWindow = SDL_CreateWindow("SDL Tutorial", SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED, width,
                               height, SDL_WINDOW_SHOWN);
    if (gWindow == NULL) {
        printf("Window could not be created! SDL Error: %s\n", SDL_GetError());
        exit(1);
    }
    //Create renderer for window
    gRenderer = SDL_CreateRenderer(gWindow, -1, SDL_RENDERER_ACCELERATED);
    if (gRenderer == NULL) {
        printf("Renderer could not be created! SDL Error: %s\n", SDL_GetError());
        exit(1);
    }

    //Initialize renderer color
    SDL_SetRenderDrawColor(gRenderer, 0xFF, 0xFF, 0xFF, 0xFF);

    //Initialize PNG loading
    int imgFlags = IMG_INIT_PNG;
    if (!(IMG_Init(imgFlags) & imgFlags)) {
        printf("SDL_image could not initialize! SDL_image Error: %s\n", IMG_GetError());
        exit(1);
    }

    gSpriteSheetTexture = LTexture(gRenderer);
    bool loaded = gSpriteSheetTexture.loadFromFile("./assets/dots.png");
    if (!loaded) {
        std::cout << "Failed to load image" << std::endl;
        exit(1);
    }

    //Set top left sprite
    gSpriteClips[0].x = 0;
    gSpriteClips[0].y = 0;
    gSpriteClips[0].w = 100;
    gSpriteClips[0].h = 100;

    //Set top right sprite
    gSpriteClips[1].x = 100;
    gSpriteClips[1].y = 0;
    gSpriteClips[1].w = 100;
    gSpriteClips[1].h = 100;

    //Set bottom left sprite
    gSpriteClips[2].x = 0;
    gSpriteClips[2].y = 100;
    gSpriteClips[2].w = 100;
    gSpriteClips[2].h = 100;

    //Set bottom right sprite
    gSpriteClips[3].x = 100;
    gSpriteClips[3].y = 100;
    gSpriteClips[3].w = 100;
    gSpriteClips[3].h = 100;

    running = true;
}

void AppWindow::beginWindowLoop() {
    float x_test = 0;
    while (running) {
        SDL_Event event;
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_KEYDOWN) {
                switch (event.key.keysym.sym) {
                    case SDLK_ESCAPE:
                        running = false;
                        break;
                    case 'f':
                        if (!fullscreen) {
                            SDL_SetWindowFullscreen(gWindow, SDL_WINDOW_OPENGL | SDL_WINDOW_FULLSCREEN_DESKTOP);
                        } else {
                            SDL_SetWindowFullscreen(gWindow, SDL_WINDOW_OPENGL);
                        }
                        fullscreen = !fullscreen;
                        break;

                    case 'a':
                        // vertices[0] += 0.1;
                        // glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
                        break;
                    default:
                        break;
                }
            } else if (event.type == SDL_QUIT) {
                running = false;
            }
        }
        //update_window_size();

        //Clear screen
        SDL_SetRenderDrawColor(gRenderer, 0xFF, 0xFF, 0xFF, 0xFF);
        SDL_RenderClear(gRenderer);

        //Render top left sprite
        gSpriteSheetTexture.render(x_test, 0, &gSpriteClips[0]);
        x_test += 0.05;

        //Render top right sprite
        gSpriteSheetTexture.render(width - gSpriteClips[1].w, 0, &gSpriteClips[1]);

        //Render bottom left sprite
        gSpriteSheetTexture.render(0, height - gSpriteClips[2].h, &gSpriteClips[2]);

        //Render bottom right sprite
        gSpriteSheetTexture.render(width - gSpriteClips[3].w, height - gSpriteClips[3].h,
                                   &gSpriteClips[3]);

        //Update screen
        SDL_RenderPresent(gRenderer);
    }
}


