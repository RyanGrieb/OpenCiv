import { PostProcessor } from './PostProcessor';
import { ColorBlindnessMode } from './ColorBlindnessMode';
import { Shader } from '../Context/shader';
import { VertexLayout } from '../Context/vertex-layout';
export declare class ColorBlindnessPostProcessor implements PostProcessor {
    private _colorBlindnessMode;
    private _shader;
    private _simulate;
    constructor(_colorBlindnessMode: ColorBlindnessMode, simulate?: boolean);
    initialize(_gl: WebGLRenderingContext): void;
    getShader(): Shader;
    getLayout(): VertexLayout;
    set colorBlindnessMode(colorBlindMode: ColorBlindnessMode);
    get colorBlindnessMode(): ColorBlindnessMode;
    set simulate(value: boolean);
    get simulate(): boolean;
}
