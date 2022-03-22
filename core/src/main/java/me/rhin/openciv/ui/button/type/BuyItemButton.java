package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.ItemInfoWindow;

public class BuyItemButton extends Button {

	private City city;
	private ProductionItem productionItem;

	public BuyItemButton(City city, ProductionItem productionItem, float x, float y, float width, float height) {
		super("Buy", x, y, width, height);

		this.city = city;
		this.productionItem = productionItem;
	}

	@Override
	public void onClick() {
		if (city.getPlayerOwner().getStatLine().getStatValue(Stat.GOLD) < productionItem.getGoldCost())
			return;

		city.getProducibleItemManager().requestBuyProductionItem(productionItem);
		Civilization.getInstance().getWindowManager().closeWindow(ItemInfoWindow.class);
		
		Civilization.getInstance().getSoundHandler().playEffect(SoundEnum.BUY_ITEM);
	}

}
