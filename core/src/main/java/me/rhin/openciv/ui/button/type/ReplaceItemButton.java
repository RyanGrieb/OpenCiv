package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.ItemInfoWindow;
import me.rhin.openciv.ui.window.type.QueueItemWindow;

public class ReplaceItemButton extends Button {

	private City city;
	private ProductionItem productionItem;

	public ReplaceItemButton(City city, ProductionItem productionItem, float x, float y, float width, float height) {
		super("Replace", x, y, width, height);

		this.city = city;
		this.productionItem = productionItem;
	}

	@Override
	public void onClick() {
		city.getProducibleItemManager().requestSetProductionItem(productionItem);
		Civilization.getInstance().getWindowManager().closeWindow(QueueItemWindow.class);
		Civilization.getInstance().getWindowManager().closeWindow(ItemInfoWindow.class);
	}
}
