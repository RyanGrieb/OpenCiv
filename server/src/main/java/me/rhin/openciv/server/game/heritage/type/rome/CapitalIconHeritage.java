package me.rhin.openciv.server.game.heritage.type.rome;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.server.listener.BuildingConstructedListener;
import me.rhin.openciv.server.listener.SettleCityListener;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;

public class CapitalIconHeritage extends Heritage implements SettleCityListener, BuildingConstructedListener {

	public CapitalIconHeritage(AbstractPlayer player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Capital Icon";
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	protected void onStudied() {
		int index = 0;
		for (City city : player.getOwnedCities()) {
			if (index == 0) {
				index++;
				continue;
			}
			for (ProductionItem item : city.getProducibleItemManager().getPossibleItems().values()) {
				if (item instanceof Building) {
					Building building = (Building) item;
					if (player.getCapitalCity().containsBuilding(building.getClass()))
						building.setProductionModifier(-0.25F);
				}
			}

			index++;
		}
	}

	@Override
	public void onSettleCity(WebSocket conn, SettleCityPacket packet) {
		if (!studied)
			return;

		Tile tile = Server.getInstance().getMap().getTiles()[packet.getGridX()][packet.getGridY()];
		City city = tile.getCity(); // Assume this is called after others (TODO: WE NEED EVENT PRIORITY!!)

		if (!city.getPlayerOwner().equals(player))
			return;

		for (ProductionItem item : city.getProducibleItemManager().getPossibleItems().values()) {
			if (item instanceof Building) {
				Building building = (Building) item;
				if (player.getCapitalCity().containsBuilding(building.getClass()))
					building.setProductionModifier(-0.25F);
			}
		}
	}

	@Override
	public void onBuildingConstructed(City city, Building building) {
		if (!studied || !city.getPlayerOwner().getCapitalCity().equals(city))
			return;

		if (!city.getPlayerOwner().equals(player))
			return;

		int index = 0;
		for (City otherCity : player.getOwnedCities()) {
			if (index == 0) {
				index++;
				continue;
			}
			for (ProductionItem item : otherCity.getProducibleItemManager().getPossibleItems().values()) {
				if (item.getClass() == building.getClass()) {
					Building otherBuilding = (Building) item;
					otherBuilding.setProductionModifier(-0.25F);
				}
			}

			index++;
		}
	}
}
