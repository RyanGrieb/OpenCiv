import { Class } from './../Class';
import { GameEvent, GamepadConnectEvent, GamepadDisconnectEvent, GamepadButtonEvent, GamepadAxisEvent } from '../Events';
import * as Events from '../Events';
/**
 * Excalibur leverages the HTML5 Gamepad API [where it is supported](http://caniuse.com/#feat=gamepad)
 * to provide controller support for your games.
 */
export declare class Gamepads extends Class {
    /**
     * Whether or not to poll for Gamepad input (default: `false`)
     */
    enabled: boolean;
    /**
     * Whether or not Gamepad API is supported
     */
    supported: boolean;
    /**
     * The minimum value an axis has to move before considering it a change
     */
    static MinAxisMoveThreshold: number;
    private _gamePadTimeStamps;
    private _oldPads;
    private _pads;
    private _initSuccess;
    private _navigator;
    private _minimumConfiguration;
    constructor();
    init(): void;
    /**
     * Sets the minimum gamepad configuration, for example {axis: 4, buttons: 4} means
     * this game requires at minimum 4 axis inputs and 4 buttons, this is not restrictive
     * all other controllers with more axis or buttons are valid as well. If no minimum
     * configuration is set all pads are valid.
     */
    setMinimumGamepadConfiguration(config: GamepadConfiguration): void;
    /**
     * When implicitly enabled, set the enabled flag and run an update so information is updated
     */
    private _enableAndUpdate;
    /**
     * Checks a navigator gamepad against the minimum configuration if present.
     */
    private _isGamepadValid;
    on(eventName: Events.connect, handler: (event: GamepadConnectEvent) => void): void;
    on(eventName: Events.disconnect, handler: (event: GamepadDisconnectEvent) => void): void;
    on(eventName: Events.button, handler: (event: GamepadButtonEvent) => void): void;
    on(eventName: Events.axis, handler: (event: GamepadAxisEvent) => void): void;
    on(eventName: string, handler: (event: GameEvent<any>) => void): void;
    off(eventName: string, handler?: (event: GameEvent<any>) => void): void;
    /**
     * Updates Gamepad state and publishes Gamepad events
     */
    update(): void;
    /**
     * Safely retrieves a Gamepad at a specific index and creates one if it doesn't yet exist
     */
    at(index: number): Gamepad;
    /**
     * Returns a list of all valid gamepads that meet the minimum configuration requirement.
     */
    getValidGamepads(): Gamepad[];
    /**
     * Gets the number of connected gamepads
     */
    count(): number;
    private _clonePads;
    /**
     * Fastest way to clone a known object is to do it yourself
     */
    private _clonePad;
}
/**
 * Gamepad holds state information for a connected controller. See [[Gamepads]]
 * for more information on handling controller input.
 */
export declare class Gamepad extends Class {
    connected: boolean;
    navigatorGamepad: NavigatorGamepad;
    private _buttons;
    private _axes;
    constructor();
    /**
     * Whether or not the given button is pressed
     * @param button     The button to query
     * @param threshold  The threshold over which the button is considered to be pressed
     */
    isButtonPressed(button: Buttons, threshold?: number): boolean;
    /**
     * Gets the given button value between 0 and 1
     */
    getButton(button: Buttons): number;
    /**
     * Gets the given axis value between -1 and 1. Values below
     * [[MinAxisMoveThreshold]] are considered 0.
     */
    getAxes(axes: Axes): number;
    updateButton(buttonIndex: number, value: number): void;
    updateAxes(axesIndex: number, value: number): void;
}
/**
 * Gamepad Buttons enumeration
 */
export declare enum Buttons {
    /**
     * Face 1 button (e.g. A)
     */
    Face1 = 0,
    /**
     * Face 2 button (e.g. B)
     */
    Face2 = 1,
    /**
     * Face 3 button (e.g. X)
     */
    Face3 = 2,
    /**
     * Face 4 button (e.g. Y)
     */
    Face4 = 3,
    /**
     * Left bumper button
     */
    LeftBumper = 4,
    /**
     * Right bumper button
     */
    RightBumper = 5,
    /**
     * Left trigger button
     */
    LeftTrigger = 6,
    /**
     * Right trigger button
     */
    RightTrigger = 7,
    /**
     * Select button
     */
    Select = 8,
    /**
     * Start button
     */
    Start = 9,
    /**
     * Left analog stick press (e.g. L3)
     */
    LeftStick = 10,
    /**
     * Right analog stick press (e.g. R3)
     */
    RightStick = 11,
    /**
     * D-pad up
     */
    DpadUp = 12,
    /**
     * D-pad down
     */
    DpadDown = 13,
    /**
     * D-pad left
     */
    DpadLeft = 14,
    /**
     * D-pad right
     */
    DpadRight = 15
}
/**
 * Gamepad Axes enumeration
 */
export declare enum Axes {
    /**
     * Left analogue stick X direction
     */
    LeftStickX = 0,
    /**
     * Left analogue stick Y direction
     */
    LeftStickY = 1,
    /**
     * Right analogue stick X direction
     */
    RightStickX = 2,
    /**
     * Right analogue stick Y direction
     */
    RightStickY = 3
}
/**
 * @internal
 */
export interface NavigatorGamepads {
    getGamepads(): NavigatorGamepad[];
}
/**
 * @internal
 */
export interface NavigatorGamepad {
    axes: number[];
    buttons: NavigatorGamepadButton[];
    connected: boolean;
    id: string;
    index: number;
    mapping: string;
    timestamp: number;
}
/**
 * @internal
 */
export interface NavigatorGamepadButton {
    pressed: boolean;
    value: number;
}
/**
 * @internal
 */
export interface NavigatorGamepadEvent {
    gamepad: NavigatorGamepad;
}
/**
 * @internal
 */
export interface GamepadConfiguration {
    axis: number;
    buttons: number;
}
