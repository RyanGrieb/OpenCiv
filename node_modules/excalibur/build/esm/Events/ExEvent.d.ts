export declare abstract class ExEvent<TName extends string> {
    abstract readonly type: TName;
    private _active;
    get active(): boolean;
    cancel(): void;
}
