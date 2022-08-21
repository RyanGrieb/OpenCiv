import { EventDispatcher } from './EventDispatcher';
import { Eventable } from './Interfaces/Evented';
/**
 * Excalibur base class that provides basic functionality such as [[EventDispatcher]]
 * and extending abilities for vanilla Javascript projects
 */
export declare class Class implements Eventable {
    /**
     * Direct access to the game object event dispatcher.
     */
    eventDispatcher: EventDispatcher;
    constructor();
    /**
     * Alias for `addEventListener`. You can listen for a variety of
     * events off of the engine; see the events section below for a complete list.
     * @param eventName  Name of the event to listen for
     * @param handler    Event handler for the thrown event
     */
    on(eventName: string, handler: (event: any) => void): void;
    /**
     * Alias for `removeEventListener`. If only the eventName is specified
     * it will remove all handlers registered for that specific event. If the eventName
     * and the handler instance are specified only that handler will be removed.
     *
     * @param eventName  Name of the event to listen for
     * @param handler    Event handler for the thrown event
     */
    off(eventName: string, handler?: (event: any) => void): void;
    /**
     * Emits a new event
     * @param eventName   Name of the event to emit
     * @param eventObject Data associated with this event
     */
    emit(eventName: string, eventObject: any): void;
    /**
     * Once listens to an event one time, then unsubscribes from that event
     *
     * @param eventName The name of the event to subscribe to once
     * @param handler   The handler of the event that will be auto unsubscribed
     */
    once(eventName: string, handler: (event: any) => void): void;
}
