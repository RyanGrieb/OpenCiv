export interface State {
    name?: string;
    transitions: string[];
    onEnter?: (context: {
        from: string;
        eventData?: any;
        data: any;
    }) => boolean | void;
    onState?: () => any;
    onExit?: (context: {
        to: string;
        data: any;
    }) => boolean | void;
    onUpdate?: (data: any, elapsedMs: number) => any;
}
export interface StateMachineDescription {
    start: string;
    states: {
        [name: string]: State;
    };
}
export declare type PossibleStates<TMachine> = TMachine extends StateMachineDescription ? Extract<keyof TMachine['states'], string> : never;
export interface StateMachineState {
    data: any;
    currentState: string;
}
export declare class StateMachine<TPossibleStates extends string, TData> {
    startState: State;
    private _currentState;
    get currentState(): State;
    set currentState(state: State);
    states: Map<string, State>;
    data: TData;
    static create<TMachine extends StateMachineDescription, TData>(machineDescription: TMachine, data?: TData): StateMachine<PossibleStates<TMachine>, TData>;
    in(state: TPossibleStates): boolean;
    go(stateName: TPossibleStates, eventData?: any): boolean;
    update(elapsedMs: number): void;
    save(saveKey: string): void;
    restore(saveKey: string): void;
}
