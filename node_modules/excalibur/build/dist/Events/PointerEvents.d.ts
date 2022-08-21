import { GlobalCoordinates } from '..';
import { WheelDeltaMode } from '../Input/WheelDeltaMode';
import { ExEvent } from './ExEvent';
export declare abstract class PointerEvent extends ExEvent<'down' | 'up' | 'move' | 'cancel'> {
    pointerId: number;
    coordinates: GlobalCoordinates;
    nativeEvent: Event;
    constructor(pointerId: number, coordinates: GlobalCoordinates, nativeEvent: Event);
}
export declare class PointerUp extends PointerEvent {
    readonly type = "up";
}
export declare class PointerDown extends PointerEvent {
    readonly type = "down";
}
export declare class PointerMove extends PointerEvent {
    readonly type = "move";
}
export declare class PointerCancel extends PointerEvent {
    readonly type = "cancel";
}
export declare class Wheel extends ExEvent<'wheel'> {
    x: number;
    y: number;
    pageX: number;
    pageY: number;
    screenX: number;
    screenY: number;
    index: number;
    deltaX: number;
    deltaY: number;
    deltaZ: number;
    deltaMode: WheelDeltaMode;
    ev: Event;
    readonly type = "wheel";
    constructor(x: number, y: number, pageX: number, pageY: number, screenX: number, screenY: number, index: number, deltaX: number, deltaY: number, deltaZ: number, deltaMode: WheelDeltaMode, ev: Event);
}
