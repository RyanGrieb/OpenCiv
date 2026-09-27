import { Game } from "../../../Game";
import { City, ProductionQueueItem } from "../../../city/City";
import { NetworkEvents, WebsocketClient } from "../../../network/Client";
import { ActorGroup } from "../../../scene/ActorGroup";
import { ChooseProductionList, ProductionListMode } from "./ChooseProductionList";
import { CityBuildingsWindow } from "./CityBuildingsWindow";
import { CityProductionQueueWindow } from "./CityProductionQueueWindow";
import { CityScreen } from "./CityScreen";
import { CityStatsWindow } from "./CityStatsWindow";
import { CityTileOverlays } from "./CityTileOverlays";

// The city screen. Lays out its windows and rebuilds them when the server sends new city stats.
export class CityDisplayInfo extends ActorGroup {
  private city: City;

  private tileOverlays: CityTileOverlays;
  private statsWindow: CityStatsWindow;
  private productionQueueWindow: CityProductionQueueWindow;
  private chooseProductionList: ChooseProductionList;
  // Which list is open in the stats window's place, if any.
  private listMode: ProductionListMode | undefined;

  constructor(city: City) {
    super({
      x: 0,
      y: 0,
      z: CityScreen.Z,
      width: Game.getInstance().getWidth(),
      height: Game.getInstance().getHeight(),
      cameraApplies: false
    });

    this.city = city;

    this.showStatsWindow();
    this.addActor(new CityBuildingsWindow(city));
    this.tileOverlays = new CityTileOverlays(city);
    this.showProductionQueueWindow();

    // Refreshes whenever the queue changes (e.g. after choosing production),
    // City's own updateCityStats listener (registered when the city was created,
    // so it always runs first) has already updated getProductionQueue() by now.
    NetworkEvents.on({
      eventName: "updateCityStats",
      parentObject: this,
      callback: (data: any) => {
        if (data["cityName"] !== this.city.getName()) return;
        this.showStatsWindow();
        this.tileOverlays.refresh();
        this.showProductionQueueWindow();
      }
    });

    NetworkEvents.on({
      eventName: "updateProductionOptions",
      parentObject: this,
      callback: (data: any) => {
        if (data["cityName"] !== this.city.getName() || this.listMode !== "produce") return;
        this.showChooseProductionList(data["units"], data["buildings"]);
      }
    });

    NetworkEvents.on({
      eventName: "updatePurchaseOptions",
      parentObject: this,
      callback: (data: any) => {
        if (data["cityName"] !== this.city.getName() || this.listMode !== "purchase") return;
        this.showChooseProductionList(data["units"], data["buildings"]);
      }
    });
  }

  public onDestroyed(): void {
    this.tileOverlays.clear();
    NetworkEvents.removeCallbacksByParentObject(this);

    super.onDestroyed();
  }

  // Replaces the stats window, if one is showing, with a freshly built one.
  private showStatsWindow() {
    this.removeActor(this.statsWindow);
    this.statsWindow = new CityStatsWindow(this.city);
    this.addActor(this.statsWindow);
  }

  private hideStatsWindow() {
    this.removeActor(this.statsWindow);
    this.statsWindow = undefined;
  }

  private showProductionQueueWindow() {
    this.removeActor(this.productionQueueWindow);
    this.productionQueueWindow = new CityProductionQueueWindow({
      city: this.city,
      listMode: this.listMode,
      onToggleList: (mode) => this.toggleList(mode)
    });
    this.addActor(this.productionQueueWindow);
  }

  // Opens that list, or closes it if it's the one open. The other list's button switches lists.
  private toggleList(mode: ProductionListMode) {
    if (this.listMode === mode) {
      this.closeList();
    } else {
      this.openList(mode);
    }
  }

  // The options arrive from the server as updateProductionOptions or updatePurchaseOptions.
  private openList(mode: ProductionListMode) {
    this.listMode = mode;
    this.removeActor(this.chooseProductionList);
    this.chooseProductionList = undefined;
    this.hideStatsWindow();
    // Rebuild just for the buttons' new "Cancel" label - the queue itself hasn't changed.
    this.showProductionQueueWindow();

    const event = mode === "produce" ? "requestProductionOptions" : "requestPurchaseOptions";
    WebsocketClient.sendMessage({ event, cityName: this.city.getName() });
  }

  private closeList() {
    this.listMode = undefined;

    this.removeActor(this.chooseProductionList);
    this.chooseProductionList = undefined;

    this.showStatsWindow();
    this.showProductionQueueWindow();
  }

  private showChooseProductionList(units: ProductionQueueItem[], buildings: ProductionQueueItem[]) {
    this.removeActor(this.chooseProductionList);
    this.chooseProductionList = new ChooseProductionList({
      city: this.city,
      mode: this.listMode,
      units: units,
      buildings: buildings,
      onChosen: () => this.closeList()
    });
    this.addActor(this.chooseProductionList);
  }
}
