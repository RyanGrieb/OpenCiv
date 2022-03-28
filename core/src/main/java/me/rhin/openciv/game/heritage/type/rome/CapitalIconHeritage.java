package me.rhin.openciv.game.heritage.type.rome;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.building.Building;
import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.production.ProductionItem;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.packet.type.BuildingConstructedPacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;

public class CapitalIconHeritage extends Heritage {

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Capital Icon";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_PRODUCTION.sprite();
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	public String getDesc() {
		return "30% Production bonus for\nbuildings already built\nin the capital.";
	}

	protected void onStudied() {
		int index = 0;
		for (City city : Civilization.getInstance().getGame().getPlayer().getOwnedCities()) {
			if (index == 0) {
				index++;
				continue;
			}
			for (ProductionItem item : city.getProducibleItemManager().getPossibleItems().values()) {
				if (item instanceof Building) {
					Building building = (Building) item;
					if (Civilization.getInstance().getGame().getPlayer().getCapitalCity()
							.containsBuilding(building.getClass())) {
						building.setProductionModifier(-0.25F);
					}
				}
			}

			index++;
		}
	}

	@EventHandler
	public void onSettleCity(SettleCityPacket packet) {
		if (!studied)
			return;

		Tile tile = Civilization.getInstance().getGame().getMap().getTiles()[packet.getGridX()][packet.getGridY()];
		City city = tile.getCity(); // Assume this is called after others (TODO: WE NEED EVENT PRIORITY!!)

		if (!city.getPlayerOwner().equals(Civilization.getInstance().getGame().getPlayer()))
			return;

		for (ProductionItem item : city.getProducibleItemManager().getPossibleItems().values()) {
			if (item instanceof Building) {
				Building building = (Building) item;
				if (Civilization.getInstance().getGame().getPlayer().getCapitalCity()
						.containsBuilding(building.getClass()))
					building.setProductionModifier(-0.25F);
			}
		}
	}

	@EventHandler
	public void onBuildingConstructed(BuildingConstructedPacket packet) {
		City city = Civilization.getInstance().getGame().getPlayer().getCityFromName(packet.getCityName());
		if (!studied || city == null)
			return;

		if (!city.getPlayerOwner().equals(Civilization.getInstance().getGame().getPlayer()))
			return;

		int index = 0;
		for (City otherCity : Civilization.getInstance().getGame().getPlayer().getOwnedCities()) {
			if (index == 0) {
				index++;
				continue;
			}
			for (ProductionItem item : otherCity.getProducibleItemManager().getPossibleItems().values()) {
				if (item.getName().equals(packet.getBuildingName())) {
					Building otherBuilding = (Building) item;
					otherBuilding.setProductionModifier(-0.25F);
				}
			}

			index++;
		}
	}
}
