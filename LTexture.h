//
// Created by ryan on 8/17/22.
//

#ifndef OPENCIV_LTEXTURE_H
#define OPENCIV_LTEXTURE_H

#include <SDL_image.h>
#include <string>

//Texture wrapper class
class LTexture {
public:
    LTexture() {}

    LTexture(SDL_Renderer *gRenderer);

    ~LTexture();

    bool loadFromFile(std::string path);

    void free();

    void render(int x, int y, SDL_Rect *clip = NULL);

    int getWidth();

    int getHeight();

    SDL_Renderer *gRenderer;
private:
    SDL_Texture *mTexture;

    int mWidth;
    int mHeight;
};

#endif //OPENCIV_LTEXTURE_H
