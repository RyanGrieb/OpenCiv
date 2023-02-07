"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketClient = void 0;
class WebsocketClient {
    static init() {
        this.websocket = new WebSocket("ws://localhost:2000/");
        this.websocket.onopen = (event) => {
            console.log("Connected to server: " + event);
            this.websocket.send("Here's some text that the server is urgently awaiting!");
        };
    }
}
exports.WebsocketClient = WebsocketClient;
//# sourceMappingURL=client.js.map