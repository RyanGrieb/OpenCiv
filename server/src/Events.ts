import { WebSocket } from "ws";

export class CallbackData {
  public parentObject: object;
  public callbackFunction: Function;
  public globalEvent: boolean; // Not associated with the current scene.

  constructor(parentObject: object, callbackFunctions: Function, globalEvent: boolean) {
    this.parentObject = parentObject;
    this.callbackFunction = callbackFunctions;
    this.globalEvent = globalEvent;
  }
}

export interface OnServerEventOptions {
  eventName: string;
  parentObject: object;
  callback: (data: Record<string, any>, websocket?: WebSocket) => void;
  globalEvent?: boolean;
}

export class ServerEvents {
  private static storedEvents: Map<string, CallbackData[]>;

  private constructor() {}

  public static call(eventName: string, data: Record<string, any>, websocket?: WebSocket) {
    if (this.storedEvents.has(eventName)) {
      //Call the stored callback function
      const callbackDataList = this.storedEvents.get(eventName) as CallbackData[];
      for (let callbackData of callbackDataList) {
        callbackData.callbackFunction(data, websocket);
      }
    }
  }

  /**
   * Register a callback function to be called when a network event is received.
   *
   * @param {OnNetworkEventOptions} options - Options for the event listener.
   * @param {string} options.eventName - The name of the event to listen for.
   * @param {(data: Record<string, any>) => void} options.callback - The callback function to be called when the event is received.
   * @param {boolean} [options.globalEvent=false] - Determine if we don't remove the event when the state changes.
   */
  public static on(options: OnServerEventOptions) {
    if (!this.storedEvents) {
      this.storedEvents = new Map<string, CallbackData[]>();
    }
    this.addCallbackEvent(
      this.storedEvents,
      options.eventName,
      options.parentObject,
      options.callback,
      options.globalEvent
    );
  }

  /**
   * Removes all associated callback functions that isn't a globalEvent
   */
  public static clear() {
    const globalEventCallbacks = this.getGlobalEventCallbacks();
    this.storedEvents = globalEventCallbacks;
  }

  public static removeCallbacksByParentObject(parentObj: object): void {
    this.storedEvents.forEach((callbackDataList, eventName) => {
      const filteredDataList = callbackDataList.filter((callbackData) => callbackData.parentObject !== parentObj);

      if (filteredDataList.length === 0) {
        this.storedEvents.delete(eventName);
      } else {
        this.storedEvents.set(eventName, filteredDataList);
      }
    });
  }

  private static getGlobalEventCallbacks() {
    const globalEventCallbacks = new Map<string, CallbackData[]>();

    this.storedEvents.forEach((callbackDataList, eventName) => {
      for (const callbackData of callbackDataList) {
        if (callbackData.globalEvent) {
          this.addCallbackEvent(
            globalEventCallbacks,
            eventName,
            callbackData.parentObject,
            callbackData.callbackFunction,
            true
          );
        }
      }
    });

    return globalEventCallbacks;
  }

  private static addCallbackEvent(
    storedEvents: Map<string, CallbackData[]>,
    eventName: string,
    parentObject: object,
    callback: Function,
    globalEvent = false
  ) {
    //Get the list of stored callback functions or an empty list
    let callbackDataList: CallbackData[] = storedEvents.get(eventName) ?? [];
    // Append the to functions
    callbackDataList.push(new CallbackData(parentObject, callback, globalEvent));
    storedEvents.set(eventName, callbackDataList);
  }
}
