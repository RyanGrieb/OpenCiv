import { AbstractPlayer } from "./AbstractPlayer";

export class ExternalPlayer extends AbstractPlayer {
  constructor(name: string, civData: JSON) {
    super(name, civData);
  }
}
