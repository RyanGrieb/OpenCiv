import { Shader } from './shader';
import { VertexBuffer } from './vertex-buffer';
export interface VertexLayoutOptions {
    /**
     * Shader that this layout will be for
     */
    shader: Shader;
    /**
     * Vertex buffer to use for vertex data
     */
    vertexBuffer: VertexBuffer;
    /**
     * Specify the attributes that will exist in the vertex buffer
     *
     * **Important** must specify them in the order that they will be in the vertex buffer!!
     */
    attributes: [name: string, numberOfComponents: number][];
}
/**
 * Helper around creating vertex attributes in a given [[VertexBuffer]], this is useful for describing
 * the memory layout for your vertices inside a particular buffer
 *
 * Note: This helper assumes interleaved attributes in one [[VertexBuffer]], not many.
 *
 * Working with `gl.vertexAttribPointer` can be tricky, and this attempts to double check you
 */
export declare class VertexLayout {
    private _gl;
    private _logger;
    private _shader;
    private _layout;
    private _attributes;
    private _vertexBuffer;
    get vertexBuffer(): VertexBuffer;
    get attributes(): readonly [name: string, numberOfComponents: number][];
    constructor(options: VertexLayoutOptions);
    private _vertexTotalSizeBytes;
    /**
     * Total number of bytes that the vertex will take up
     */
    get totalVertexSizeBytes(): number;
    /**
     * Layouts need shader locations and must be bound to a shader
     */
    initialize(): void;
    /**
     * Bind this layout with it's associated vertex buffer
     *
     * @param uploadBuffer Optionally indicate you wish to upload the buffer to the GPU associated with this layout
     */
    use(uploadBuffer?: boolean, count?: number): void;
}
