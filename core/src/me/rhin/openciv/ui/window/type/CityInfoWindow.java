package me.rhin.openciv.ui.window.type;

import com.badlogic.gdx.graphics.g2d.Batch;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.ui.button.ButtonManager;
import me.rhin.openciv.ui.button.type.CityInfoCloseButton;
import me.rhin.openciv.ui.game.CityStats;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListContainer.ListContainerType;
import me.rhin.openciv.ui.list.type.ListBuilding;
import me.rhin.openciv.ui.list.type.ListProductionItem;
import me.rhin.openciv.ui.window.AbstractWindow;

public class CityInfoWindow extends AbstractWindow {

	private ButtonManager buttonManager;
	private City city;
	private CityStats cityStats;
	private ContainerList buildingContainerList;
	private ContainerList productionContainerList;

	public CityInfoWindow(City city) {
		this.buttonManager = new ButtonManager(this);
		this.city = city;
		buttonManager.addButton(new CityInfoCloseButton(viewport.getWorldWidth() / 2 - 150 / 2, 50, 150, 45));

		this.cityStats = new CityStats(city, 2,
				Civilization.getInstance().getScreenManager().getCurrentScreen().getViewport().getWorldHeight()
						- (175 + GameOverlay.HEIGHT + 2),
				175, 175);

		addActor(cityStats);

		this.buildingContainerList = new ContainerList(viewport.getWorldWidth() - 200, 200, 200, 195);

		for (Building building : city.getBuildings()) {
			buildingContainerList.addItem(ListContainerType.CATEGORY, "Buildings", new ListBuilding(building, 200, 45));
		}
		addActor(buildingContainerList);

		this.productionContainerList = new ContainerList(0, 0, 200, 210);
		for (ProductionItem productionItem : city.getProducibleItemManager().getProducibleItems()) {
			productionContainerList.addItem(ListContainerType.CATEGORY, productionItem.getCategory(),
					new ListProductionItem(city, productionItem, 200, 45));
		}
		addActor(productionContainerList);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
	}

	@Override
	public boolean disablesInput() {
		return true;
	}

	@Override
	public boolean closesOtherWindows() {
		return true;
	}
}
