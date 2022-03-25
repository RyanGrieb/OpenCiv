package me.rhin.openciv.ui.window.type;

import java.util.HashMap;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.listener.AddSpecialistToContainerListener;
import me.rhin.openciv.listener.BuildingConstructedListener;
import me.rhin.openciv.listener.CompleteResearchListener;
import me.rhin.openciv.listener.FinishProductionItemListener;
import me.rhin.openciv.listener.PlayerStatUpdateListener;
import me.rhin.openciv.listener.QueueProductionItemListener;
import me.rhin.openciv.listener.RemoveSpecialistFromContainerListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.listener.SetCitizenTileWorkerListener;
import me.rhin.openciv.listener.SetCityOwnerListener;
import me.rhin.openciv.listener.SetTileTypeListener;
import me.rhin.openciv.listener.TerritoryGrowListener;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.AddSpecialistToContainerPacket;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.CompleteResearchPacket;
import me.rhin.openciv.shared.packet.type.FinishProductionItemPacket;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.QueueProductionItemPacket;
import me.rhin.openciv.shared.packet.type.RemoveSpecialistFromContainerPacket;
import me.rhin.openciv.shared.packet.type.SetCitizenTileWorkerPacket;
import me.rhin.openciv.shared.packet.type.SetCityOwnerPacket;
import me.rhin.openciv.shared.packet.type.SetTileTypePacket;
import me.rhin.openciv.shared.packet.type.TerritoryGrowPacket;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.button.type.CloseWindowButton;
import me.rhin.openciv.ui.button.type.WorkedTileButton;
import me.rhin.openciv.ui.game.CityProductionInfo;
import me.rhin.openciv.ui.game.CityReligionInfo;
import me.rhin.openciv.ui.game.CityStatsInfo;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.ListObject;
import me.rhin.openciv.ui.list.type.ListBuilding;
import me.rhin.openciv.ui.list.type.ListProductionItem;
import me.rhin.openciv.ui.screen.type.InGameScreen;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CityInfoWindow extends AbstractWindow implements ResizeListener, BuildingConstructedListener,
		SetCitizenTileWorkerListener, AddSpecialistToContainerListener, RemoveSpecialistFromContainerListener,
		CompleteResearchListener, FinishProductionItemListener, PlayerStatUpdateListener, SetTileTypeListener,
		TerritoryGrowListener, SetCityOwnerListener, QueueProductionItemListener {

	private City city;
	private CloseWindowButton closeWindowButton;
	private CityStatsInfo cityStatsInfo;
	private CityReligionInfo cityReligionInfo;
	private CityProductionInfo cityProductionInfo;
	// TODO: buildingContainerList should contain citizen focuses soon
	private ContainerList topRightContainerList;
	private ContainerList productionContainerList;
	private HashMap<Tile, WorkedTileButton> citizenButtons;
	private CustomButton queueListButton;

	public CityInfoWindow(City city) {
		this.city = city;
		closeWindowButton = new CloseWindowButton(this.getClass(), "Close", viewport.getWorldWidth() / 2 - 150 / 2, 50,
				150, 45);
		addActor(closeWindowButton);

		this.cityStatsInfo = new CityStatsInfo(city, 2, viewport.getWorldHeight() - (175 + GameOverlay.HEIGHT + 2), 210,
				175);

		addActor(cityStatsInfo);

		this.cityReligionInfo = new CityReligionInfo(city, 2, cityStatsInfo.getY() - 105, 210, 100);
		addActor(cityReligionInfo);

		this.cityProductionInfo = new CityProductionInfo(city, 2, cityReligionInfo.getY() - 105, 210, 100);
		addActor(cityProductionInfo);

		this.productionContainerList = new ContainerList(0, 0, 220, 325);
		for (ProductionItem productionItem : city.getProducibleItemManager().getProducibleItems()) {
			productionContainerList.addItem(ListContainerType.CATEGORY, productionItem.getCategory(),
					new ListProductionItem(city, productionItem, productionContainerList, 200, 45));
		}
		addActor(productionContainerList);

		float topbarHeight = ((InGameScreen) Civilization.getInstance().getCurrentScreen()).getGameOverlay()
				.getTopbarHeight();

		this.topRightContainerList = new ContainerList(viewport.getWorldWidth() - 220,
				viewport.getWorldHeight() - 195 - topbarHeight, 220, 195);

		for (Building building : city.getBuildings()) {
			topRightContainerList.addItem(ListContainerType.CATEGORY, "Buildings",
					new ListBuilding(building, topRightContainerList, 200, 45));
		}

		this.citizenButtons = new HashMap<>();
		for (Tile tile : city.getCitizenWorkers().keySet()) {
			WorkedTileButton button = new WorkedTileButton(city.getCitizenWorkers().get(tile), tile,
					tile.getX() + tile.getWidth() / 2 - 16 / 2, tile.getY() + tile.getHeight() - 16 / 1.5F, 16, 16);

			citizenButtons.put(tile, button);
			Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().addActor(button);
		}

		addActor(topRightContainerList);

		this.queueListButton = new CustomButton(TextureEnum.UI_BUTTON_ICON, TextureEnum.UI_BUTTON_ICON_HOVERED,
				TextureEnum.ICON_CLOCK, cityProductionInfo.getX() + cityProductionInfo.getWidth() - 38,
				viewport.getWorldHeight() - (323 + GameOverlay.HEIGHT + 2), 32, 32);
		queueListButton.onClick(() -> {
			Civilization.getInstance().getWindowManager().toggleWindow(new QueuedItemsListWindow(city));
		});

		if (city.getProducibleItemManager().getItemQueue().size() > 1) {
			addActor(queueListButton);
		}

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(BuildingConstructedListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetCitizenTileWorkerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(AddSpecialistToContainerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(RemoveSpecialistFromContainerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CompleteResearchListener.class, this);
		Civilization.getInstance().getEventManager().addListener(FinishProductionItemListener.class, this);
		Civilization.getInstance().getEventManager().addListener(PlayerStatUpdateListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetTileTypeListener.class, this);
		Civilization.getInstance().getEventManager().addListener(TerritoryGrowListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetCityOwnerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(QueueProductionItemListener.class, this);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
	}

	@Override
	public void onResize(int width, int height) {
		closeWindowButton.setPosition(width / 2 - 150 / 2, 50);
		cityStatsInfo.setPosition(2, height - (175 + GameOverlay.HEIGHT + 2));
		cityReligionInfo.setPosition(2, cityStatsInfo.getY() - 105);
		cityProductionInfo.setPosition(2, cityReligionInfo.getY() - 105);

		float topbarHeight = ((InGameScreen) Civilization.getInstance().getCurrentScreen()).getGameOverlay()
				.getTopbarHeight();
		topRightContainerList.setPosition(width - 220, height - 195 - topbarHeight);

		queueListButton.setPosition(cityProductionInfo.getX() + cityProductionInfo.getWidth() - 38,
				height - (323 + GameOverlay.HEIGHT + 2));
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

		topRightContainerList.onClose();
		productionContainerList.onClose();

		for (Actor actor : getChildren()) {

			if (actor instanceof Listener) {
				Civilization.getInstance().getEventManager().clearListenersFromObject((Listener) actor);
			}
		}

		Civilization.getInstance().getEventManager().clearListenersFromObject(this);
	}

	@Override
	public void onBuildingConstructed(BuildingConstructedPacket packet) {

		// Account for wonders being built.
		updateAvailableProductionItems();

		if (!city.getName().equals(packet.getCityName()))
			return;

		topRightContainerList.clearList();

		for (Building building : city.getBuildings()) {
			topRightContainerList.addItem(ListContainerType.CATEGORY, "Buildings",
					new ListBuilding(building, topRightContainerList, 200, 45));
		}

		if (city.getUnemployedWorkerAmount() > 0) {
			// FIXME: These params are dumb
			updateSpecialistContainers(city.getName(), city.getName());
		}

		productionContainerList.clearList();
		for (ProductionItem productionItem : city.getProducibleItemManager().getProducibleItems()) {
			productionContainerList.addItem(ListContainerType.CATEGORY, productionItem.getCategory(),
					new ListProductionItem(city, productionItem, productionContainerList, 200, 45));
		}

	}

	@Override
	public void onFinishProductionItem(FinishProductionItemPacket packet) {
		if (!city.getName().equals(packet.getCityName()))
			return;

		updateAvailableProductionItems();

		if (city.getProducibleItemManager().getItemQueue().size() < 2)
			queueListButton.addAction(Actions.removeActor());
	}

	@Override
	public void onPlayerStatUpdate(PlayerStatUpdatePacket packet) {
		updateAvailableProductionItems();
	}

	@Override
	public void onSetTileType(SetTileTypePacket packet) {
		// TODO: Determine if this is inside our territory.
		// FIXME: This doesn't work properly.
		updateAvailableProductionItems();
	}

	@Override
	public void onTerritoryGrow(TerritoryGrowPacket packet) {
		updateAvailableProductionItems();
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
		addAvailableProductionItems();
	}

	@Override
	public void onSetCityOwner(SetCityOwnerPacket packet) {
		for (AbstractPlayer player : Civilization.getInstance().getGame().getPlayers().values()) {
			City city = player.getCityFromName(packet.getCityName());

			if (this.city.equals(city))
				Civilization.getInstance().getWindowManager().closeWindow(getClass());
		}
	}

	@Override
	public void onQueueProductionItem(QueueProductionItemPacket packet) {
		addActor(queueListButton);
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
		}
	}

	private void addAvailableProductionItems() {
		outerloop: for (ProductionItem productionItem : city.getProducibleItemManager().getProducibleItems()) {

			for (ListContainer listContainer : productionContainerList.getListContainers().values()) {
				for (ListObject listObj : listContainer.getListItemActors()) {
					if (listObj instanceof ListProductionItem) {
						ListProductionItem listProductionItem = (ListProductionItem) listObj;

						if (listProductionItem.getProductionItem().equals(productionItem)) {
							continue outerloop;
						}
					}
				}
			}

			productionContainerList.addItem(ListContainerType.CATEGORY, productionItem.getCategory(),
					new ListProductionItem(city, productionItem, productionContainerList, 200, 45));
		}
	}

	private void updateAvailableProductionItems() {

		addAvailableProductionItems();

		// If we contain items that we can't produce. Remove
		outerloop: for (ListContainer listContainer : productionContainerList.getListContainers().values()) {
			for (ListObject listObject : listContainer.getListItemActors()) {
				{
					if (listObject instanceof ListProductionItem) {
						ListProductionItem listProdItem = (ListProductionItem) listObject;
						if (!listProdItem.getProductionItem().meetsProductionRequirements()) {
							productionContainerList.clearList();
							for (ProductionItem productionItem : city.getProducibleItemManager().getProducibleItems()) {
								productionContainerList.addItem(ListContainerType.CATEGORY,
										productionItem.getCategory(),
										new ListProductionItem(city, productionItem, productionContainerList, 200, 45));
							}
							break outerloop;
						}
					}
				}

			}
		}
	}
}
