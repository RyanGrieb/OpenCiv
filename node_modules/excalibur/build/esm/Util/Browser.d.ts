export interface NativeEventable {
    addEventListener(name: string, handler: (...any: any[]) => any): any;
    removeEventListener(name: string, handler: (...any: any[]) => any): any;
}
export declare class BrowserComponent<T extends NativeEventable> {
    nativeComponent: T;
    private _paused;
    private _nativeHandlers;
    on(eventName: string, handler: (evt: any) => void): void;
    off(eventName: string, handler?: (event: any) => void): void;
    private _decorate;
    pause(): void;
    resume(): void;
    clear(): void;
    constructor(nativeComponent: T);
}
export declare class BrowserEvents {
    private _windowGlobal;
    private _documentGlobal;
    private _windowComponent;
    private _documentComponent;
    constructor(_windowGlobal: Window, _documentGlobal: Document);
    get window(): BrowserComponent<Window>;
    get document(): BrowserComponent<Document>;
    pause(): void;
    resume(): void;
    clear(): void;
}
