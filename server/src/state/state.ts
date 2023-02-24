import { ServerEvents } from "../events";

export class State {
  public onInitialize() {}

  public onDestroyed() {
    ServerEvents.clear();
  }
}
