package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.ItemInfoWindow;
import me.rhin.openciv.ui.window.type.QueueItemWindow;

public class ProduceItemButton extends Button {

	private City city;
	private ProductionItem productionItem;

	public ProduceItemButton(City city, ProductionItem productionItem, float x, float y, float width, float height) {
		super("Produce", x, y, width, height);

		this.city = city;
		this.productionItem = productionItem;
	}

	@Override
	public void onClick() {
		if (city.getProducibleItemManager().getCurrentProducingItem() == null) {
			city.getProducibleItemManager().requestSetProductionItem(productionItem);
			Civilization.getInstance().getWindowManager().closeWindow(ItemInfoWindow.class);
		} else {
			// Civilization.getInstance().getWindowManager().closeWindow(ItemInfoWindow.class);
			Civilization.getInstance().getWindowManager().toggleWindow(new QueueItemWindow(city, productionItem));
		}
	}

}
