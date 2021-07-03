package me.rhin.openciv.server.game.unit;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;

public abstract class UnitItem implements ProductionItem {

	protected City city;

	public UnitItem(City city) {
		this.city = city;
	}

	@SuppressWarnings("unchecked")
	@Override
	public void create(City city) {
		Tile tile = city.getOriginTile();

		Unit unit = null;

		try {
			Class<? extends Unit> unitClass = (Class<? extends Unit>) Class
					.forName(getClass().getName() + "$" + getClass().getSimpleName() + "Unit");

			unit = (Unit) unitClass.getConstructor(city.getPlayerOwner().getClass(), city.getOriginTile().getClass())
					.newInstance(city.getPlayerOwner(), city.getOriginTile());
		} catch (Exception e) {
			e.printStackTrace();
		}

		tile.addUnit(unit);

		AddUnitPacket addUnitPacket = new AddUnitPacket();
		addUnitPacket.setUnit(unit.getPlayerOwner().getName(), getName(), unit.getID(), tile.getGridX(),
				tile.getGridY());

		Json json = new Json();
		for (Player player : Server.getInstance().getPlayers())
			player.getConn().send(json.toJson(addUnitPacket));
	}

}
