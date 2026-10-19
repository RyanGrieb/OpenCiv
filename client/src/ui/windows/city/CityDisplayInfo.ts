import { Game } from "../../../Game";
import { City, ProductionOptions } from "../../../city/City";
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
  private buildingsWindow: CityBuildingsWindow;
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
    this.showBuildingsWindow();
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
        // An open list sits in the stats window's place, so leave the stats window hidden. Its options
        // may have changed (something was just bought), so ask for them again.
        if (!this.listMode) this.showStatsWindow();
        else this.requestListOptions(this.listMode);
        this.tileOverlays.refresh();
        this.showProductionQueueWindow();
      }
    });

    // The list's turn counts and prices go stale on a new turn, so close it.
    NetworkEvents.on({
      eventName: "newTurn",
      parentObject: this,
      callback: () => {
        if (this.listMode) this.closeList();
      }
    });

    // Bought or finished: the city's own listener has already added it to getBuildings().
    NetworkEvents.on({
      eventName: "addBuilding",
      parentObject: this,
      callback: (data: any) => {
        if (data["cityName"] === this.city.getName()) this.showBuildingsWindow();
      }
    });

    NetworkEvents.on({
      eventName: "updateProductionOptions",
      parentObject: this,
      callback: (data: any) => {
        if (data["cityName"] !== this.city.getName() || this.listMode !== "produce") return;
        this.showChooseProductionList(data);
      }
    });

    NetworkEvents.on({
      eventName: "updatePurchaseOptions",
      parentObject: this,
      callback: (data: any) => {
        const mode = data["currency"] === "faith" ? "faith" : "purchase";
        if (data["cityName"] !== this.city.getName() || this.listMode !== mode) return;
        this.showChooseProductionList(data);
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

  private showBuildingsWindow() {
    this.removeActor(this.buildingsWindow);
    this.buildingsWindow = new CityBuildingsWindow(this.city);
    this.addActor(this.buildingsWindow);
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

    this.requestListOptions(mode);
  }

  private requestListOptions(mode: ProductionListMode) {
    const event = mode === "produce" ? "requestProductionOptions" : "requestPurchaseOptions";
    WebsocketClient.sendMessage({
      event,
      cityName: this.city.getName(),
      currency: mode === "faith" ? "faith" : "gold"
    });
  }

  private closeList() {
    this.listMode = undefined;

    this.removeActor(this.chooseProductionList);
    this.chooseProductionList = undefined;

    this.showStatsWindow();
    this.showProductionQueueWindow();
  }

  private showChooseProductionList(options: ProductionOptions) {
    this.removeActor(this.chooseProductionList);
    this.chooseProductionList = new ChooseProductionList({
      city: this.city,
      mode: this.listMode,
      productionOptions: options,
      onChosen: () => this.closeList()
    });
    this.addActor(this.chooseProductionList);
  }
}
