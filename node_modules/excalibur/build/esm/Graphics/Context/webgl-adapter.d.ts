/**
 * Must be accessed after Engine construction time to ensure the context has been created
 */
export declare class ExcaliburWebGLContextAccessor {
    private static _GL;
    static clear(): void;
    static register(gl: WebGL2RenderingContext): void;
    static get gl(): WebGL2RenderingContext;
}
