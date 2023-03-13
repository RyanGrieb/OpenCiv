import { ServerEvents } from "../Events";

export class State {
  //We use ExitReceipt to used the parent onDestroyed() function is always called for child states.
  private static ExitReceipt = new (class {})();

  public onInitialize() {}

  public onDestroyed(): typeof State.ExitReceipt {
    ServerEvents.clear();
    return State.ExitReceipt;
  }
}
