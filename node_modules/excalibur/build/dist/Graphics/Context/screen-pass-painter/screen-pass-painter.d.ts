import { PostProcessor } from '../../PostProcessor/PostProcessor';
/**
 * This is responsible for painting the entire screen during the render passes
 */
export declare class ScreenPassPainter {
    private _gl;
    private _shader;
    private _buffer;
    private _layout;
    constructor(gl: WebGLRenderingContext);
    renderWithPostProcessor(postprocessor: PostProcessor): void;
    renderToScreen(): void;
}
