export class WebsocketClient {
  private static websocket: WebSocket;

  public static init(serverAddress: string) {
    this.websocket = new WebSocket("ws://" + serverAddress + ":2000/");

    this.websocket.addEventListener("open", (event) => {
      console.log("Connected to server: " + event);
      this.websocket.send("Here's some text that the server is urgently awaiting!");
    });

    this.websocket.addEventListener("message", (event) => {
      console.log(event.data);
    });
  }
}
