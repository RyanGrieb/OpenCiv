package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.ItemInfoWindow;

public class BuyItemButton extends Button {

	public BuyItemButton(City city, ProductionItem productionItem, float x, float y, float width, float height) {
		super("Buy", x, y, width, height);
	}

	@Override
	public void onClick() {
		System.out.println("Hi");
		
		Civilization.getInstance().getWindowManager().closeWindow(ItemInfoWindow.class);
	}

}
