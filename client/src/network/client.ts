export class WebsocketClient {
  private static websocket: WebSocket;

  public static init() {
    this.websocket = new WebSocket("ws://localhost:2000/");
    this.websocket.onopen = (event) => {
      console.log("Connected to server: " + event);
      this.websocket.send("Here's some text that the server is urgently awaiting!");
    };
  }
}
