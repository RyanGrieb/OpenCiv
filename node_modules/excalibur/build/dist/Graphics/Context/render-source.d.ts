export declare class RenderSource {
    private _gl;
    private _texture;
    constructor(_gl: WebGLRenderingContext, _texture: WebGLTexture);
    use(): void;
    disable(): void;
}
