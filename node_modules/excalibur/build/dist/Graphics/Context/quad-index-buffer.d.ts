/**
 * Helper that defines and index buffer for quad geometry
 *
 * Index buffers allow you to save space in vertex buffers when you share vertices in geometry
 * it is almost always worth it in terms of performance to use an index buffer.
 */
export declare class QuadIndexBuffer {
    private _gl;
    private _logger;
    /**
     * Access to the webgl buffer handle
     */
    buffer: WebGLBuffer;
    /**
     * Access to the raw data of the index buffer
     */
    bufferData: Uint16Array | Uint32Array;
    /**
     * Depending on the browser this is either gl.UNSIGNED_SHORT or gl.UNSIGNED_INT
     */
    bufferGlType: number;
    /**
     * @param numberOfQuads Specify the max number of quads you want to draw
     * @param useUint16 Optionally force a uint16 buffer
     */
    constructor(numberOfQuads: number, useUint16?: boolean);
    get size(): number;
    /**
     * Upload data to the GPU
     */
    upload(): void;
    /**
     * Bind this index buffer
     */
    bind(): void;
}
