import { Vector } from '../..';
import { Matrix } from '../../Math/matrix';
export declare type UniformTypeNames = 'uniform1f' | 'uniform1i' | 'uniform2f' | 'uniform2i' | 'uniform3f' | 'uniform3i' | 'uniform4f' | 'uniform4i' | 'uniform1fv' | 'uniform1iv' | 'uniform2fv' | 'uniform2iv' | 'uniform3fv' | 'uniform3iv' | 'uniform4fv' | 'uniform4iv' | 'uniformMatrix2fv' | 'uniformMatrix3fv' | 'uniformMatrix4fv';
declare type RemoveFirstFromTuple<T extends any[]> = T['length'] extends 0 ? undefined : (((...b: T) => void) extends (a: any, ...b: infer I) => void ? I : []);
declare type UniformParameters<TUniformType extends UniformTypeNames> = RemoveFirstFromTuple<Parameters<WebGLRenderingContext[TUniformType]>>;
export interface UniformDefinition {
    name: string;
    glType: number;
    location: WebGLUniformLocation;
}
export interface VertexAttributeDefinition {
    /**
     * string name of the attribute in the shader program, commonly `a_nameofmyvariable`
     */
    name: string;
    /**
     * Number of components for a given attribute
     * Must be 1, 2, 3, or 4
     *
     * For example a vec4 attribute would be `4` floats, so 4
     */
    size: number;
    /**
     * Supported types in webgl 1
     * * gl.BYTE
     * * gl.SHORT
     * * gl.UNSIGNED_BYTE
     * * gl.UNSIGNED_SHORT
     * * gl.FLOAT
     * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
     */
    glType: number;
    /**
     * Is the attribute normalized between (0-1)
     */
    normalized: boolean;
    /**
     * Location index in the shader program
     */
    location: number;
}
export interface ShaderOptions {
    vertexSource: string;
    fragmentSource: string;
}
export declare class Shader {
    private static _ACTIVE_SHADER_INSTANCE;
    private _gl;
    program: WebGLProgram;
    uniforms: {
        [variableName: string]: UniformDefinition;
    };
    attributes: {
        [variableName: string]: VertexAttributeDefinition;
    };
    private _compiled;
    readonly vertexSource: string;
    readonly fragmentSource: string;
    get compiled(): boolean;
    /**
     * Create a shader program in excalibur
     * @param options specify shader vertex and fragment source
     */
    constructor(options?: ShaderOptions);
    /**
     * Binds the shader program
     */
    use(): void;
    isCurrentlyBound(): boolean;
    /**
     * Compile the current shader against a webgl context
     */
    compile(): WebGLProgram;
    getUniforms(): UniformDefinition[];
    getAttributes(): VertexAttributeDefinition[];
    /**
     * Set a texture in a gpu texture slot
     * @param slotNumber
     * @param texture
     */
    setTexture(slotNumber: number, texture: WebGLTexture): void;
    /**
     * Set an integer uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformInt(name: string, value: number): void;
    /**
     * Set an integer array uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformIntArray(name: string, value: number[]): void;
    /**
     * Set a boolean uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformBoolean(name: string, value: boolean): void;
    /**
     * Set a float uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformFloat(name: string, value: number): void;
    /**
     * Set a float array uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformFloatArray(name: string, value: number[]): void;
    /**
     * Set a [[Vector]] uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformFloatVector(name: string, value: Vector): void;
    /**
     * Set an [[Matrix]] uniform for the current shader
     *
     * **Important** Must call ex.Shader.use() before setting a uniform!
     *
     * @param name
     * @param value
     */
    setUniformMatrix(name: string, value: Matrix): void;
    /**
     * Set any available uniform type in webgl
     *
     * For example setUniform('uniformMatrix2fv', 'u_my2x2_mat`, ...);
     */
    setUniform<TUniformType extends UniformTypeNames>(uniformType: TUniformType, name: string, ...value: UniformParameters<TUniformType>): void;
    private _createProgram;
    private _compileShader;
    private _processSourceForError;
}
export {};
