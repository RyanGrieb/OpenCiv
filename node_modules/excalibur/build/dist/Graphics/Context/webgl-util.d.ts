/**
 * Return the size of the GlType in bytes
 * @param gl
 * @param type
 */
export declare function getGlTypeSizeBytes(gl: WebGLRenderingContext, type: number): number;
/**
 * Based on the type return the number of attribute components
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
 * @param gl
 * @param type
 */
export declare function getAttributeComponentSize(gl: WebGLRenderingContext, type: number): number;
/**
 * Based on the attribute return the corresponding supported attrib pointer type
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
 *
 * @param gl
 * @param type
 */
export declare function getAttributePointerType(gl: WebGLRenderingContext, type: number): number;
