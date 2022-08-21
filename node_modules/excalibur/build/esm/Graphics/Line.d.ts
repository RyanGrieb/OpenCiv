import { Color } from '../Color';
import { Vector } from '../Math/vector';
import { ExcaliburGraphicsContext } from './Context/ExcaliburGraphicsContext';
import { Graphic } from './Graphic';
export interface LineOptions {
    start: Vector;
    end: Vector;
    color?: Color;
    thickness?: number;
}
export declare class Line extends Graphic {
    readonly start: Vector;
    readonly end: Vector;
    color: Color;
    thickness: number;
    constructor(options: LineOptions);
    protected _drawImage(ctx: ExcaliburGraphicsContext, _x: number, _y: number): void;
    clone(): Line;
}
