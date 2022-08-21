import { ExcaliburGraphicsContextState } from './ExcaliburGraphicsContext';
export declare class StateStack {
    private _states;
    private _currentState;
    private _getDefaultState;
    private _cloneState;
    save(): void;
    restore(): void;
    get current(): ExcaliburGraphicsContextState;
    set current(val: ExcaliburGraphicsContextState);
}
