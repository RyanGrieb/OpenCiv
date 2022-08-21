import { Engine } from '../Engine';
import { Vector } from './vector';
export declare class GlobalCoordinates {
    worldPos: Vector;
    pagePos: Vector;
    screenPos: Vector;
    static fromPagePosition(x: number, y: number, engine: Engine): GlobalCoordinates;
    static fromPagePosition(pos: Vector, engine: Engine): GlobalCoordinates;
    constructor(worldPos: Vector, pagePos: Vector, screenPos: Vector);
}
