/**
 * The Toaster is only meant to be called from inside Excalibur to display messages to players
 */
export declare class Toaster {
    private _styleBlock;
    private _container;
    private _toasterCss;
    private _isInitialized;
    private _initialize;
    dispose(): void;
    private _createFragment;
    /**
     * Display a toast message to a player
     * @param message Text of the message, messages may have a single "[LINK]" to influence placement
     * @param linkTarget Optionally specify a link location
     * @param linkName Optionally specify a name for that link location
     */
    toast(message: string, linkTarget?: string, linkName?: string): void;
}
