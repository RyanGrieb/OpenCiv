import { Color } from '../Color';
import { Vector } from '../Math/vector';
/**
 * A canvas linecap style. "butt" is the default flush style, "round" is a semi-circle cap with a radius half the width of
 * the line, and "square" is a rectangle that is an equal width and half height cap.
 */
export declare type LineCapStyle = 'butt' | 'round' | 'square';
/**
 * Draw a line on canvas context
 *
 * @param ctx The canvas context
 * @param color The color of the line
 * @param x1 The start x coordinate
 * @param y1 The start y coordinate
 * @param x2 The ending x coordinate
 * @param y2 The ending y coordinate
 * @param thickness The line thickness
 * @param cap The [[LineCapStyle]] (butt, round, or square)
 */
export declare function line(ctx: CanvasRenderingContext2D, color: Color, x1: number, y1: number, x2: number, y2: number, thickness?: number, cap?: LineCapStyle): void;
/**
 * Draw the vector as a point onto the canvas.
 */
export declare function point(ctx: CanvasRenderingContext2D, color: Color, point: Vector): void;
/**
 * Draw the vector as a line onto the canvas starting a origin point.
 */
/**
 *
 */
export declare function vector(ctx: CanvasRenderingContext2D, color: Color, origin: Vector, vector: Vector, scale?: number): void;
/**
 * Represents border radius values
 */
export interface BorderRadius {
    /**
     * Top-left
     */
    tl: number;
    /**
     * Top-right
     */
    tr: number;
    /**
     * Bottom-right
     */
    br: number;
    /**
     * Bottom-left
     */
    bl: number;
}
/**
 * Draw a round rectangle on a canvas context
 *
 * @param ctx The canvas context
 * @param x The top-left x coordinate
 * @param y The top-left y coordinate
 * @param width The width of the rectangle
 * @param height The height of the rectangle
 * @param radius The border radius of the rectangle
 * @param stroke The [[Color]] to stroke rectangle with
 * @param fill The [[Color]] to fill rectangle with
 */
export declare function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius?: number | BorderRadius, stroke?: Color, fill?: Color): void;
/**
 *
 */
export declare function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, stroke?: Color, fill?: Color): void;
