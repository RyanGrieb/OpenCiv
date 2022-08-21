import { RenderSource } from './render-source';
export declare class RenderTarget {
    width: number;
    height: number;
    private _gl;
    constructor(options: {
        gl: WebGLRenderingContext;
        width: number;
        height: number;
    });
    setResolution(width: number, height: number): void;
    private _frameBuffer;
    get frameBuffer(): WebGLFramebuffer;
    private _frameTexture;
    get frameTexture(): WebGLTexture;
    private _setupFramebuffer;
    toRenderSource(): RenderSource;
    /**
     * When called, all drawing gets redirected to this render target
     */
    use(): void;
    /**
     * When called, all drawing is sent back to the canvas
     */
    disable(): void;
}
