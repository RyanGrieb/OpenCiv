import { Shader } from '../Context/shader';
import { VertexLayout } from '../Context/vertex-layout';
/**
 * Helper that defines a whole screen renderer, just provide a fragment source!
 *
 * Currently supports 1 varying
 * - vec2 a_texcoord between 0-1 which corresponds to screen position
 */
export declare class ScreenShader {
    private _shader;
    private _buffer;
    private _layout;
    constructor(fragmentSource: string);
    getShader(): Shader;
    getLayout(): VertexLayout;
}
