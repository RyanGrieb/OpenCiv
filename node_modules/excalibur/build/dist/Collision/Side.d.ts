import { Vector } from '../Math/vector';
/**
 * An enum that describes the sides of an axis aligned box for collision
 */
export declare enum Side {
    None = "None",
    Top = "Top",
    Bottom = "Bottom",
    Left = "Left",
    Right = "Right"
}
export declare module Side {
    /**
     * Returns the opposite side from the current
     */
    function getOpposite(side: Side): Side;
    /**
     * Given a vector, return the Side most in that direction (via dot product)
     */
    function fromDirection(direction: Vector): Side;
}
