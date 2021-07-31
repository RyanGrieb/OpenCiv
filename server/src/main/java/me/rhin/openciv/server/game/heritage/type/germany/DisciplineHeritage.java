package me.rhin.openciv.server.game.heritage.type.germany;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;
import me.rhin.openciv.server.listener.SettleCityListener;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;

public class DisciplineHeritage extends Heritage implements SettleCityListener {

	public DisciplineHeritage(Player player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Military Discipline";
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	protected void onStudied() {
		for (City city : player.getOwnedCities()) {
			for (ProductionItem item : city.getProducibleItemManager().getPossibleItems().values()) {
				if (item instanceof UnitItem) {
					UnitItem unitItem = (UnitItem) item;
					if (unitItem.getUnitItemTypes().contains(UnitType.MELEE)
							|| (unitItem.getUnitItemTypes().contains(UnitType.RANGED))) {
						item.setProductionModifier(-0.1F);
					}
				}
			}
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
			if (item instanceof UnitItem) {
				UnitItem unitItem = (UnitItem) item;
				if (unitItem.getUnitItemTypes().contains(UnitType.MELEE)
						|| (unitItem.getUnitItemTypes().contains(UnitType.RANGED))) {
					item.setProductionModifier(-0.1F);
				}
			}
		}
	}
}
