#include <iostream>
#include <string>
#include <filesystem>
#include <SDL.h>
#include <tuple>
#include <SDL_image.h>
#include <SDL_opengl.h>

const int SCREEN_WIDTH = 640;
const int SCREEN_HEIGHT = 480;

//TODO: Replace nullptr w/ nullptrptr

std::tuple<SDL_Window *, SDL_Surface *> create_window() {

    SDL_Window *gWindow = nullptr; //The window we'll be rendering to
    SDL_Surface *gScreenSurface = nullptr; //The surface contained by the window

    //Initialize SDL
    //FIXME: Valgrind doesn't like SDL_Init & says there is an invalid read here?
    // NOTE: Only complains when we enable PNG_Loading?
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        printf("SDL could not initialize! SDL_Error: %s\n", SDL_GetError());
        //throw std::runtime_error(strcat("SDL could not initialize - ", SDL_GetError()));
        return std::make_tuple(gWindow, gScreenSurface);
    }

    //Create window
    gWindow = SDL_CreateWindow("OpenCiv", SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED, SCREEN_WIDTH,
                               SCREEN_HEIGHT, SDL_WINDOW_SHOWN);
    if (gWindow == nullptr) {
        printf("Window could not be created! SDL_Error: %s\n", SDL_GetError());
        return std::make_tuple(gWindow, gScreenSurface);
    }

    //Initialize PNG Loading...
    int imgFlags = IMG_INIT_PNG;
    if (!(IMG_Init(imgFlags) && imgFlags)) { //Note: Single & evaluates both sides. && stops if the first side is false.
        printf("SDL_image could not initialize! SDL_image Error: %s\n", IMG_GetError());
    }

    //Get window surface
    gScreenSurface = SDL_GetWindowSurface(gWindow);

    return std::make_tuple(gWindow, gScreenSurface);
}

SDL_Surface *loadSDLSurface(std::string path) {

    //The image we will load and show on the screen
    SDL_Surface *sdlSurface = nullptr;

    //Load splash image
    sdlSurface = IMG_Load(path.c_str());

    if (sdlSurface == nullptr) {
        printf("Unable to load image %s! SDL Error: %s\n", path.c_str(),
               IMG_GetError());
    }

    return sdlSurface;
}

void close(SDL_Window *window, SDL_Surface *surface) {
    //Deallocate surface
    SDL_FreeSurface(surface);
    surface = nullptr;

    //Destroy window
    SDL_DestroyWindow(window);
    window = nullptr;

    //Quit SDL subsystems
    SDL_Quit();
    IMG_Quit();
}

int main(int argc, char **args) {
    std::cout << "Starting OpenWargame..." << std::endl;
    auto windowTuple = create_window();
    auto window = std::get<0>(windowTuple);
    auto screenSurface = std::get<1>(windowTuple);

    if (window == nullptr) {
        std::cout << "Failed to initialize window" << std::endl;
        return 1;
    }

    auto sdlSurface = loadSDLSurface("..//assets//test2.png");
    if (sdlSurface == nullptr) {
        std::cout << "Failed to load media" << std::endl;
        return 1;
    }

    bool quit = false;
    SDL_Event sdlEvent;

    while (!quit) {
        //Handle events on queue (input, ect.)
        while (SDL_PollEvent(&sdlEvent) != 0) {
            if (sdlEvent.type == SDL_QUIT) {
                quit = true;
            }
        }


        //Apply the image
        SDL_BlitSurface(sdlSurface, nullptr, screenSurface, nullptr);
        SDL_UpdateWindowSurface(window);
    }

    close(window, screenSurface);
    SDL_FreeSurface(sdlSurface);
    //TODO: Determine better way to free our memory gracefully.

    return 0;
}