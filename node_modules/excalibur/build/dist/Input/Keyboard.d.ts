import { Class } from '../Class';
import * as Events from '../Events';
/**
 * Enum representing physical input key codes
 */
export declare enum Keys {
    Num0 = "Numpad0",
    Num1 = "Numpad1",
    Num2 = "Numpad2",
    Num3 = "Numpad3",
    Num4 = "Numpad4",
    Num5 = "Numpad5",
    Num6 = "Numpad6",
    Num7 = "Numpad7",
    Num8 = "Numpad8",
    Num9 = "Numpad9",
    NumAdd = "NumpadAdd",
    NumSubtract = "NumpadSubtract",
    NumMultiply = "NumpadMultiply",
    NumDivide = "NumpadDivide",
    NumDecimal = "NumpadDecimal",
    Numpad0 = "Numpad0",
    Numpad1 = "Numpad1",
    Numpad2 = "Numpad2",
    Numpad3 = "Numpad3",
    Numpad4 = "Numpad4",
    Numpad5 = "Numpad5",
    Numpad6 = "Numpad6",
    Numpad7 = "Numpad7",
    Numpad8 = "Numpad8",
    Numpad9 = "Numpad9",
    NumpadAdd = "NumpadAdd",
    NumpadSubtract = "NumpadSubtract",
    NumpadMultiply = "NumpadMultiply",
    NumpadDivide = "NumpadDivide",
    NumpadDecimal = "NumpadDecimal",
    NumLock = "NumLock",
    ShiftLeft = "ShiftLeft",
    ShiftRight = "ShiftRight",
    AltLeft = "AltLeft",
    AltRight = "AltRight",
    ControlLeft = "ControlLeft",
    ControlRight = "ControlRight",
    MetaLeft = "MetaLeft",
    MetaRight = "MetaRight",
    Key0 = "Digit0",
    Key1 = "Digit1",
    Key2 = "Digit2",
    Key3 = "Digit3",
    Key4 = "Digit4",
    Key5 = "Digit5",
    Key6 = "Digit6",
    Key7 = "Digit7",
    Key8 = "Digit8",
    Key9 = "Digit9",
    Digit0 = "Digit0",
    Digit1 = "Digit1",
    Digit2 = "Digit2",
    Digit3 = "Digit3",
    Digit4 = "Digit4",
    Digit5 = "Digit5",
    Digit6 = "Digit6",
    Digit7 = "Digit7",
    Digit8 = "Digit8",
    Digit9 = "Digit9",
    F1 = "F1",
    F2 = "F2",
    F3 = "F3",
    F4 = "F4",
    F5 = "F5",
    F6 = "F6",
    F7 = "F7",
    F8 = "F8",
    F9 = "F9",
    F10 = "F10",
    F11 = "F11",
    F12 = "F12",
    A = "KeyA",
    B = "KeyB",
    C = "KeyC",
    D = "KeyD",
    E = "KeyE",
    F = "KeyF",
    G = "KeyG",
    H = "KeyH",
    I = "KeyI",
    J = "KeyJ",
    K = "KeyK",
    L = "KeyL",
    M = "KeyM",
    N = "KeyN",
    O = "KeyO",
    P = "KeyP",
    Q = "KeyQ",
    R = "KeyR",
    S = "KeyS",
    T = "KeyT",
    U = "KeyU",
    V = "KeyV",
    W = "KeyW",
    X = "KeyX",
    Y = "KeyY",
    Z = "KeyZ",
    KeyA = "KeyA",
    KeyB = "KeyB",
    KeyC = "KeyC",
    KeyD = "KeyD",
    KeyE = "KeyE",
    KeyF = "KeyF",
    KeyG = "KeyG",
    KeyH = "KeyH",
    KeyI = "KeyI",
    KeyJ = "KeyJ",
    KeyK = "KeyK",
    KeyL = "KeyL",
    KeyM = "KeyM",
    KeyN = "KeyN",
    KeyO = "KeyO",
    KeyP = "KeyP",
    KeyQ = "KeyQ",
    KeyR = "KeyR",
    KeyS = "KeyS",
    KeyT = "KeyT",
    KeyU = "KeyU",
    KeyV = "KeyV",
    KeyW = "KeyW",
    KeyX = "KeyX",
    KeyY = "KeyY",
    KeyZ = "KeyZ",
    Semicolon = "Semicolon",
    Quote = "Quote",
    Comma = "Comma",
    Minus = "Minus",
    Period = "Period",
    Slash = "Slash",
    Equal = "Equal",
    BracketLeft = "BracketLeft",
    Backslash = "Backslash",
    BracketRight = "BracketRight",
    Backquote = "Backquote",
    Up = "ArrowUp",
    Down = "ArrowDown",
    Left = "ArrowLeft",
    Right = "ArrowRight",
    ArrowUp = "ArrowUp",
    ArrowDown = "ArrowDown",
    ArrowLeft = "ArrowLeft",
    ArrowRight = "ArrowRight",
    Space = "Space",
    Backspace = "Backspace",
    Delete = "Delete",
    Esc = "Escape",
    Escape = "Escape",
    Enter = "Enter",
    NumpadEnter = "NumpadEnter",
    ContextMenu = "ContextMenu"
}
/**
 * Event thrown on a game object for a key event
 */
export declare class KeyEvent extends Events.GameEvent<any> {
    key: Keys;
    value?: string;
    originalEvent?: KeyboardEvent;
    /**
     * @param key  The key responsible for throwing the event
     * @param value The key's typed value the browser detected
     * @param originalEvent The original keyboard event that Excalibur handled
     */
    constructor(key: Keys, value?: string, originalEvent?: KeyboardEvent);
}
/**
 * Provides keyboard support for Excalibur.
 */
export declare class Keyboard extends Class {
    private _keys;
    private _keysUp;
    private _keysDown;
    constructor();
    on(eventName: Events.press, handler: (event: KeyEvent) => void): void;
    on(eventName: Events.release, handler: (event: KeyEvent) => void): void;
    on(eventName: Events.hold, handler: (event: KeyEvent) => void): void;
    on(eventName: string, handler: (event: Events.GameEvent<any>) => void): void;
    /**
     * Initialize Keyboard event listeners
     */
    init(global?: GlobalEventHandlers): void;
    private _handleKeyDown;
    private _handleKeyUp;
    update(): void;
    /**
     * Gets list of keys being pressed down
     */
    getKeys(): Keys[];
    /**
     * Tests if a certain key was just pressed this frame. This is cleared at the end of the update frame.
     * @param key Test whether a key was just pressed
     */
    wasPressed(key: Keys): boolean;
    /**
     * Tests if a certain key is held down. This is persisted between frames.
     * @param key  Test whether a key is held down
     */
    isHeld(key: Keys): boolean;
    /**
     * Tests if a certain key was just released this frame. This is cleared at the end of the update frame.
     * @param key  Test whether a key was just released
     */
    wasReleased(key: Keys): boolean;
    /**
     * Trigger a manual key event
     * @param type
     * @param key
     * @param character
     */
    triggerEvent(type: 'down' | 'up', key: Keys, character?: string): void;
}
