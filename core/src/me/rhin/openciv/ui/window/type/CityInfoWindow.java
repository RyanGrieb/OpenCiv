package me.rhin.openciv.ui.window.type;

import java.util.HashMap;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.listener.AddUnemployedCitizenListener;
import me.rhin.openciv.listener.BuildingConstructedListener;
import me.rhin.openciv.listener.SetCitizenTileWorkerListener;
import me.rhin.openciv.shared.packet.type.AddUnemployedCitizenPacket;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket;
import me.rhin.openciv.ui.button.type.CityInfoCloseButton;
import me.rhin.openciv.ui.button.type.WorkedTileButton;
import me.rhin.openciv.ui.game.CityProductionInfo;
import me.rhin.openciv.ui.game.CityStatsInfo;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.type.ListBuilding;
import me.rhin.openciv.ui.list.type.ListProductionItem;
import me.rhin.openciv.ui.list.type.ListUnemployedCitizens;
import me.rhin.openciv.ui.screen.type.InGameScreen;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CityInfoWindow extends AbstractWindow
		implements BuildingConstructedListener, SetCitizenTileWorkerListener, AddUnemployedCitizenListener {

	private City city;
	private CityStatsInfo cityStatsInfo;
	private CityProductionInfo cityProductionInfo;
	// TODO: buildingContainerList should contain citizen focuses soon
	private ContainerList topRightContainerList;
	private ContainerList productionContainerList;
	private HashMap<Tile, WorkedTileButton> citizenButtons;

	public CityInfoWindow(City city) {
		this.city = city;
		addActor(new CityInfoCloseButton(viewport.getWorldWidth() / 2 - 150 / 2, 50, 150, 45));

		this.cityStatsInfo = new CityStatsInfo(city, 2,
				Civilization.getInstance().getScreenManager().getCurrentScreen().getViewport().getWorldHeight()
						- (175 + GameOverlay.HEIGHT + 2),
				200, 175);

		addActor(cityStatsInfo);

		this.cityProductionInfo = new CityProductionInfo(city, 2, cityStatsInfo.getY() - 105, 200, 100);
		addActor(cityProductionInfo);

		float topbarHeight = ((InGameScreen) Civilization.getInstance().getCurrentScreen()).getGameOverlay()
				.getTopbarHeight();

		this.topRightContainerList = new ContainerList(viewport.getWorldWidth() - 200,
				viewport.getWorldHeight() - 195 - topbarHeight, 200, 195);

		for (Building building : city.getBuildings()) {
			topRightContainerList.addItem(ListContainerType.CATEGORY, "Buildings", new ListBuilding(building, 200, 45));
		}
		addActor(topRightContainerList);

		this.productionContainerList = new ContainerList(0, 0, 200, 255);
		for (ProductionItem productionItem : city.getProducibleItemManager().getProducibleItems()) {
			productionContainerList.addItem(ListContainerType.CATEGORY, productionItem.getCategory(),
					new ListProductionItem(city, productionItem, 200, 45));
		}
		addActor(productionContainerList);

		this.citizenButtons = new HashMap<>();
		for (Tile tile : city.getCitizenWorkers().keySet()) {
			WorkedTileButton button = new WorkedTileButton(city.getCitizenWorkers().get(tile), tile,
					tile.getX() + tile.getWidth() / 2 - 16 / 2, tile.getY() + tile.getHeight() - 16 / 1.5F, 16, 16);

			citizenButtons.put(tile, button);
			Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().addActor(button);
		}

		if (city.getUnemployedWorkerAmount() > 0) {
			topRightContainerList.addItem(ListContainerType.CATEGORY, "Unemployed Citizens",
					new ListUnemployedCitizens(city.getUnemployedWorkerAmount(), 200, 45));
		}

		Civilization.getInstance().getEventManager().addListener(BuildingConstructedListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetCitizenTileWorkerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(AddUnemployedCitizenListener.class, this);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
	}

	@Override
	public boolean disablesInput() {
		return false;
	}

	@Override
	public boolean closesOtherWindows() {
		return true;
	}

	@Override
	public void onBuildingConstructed(BuildingConstructedPacket packet) {
		topRightContainerList.clearList();

		for (Building building : city.getBuildings()) {
			topRightContainerList.addItem(ListContainerType.CATEGORY, "Buildings", new ListBuilding(building, 200, 45));
		}

		productionContainerList.clearList();
		for (ProductionItem productionItem : city.getProducibleItemManager().getProducibleItems()) {
			productionContainerList.addItem(ListContainerType.CATEGORY, productionItem.getCategory(),
					new ListProductionItem(city, productionItem, 200, 45));
		}
	}

	@Override
	public void onClose() {
		for (WorkedTileButton button : citizenButtons.values()) {
			button.addAction(Actions.removeActor());
		}
	}

	@Override
	public void onSetCitizenTileWorker(SetCitizenTileWorkerPacket packet) {
		Tile tile = Civilization.getInstance().getGame().getMap().getTiles()[packet.getGridX()][packet.getGridY()];

		citizenButtons.get(tile).setTexture(WorkedTileButton.getTextureFromWorkerType(packet.getWorkerType()));
	}

	@Override
	public void onAddUnemployedCitizen(AddUnemployedCitizenPacket packet) {
		// NOTE: We manually select the listContianer, since were adding to a horizontal
		// list.
		if (topRightContainerList.getListContainers().get("Unemployed Citizens") == null) {
			topRightContainerList.addItem(ListContainerType.CATEGORY, "Unemployed Citizens",
					new ListUnemployedCitizens(200, 45));
		}

		ListContainer listContainer = topRightContainerList.getListContainers().get("Unemployed Citizens");
		((ListUnemployedCitizens) listContainer.getListItemActors().get(0)).setCitizens(city.getUnemployedWorkerAmount());
	}

}
