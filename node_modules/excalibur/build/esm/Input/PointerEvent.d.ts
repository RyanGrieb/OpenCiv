import { GlobalCoordinates } from '../Math/global-coordinates';
import { Vector } from '../Math/vector';
import { PointerButton } from './PointerButton';
import { PointerType } from './PointerType';
export declare class PointerEvent {
    type: 'down' | 'up' | 'move' | 'cancel';
    pointerId: number;
    button: PointerButton;
    pointerType: PointerType;
    coordinates: GlobalCoordinates;
    nativeEvent: Event;
    active: boolean;
    cancel(): void;
    get pagePos(): Vector;
    get screenPos(): Vector;
    get worldPos(): Vector;
    constructor(type: 'down' | 'up' | 'move' | 'cancel', pointerId: number, button: PointerButton, pointerType: PointerType, coordinates: GlobalCoordinates, nativeEvent: Event);
}
