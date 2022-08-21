export interface VertexBufferOptions {
    /**
     * Size in number of floats, so [4.2, 4.0, 2.1] is size = 3
     *
     * Ignored if data is passed directly
     */
    size?: number;
    /**
     * If the vertices never change switching 'static' can be more efficient on the gpu
     *
     * Default is 'dynamic'
     */
    type?: 'static' | 'dynamic';
    /**
     * Optionally pass pre-seeded data, size parameter is ignored
     */
    data?: Float32Array;
}
/**
 * Helper around vertex buffer to simplify creating and uploading geometry
 *
 * Under the hood uses Float32Array
 */
export declare class VertexBuffer {
    private _gl;
    /**
     * Access to the webgl buffer handle
     */
    readonly buffer: WebGLBuffer;
    /**
     * Access to the raw data of the vertex buffer
     */
    readonly bufferData: Float32Array;
    /**
     * If the vertices never change switching 'static' can be more efficient on the gpu
     *
     * Default is 'dynamic'
     */
    type: 'static' | 'dynamic';
    constructor(options: VertexBufferOptions);
    /**
     * Bind this vertex buffer
     */
    bind(): void;
    /**
     * Upload vertex buffer geometry to the GPU
     */
    upload(count?: number): void;
}
