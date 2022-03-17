package me.rhin.openciv.server.game.heritage.type.mongolia;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;
import me.rhin.openciv.server.listener.SettleCityListener;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;

public class HorseIntegrationHeritage extends Heritage implements SettleCityListener {

	public HorseIntegrationHeritage(AbstractPlayer player) {
		super(player);

		Server.getInstance().getEventManager().addListener(SettleCityListener.class, this);
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
	public float getCost() {
		return 20;
	}

	@Override
	protected void onStudied() {
		for (City city : player.getOwnedCities()) {
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
				if (unitItem.getUnitItemTypes().contains(UnitType.MOUNTED)) {
					item.setProductionModifier(-0.25F);
				}
			}
		}
	}

}
