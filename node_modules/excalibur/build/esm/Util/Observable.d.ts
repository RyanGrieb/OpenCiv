/**
 * Defines a generic message that can contain any data
 * @template T is the typescript Type of the data
 */
export interface Message<T> {
    type: string;
    data: T;
}
/**
 * Defines an interface for an observer to receive a message via a notify() method
 */
export interface Observer<T> {
    notify(message: T): void;
}
/**
 * Defines an interface for something that might be an observer if a notify() is present
 */
export declare type MaybeObserver<T> = Partial<Observer<T>>;
/**
 * Simple Observable implementation
 * @template T is the typescript Type that defines the data being observed
 */
export declare class Observable<T> {
    observers: Observer<T>[];
    subscriptions: ((val: T) => any)[];
    /**
     * Register an observer to listen to this observable
     * @param observer
     */
    register(observer: Observer<T>): void;
    /**
     * Register a callback to listen to this observable
     * @param func
     */
    subscribe(func: (val: T) => any): void;
    /**
     * Remove an observer from the observable
     * @param observer
     */
    unregister(observer: Observer<T>): void;
    /**
     * Remove a callback that is listening to this observable
     * @param func
     */
    unsubscribe(func: (val: T) => any): void;
    /**
     * Broadcasts a message to all observers and callbacks
     * @param message
     */
    notifyAll(message: T): void;
    /**
     * Removes all observers and callbacks
     */
    clear(): void;
}
