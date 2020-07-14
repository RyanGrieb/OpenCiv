package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.listener.BuildingConstructedListener;
import me.rhin.openciv.listener.SetWorkedTileListener;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.SetWorkedTilePacket;
import me.rhin.openciv.ui.button.type.CitizenTileButton;
import me.rhin.openciv.ui.button.type.CityInfoCloseButton;
import me.rhin.openciv.ui.game.CityProductionInfo;
import me.rhin.openciv.ui.game.CityStatsInfo;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.type.ListBuilding;
import me.rhin.openciv.ui.list.type.ListProductionItem;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CityInfoWindow extends AbstractWindow implements BuildingConstructedListener, SetWorkedTileListener {

	private City city;
	private CityStatsInfo cityStatsInfo;
	private CityProductionInfo cityProductionInfo;
	// TODO: buildingContainerList should contain citizen focuses soon
	private ContainerList buildingContainerList;
	private ContainerList productionContainerList;
	private ArrayList<CitizenTileButton> citizenButtons;

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

		this.buildingContainerList = new ContainerList(viewport.getWorldWidth() - 200, 200, 200, 195);

		for (Building building : city.getBuildings()) {
			buildingContainerList.addItem(ListContainerType.CATEGORY, "Buildings", new ListBuilding(building, 200, 45));
		}
		addActor(buildingContainerList);

		this.productionContainerList = new ContainerList(0, 0, 200, 255);
		for (ProductionItem productionItem : city.getProducibleItemManager().getProducibleItems()) {
			productionContainerList.addItem(ListContainerType.CATEGORY, productionItem.getCategory(),
					new ListProductionItem(city, productionItem, 200, 45));
		}
		addActor(productionContainerList);

		Civilization.getInstance().getEventManager().addListener(BuildingConstructedListener.class, this);

		// FIXME: I'm unsure where to put this
		this.citizenButtons = new ArrayList<>();
		for (Tile tile : city.getTerritory()) {
			CitizenTileButton button = new CitizenTileButton(tile, tile.getX() + tile.getWidth() / 2 - 16 / 2,
					tile.getY() + tile.getHeight() - 16 / 1.5F, 16, 16);

			if (city.getWorkedTiles().contains(tile) || city.getOriginTile().equals(tile)) {
				button.setTexture(TextureEnum.ICON_CITIZEN);
			}

			citizenButtons.add(button);
			Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().addActor(button);
		}

		Civilization.getInstance().getEventManager().addListener(SetWorkedTileListener.class, this);
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
		buildingContainerList.clearList();

		for (Building building : city.getBuildings()) {
			buildingContainerList.addItem(ListContainerType.CATEGORY, "Buildings", new ListBuilding(building, 200, 45));
		}

		productionContainerList.clearList();
		for (ProductionItem productionItem : city.getProducibleItemManager().getProducibleItems()) {
			productionContainerList.addItem(ListContainerType.CATEGORY, productionItem.getCategory(),
					new ListProductionItem(city, productionItem, 200, 45));
		}
	}

	@Override
	public void onClose() {
		for (CitizenTileButton button : citizenButtons) {
			button.addAction(Actions.removeActor());
		}
	}

	@Override
	public void onSetWorkedTile(SetWorkedTilePacket packet) {
		System.out.println("YO!!!!!");
	}
}
