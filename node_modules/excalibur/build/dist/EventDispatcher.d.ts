import { GameEvent } from './Events';
import { Eventable } from './Interfaces/Evented';
export declare class EventDispatcher<T = any> implements Eventable {
    private _handlers;
    private _wiredEventDispatchers;
    /**
     * Clears any existing handlers or wired event dispatchers on this event dispatcher
     */
    clear(): void;
    private _deferedHandlerRemovals;
    private _processDeferredHandlerRemovals;
    /**
     * Emits an event for target
     * @param eventName  The name of the event to publish
     * @param event      Optionally pass an event data object to the handler
     */
    emit(eventName: string, event: GameEvent<T>): void;
    /**
     * Subscribe an event handler to a particular event name, multiple handlers per event name are allowed.
     * @param eventName  The name of the event to subscribe to
     * @param handler    The handler callback to fire on this event
     */
    on(eventName: string, handler: (event: GameEvent<T>) => void): void;
    /**
     * Unsubscribe an event handler(s) from an event. If a specific handler
     * is specified for an event, only that handler will be unsubscribed.
     * Otherwise all handlers will be unsubscribed for that event.
     *
     * @param eventName  The name of the event to unsubscribe
     * @param handler    Optionally the specific handler to unsubscribe
     */
    off(eventName: string, handler?: (event: GameEvent<T>) => void): void;
    private _removeHandler;
    /**
     * Once listens to an event one time, then unsubscribes from that event
     *
     * @param eventName The name of the event to subscribe to once
     * @param handler   The handler of the event that will be auto unsubscribed
     */
    once(eventName: string, handler: (event: GameEvent<T>) => void): void;
    /**
     * Wires this event dispatcher to also receive events from another
     */
    wire(eventDispatcher: EventDispatcher): void;
    /**
     * Unwires this event dispatcher from another
     */
    unwire(eventDispatcher: EventDispatcher): void;
}
