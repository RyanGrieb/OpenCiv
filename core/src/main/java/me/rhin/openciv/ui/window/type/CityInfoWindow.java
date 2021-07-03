package me.rhin.openciv.ui.window.type;

import java.util.HashMap;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.listener.AddSpecialistToContainerListener;
import me.rhin.openciv.listener.BuildingConstructedListener;
import me.rhin.openciv.listener.CompleteResearchListener;
import me.rhin.openciv.listener.RemoveSpecialistFromContainerListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.listener.SetCitizenTileWorkerListener;
import me.rhin.openciv.shared.packet.type.AddSpecialistToContainerPacket;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;
import me.rhin.openciv.shared.packet.type.RemoveSpecialistFromContainerPacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket;
import me.rhin.openciv.ui.button.type.CityInfoCloseButton;
import me.rhin.openciv.ui.button.type.WorkedTileButton;
import me.rhin.openciv.ui.game.CityProductionInfo;
import me.rhin.openciv.ui.game.CityStatsInfo;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.ListObject;
import me.rhin.openciv.ui.list.type.ListBuilding;
import me.rhin.openciv.ui.list.type.ListProductionItem;
import me.rhin.openciv.ui.list.type.ListUnemployedCitizens;
import me.rhin.openciv.ui.screen.type.InGameScreen;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CityInfoWindow extends AbstractWindow
		implements ResizeListener, BuildingConstructedListener, SetCitizenTileWorkerListener,
		AddSpecialistToContainerListener, RemoveSpecialistFromContainerListener, CompleteResearchListener {

	private City city;
	private CityInfoCloseButton cityCloseButton;
	private CityStatsInfo cityStatsInfo;
	private CityProductionInfo cityProductionInfo;
	// TODO: buildingContainerList should contain citizen focuses soon
	private ContainerList topRightContainerList;
	private ContainerList productionContainerList;
	private HashMap<Tile, WorkedTileButton> citizenButtons;

	public CityInfoWindow(City city) {
		this.city = city;
		cityCloseButton = new CityInfoCloseButton(viewport.getWorldWidth() / 2 - 150 / 2, 50, 150, 45);
		addActor(cityCloseButton);

		this.cityStatsInfo = new CityStatsInfo(city, 2, viewport.getWorldHeight() - (175 + GameOverlay.HEIGHT + 2), 200,
				175);

		addActor(cityStatsInfo);

		this.cityProductionInfo = new CityProductionInfo(city, 2, cityStatsInfo.getY() - 105, 200, 100);
		addActor(cityProductionInfo);

		this.productionContainerList = new ContainerList(this, 0, 0, 200, 255);
		for (ProductionItem productionItem : city.getProducibleItemManager().getProducibleItems()) {
			productionContainerList.addItem(ListContainerType.CATEGORY, productionItem.getCategory(),
					new ListProductionItem(city, productionItem, 200, 45));
		}
		addActor(productionContainerList);

		float topbarHeight = ((InGameScreen) Civilization.getInstance().getCurrentScreen()).getGameOverlay()
				.getTopbarHeight();

		this.topRightContainerList = new ContainerList(this, viewport.getWorldWidth() - 220,
				viewport.getWorldHeight() - 195 - topbarHeight, 200, 195);

		for (Building building : city.getBuildings()) {
			topRightContainerList.addItem(ListContainerType.CATEGORY, "Buildings", new ListBuilding(building, 200, 45));
		}

		this.citizenButtons = new HashMap<>();
		for (Tile tile : city.getCitizenWorkers().keySet()) {
			WorkedTileButton button = new WorkedTileButton(city.getCitizenWorkers().get(tile), tile,
					tile.getX() + tile.getWidth() / 2 - 16 / 2, tile.getY() + tile.getHeight() - 16 / 1.5F, 16, 16);

			citizenButtons.put(tile, button);
			Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().addActor(button);
		}

		if (city.getUnemployedWorkerAmount() > 0) {
			topRightContainerList.addItem(ListContainerType.CATEGORY, "Unemployed Citizens",
					new ListUnemployedCitizens(city, city.getUnemployedWorkerAmount(), 200, 45));
		}

		addActor(topRightContainerList);

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(BuildingConstructedListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetCitizenTileWorkerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(AddSpecialistToContainerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(RemoveSpecialistFromContainerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CompleteResearchListener.class, this);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
	}

	@Override
	public void onResize(int width, int height) {
		cityCloseButton.setPosition(width / 2 - 150 / 2, 50);
		cityStatsInfo.setPosition(2, height - (175 + GameOverlay.HEIGHT + 2));
		cityProductionInfo.setPosition(2, cityStatsInfo.getY() - 105);

		float topbarHeight = ((InGameScreen) Civilization.getInstance().getCurrentScreen()).getGameOverlay()
				.getTopbarHeight();
		topRightContainerList.setPosition(width - 220, height - 195 - topbarHeight);
	}

	@Override
	public boolean disablesInput() {
		return false;
	}

	@Override
	public boolean disablesCameraMovement() {
		return true;
	}

	@Override
	public boolean closesOtherWindows() {
		return true;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return true;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return false;
	}

	@Override
	public void onClose() {
		for (WorkedTileButton button : citizenButtons.values()) {
			button.addAction(Actions.removeActor());
		}

		Civilization.getInstance().getEventManager().removeListener(ResizeListener.class, this);
		Civilization.getInstance().getEventManager().removeListener(BuildingConstructedListener.class, this);
		Civilization.getInstance().getEventManager().removeListener(SetCitizenTileWorkerListener.class, this);
		Civilization.getInstance().getEventManager().removeListener(AddSpecialistToContainerListener.class, this);
		Civilization.getInstance().getEventManager().removeListener(RemoveSpecialistFromContainerListener.class, this);
	}

	@Override
	public void onBuildingConstructed(BuildingConstructedPacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

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
	public void onSetCitizenTileWorker(SetCitizenTileWorkerPacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

		Tile tile = Civilization.getInstance().getGame().getMap().getTiles()[packet.getGridX()][packet.getGridY()];

		if (!citizenButtons.containsKey(tile)) {

			WorkedTileButton button = new WorkedTileButton(city.getCitizenWorkers().get(tile), tile,
					tile.getX() + tile.getWidth() / 2 - 16 / 2, tile.getY() + tile.getHeight() - 16 / 1.5F, 16, 16);

			citizenButtons.put(tile, button);

			if (this.isOpen())
				Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().addActor(button);
		}

		citizenButtons.get(tile).setTexture(WorkedTileButton.getTextureFromWorkerType(packet.getWorkerType()));
	}

	@Override
	public void onAddSpecialistToContainer(AddSpecialistToContainerPacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

		updateSpecialistContainers(packet.getCityName(), packet.getContainerName());
	}

	@Override
	public void onRemoveSpecialistFromContainer(RemoveSpecialistFromContainerPacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

		updateSpecialistContainers(packet.getCityName(), packet.getContainerName());
	}

	@Override
	public void onCompleteResearch(CompleteResearchPacket packet) {
		outerloop: for (ProductionItem productionItem : city.getProducibleItemManager().getProducibleItems()) {

			for (ListContainer listContainer : productionContainerList.getListContainers().values()) {
				for (ListObject listObj : listContainer.getListItemActors()) {
					if (listObj instanceof ListProductionItem) {
						ListProductionItem listProductionItem = (ListProductionItem) listObj;

						if (listProductionItem.getProductionItem().equals(productionItem)) {
							System.out.println("Will this break all our for loops");
							continue outerloop;
						}
					}
				}
			}

			productionContainerList.addItem(ListContainerType.CATEGORY, productionItem.getCategory(),
					new ListProductionItem(city, productionItem, 200, 45));
		}
	}

	public void updateSpecialistContainers(String cityName, String containerName) {
		if (!city.getName().equals(cityName))
			return;

		if (containerName.equals(city.getName())) {

			if (city.getUnemployedWorkerAmount() < 1) {
				ListContainer listContainer = topRightContainerList.getListContainers().remove("Unemployed Citizens");

				if (listContainer == null)
					return;

				listContainer.addAction(Actions.removeActor());
				return;
			}

			// NOTE: We manually select the listContianer, since were adding to a
			if (topRightContainerList.getListContainers().get("Unemployed Citizens") == null) {
				topRightContainerList.addItem(ListContainerType.CATEGORY, "Unemployed Citizens",
						new ListUnemployedCitizens(city, 200, 45));
			}

			ListContainer listContainer = topRightContainerList.getListContainers().get("Unemployed Citizens");
			((ListUnemployedCitizens) listContainer.getListItemActors().get(0))
					.setCitizens(city.getUnemployedWorkerAmount());
		} else {
			// TODO: Update the ListBuilding specialist slot.
		}
	}
}
