package me.rhin.openciv.game.heritage.type.mongolia;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitItem.UnitType;
import me.rhin.openciv.listener.SettleCityListener;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;

public class HorseIntegrationHeritage extends Heritage implements SettleCityListener {

	public HorseIntegrationHeritage() {
		Civilization.getInstance().getEventManager().addListener(SettleCityListener.class, this);
	}

	@Override
	public int getLevel() {
		return 0;
	}

	@Override
	public String getName() {
		return "Horse Integration";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.TILE_HORSES.sprite();
	}

	@Override
	public float getCost() {
		return 20;
	}

	@Override
	public String getDesc() {
		return "25% Production bonus to\nmounted units.";
	}

	@Override
	protected void onStudied() {
		for (City city : Civilization.getInstance().getGame().getPlayer().getOwnedCities()) {
			for (ProductionItem item : city.getProducibleItemManager().getPossibleItems().values()) {
				if (item instanceof UnitItem) {
					UnitItem unitItem = (UnitItem) item;
					if (unitItem.getUnitItemTypes().contains(UnitType.MOUNTED)) {
						item.setProductionModifier(-0.25F);
					}
				}
			}
		}
	}

	@Override
	public void onSettleCity(SettleCityPacket packet) {
		if (!studied)
			return;

		Tile tile = Civilization.getInstance().getGame().getMap().getTiles()[packet.getGridX()][packet.getGridY()];
		City city = tile.getCity(); // Assume this is called after others (TODO: WE NEED EVENT PRIORITY!!)

		if (!city.getPlayerOwner().equals(Civilization.getInstance().getGame().getPlayer()))
			return;

		for (ProductionItem item : city.getProducibleItemManager().getPossibleItems().values()) {
			if (item instanceof UnitItem) {
				UnitItem unitItem = (UnitItem) item;
				if (unitItem.getUnitItemTypes().contains(UnitType.MOUNTED)) {
					item.setProductionModifier(-0.25F);
				}
			}
		}
	}

}
