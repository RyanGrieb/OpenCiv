import { ServerEvents } from "../events";

export class State {
  //We use ExitReceipt to used the parent onDestroyed() function is always called for child states.
  private static ExitReceipt = new (class {
    private property: string = "";
  })();

  public onInitialize() {}

  public onDestroyed(): typeof State.ExitReceipt {
    ServerEvents.clear();
    return State.ExitReceipt;
  }
}
