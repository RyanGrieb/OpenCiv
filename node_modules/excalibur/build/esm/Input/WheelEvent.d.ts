import { WheelDeltaMode } from './WheelDeltaMode';
export declare class WheelEvent {
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
    active: boolean;
    cancel(): void;
    constructor(x: number, y: number, pageX: number, pageY: number, screenX: number, screenY: number, index: number, deltaX: number, deltaY: number, deltaZ: number, deltaMode: WheelDeltaMode, ev: Event);
}
