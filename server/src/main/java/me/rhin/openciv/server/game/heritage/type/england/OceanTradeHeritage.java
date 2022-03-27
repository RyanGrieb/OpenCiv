package me.rhin.openciv.server.game.heritage.type.england;

import org.java_websocket.WebSocket;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.stat.Stat;

public class OceanTradeHeritage extends Heritage implements Listener {

	public OceanTradeHeritage(AbstractPlayer player) {
		super(player);

		Server.getInstance().getEventManager().addListener(this);
	}

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Ocean Trade";
	}

	@Override
	public float getCost() {
		return 40;
	}

	@Override
	protected void onStudied() {
		int costalCities = 0;
		for (City playerCity : player.getOwnedCities())
			if (playerCity.isCoastal())
				costalCities++;

		// Every 2 coastal cities, add a trade route.
		int tradeRoutes = costalCities / 2;
		player.getStatLine().addValue(Stat.MAX_TRADE_ROUTES, tradeRoutes);
		player.updateOwnedStatlines(false);
	}

	@EventHandler
	public void onSettleCity(WebSocket conn, SettleCityPacket packet) {

		if (!isStudied())
			return;

		Tile tile = Server.getInstance().getMap().getTiles()[packet.getGridX()][packet.getGridY()];
		City city = tile.getCity();

		if (!city.isCoastal() || !city.getPlayerOwner().equals(player))
			return;

		int costalCities = 0;
		for (City playerCity : player.getOwnedCities())
			if (playerCity.isCoastal())
				costalCities++;

		// Every 2 coastal cities, add a trade route.
		if (costalCities % 2 == 0) {
			player.getStatLine().addValue(Stat.MAX_TRADE_ROUTES, 1);
			player.updateOwnedStatlines(false);
		}
	}
}
