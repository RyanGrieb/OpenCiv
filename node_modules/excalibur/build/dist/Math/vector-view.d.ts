import { Vector } from './vector';
export interface VectorViewOptions {
    getX: () => number;
    getY: () => number;
    setX: (x: number) => void;
    setY: (y: number) => void;
}
export declare class VectorView extends Vector {
    private _getX;
    private _getY;
    private _setX;
    private _setY;
    constructor(options: VectorViewOptions);
    get x(): number;
    set x(val: number);
    get y(): number;
    set y(val: number);
}
