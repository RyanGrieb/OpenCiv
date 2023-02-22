export class NetworkEvents {
  private static storedEvents: Map<string, Function[]>;

  private constructor() {}

  public static call(eventName: string, data: JSON) {
    if (this.storedEvents.has(eventName)) {
      //Call the stored callback function
      const functions = this.storedEvents.get(eventName);
      for (let currentFunction of functions) {
        currentFunction(data);
      }
    }
  }

  public static on(eventName: string, callback: (data: JSON) => void) {
    if (!this.storedEvents) {
      this.storedEvents = new Map<string, Function[]>();
    }

    //Get the list of stored callback functions or an empty list
    let functions: Function[] = this.storedEvents.get(eventName) ?? [];
    // Append the to functions
    functions.push(callback);
    this.storedEvents.set(eventName, functions);
  }
}

export class WebsocketClient {
  private static websocket: WebSocket;

  private constructor() {}
  // TODO: Add network events here with string & function that has arguments.
  // e.g. setScreen & screenType arg.

  public static init(serverAddress: string) {
    this.websocket = new WebSocket("ws://" + serverAddress + ":2000/");

    this.websocket.addEventListener("open", (event) => {
      console.log("Connected to server: " + event);
      this.websocket.send("Here's some text that the server is urgently awaiting!");
    });

    this.websocket.addEventListener("message", (event) => {
      console.log(event.data);
      const eventJSON = JSON.parse(event.data);
      NetworkEvents.call(eventJSON["event"], eventJSON);
    });
  }
}
