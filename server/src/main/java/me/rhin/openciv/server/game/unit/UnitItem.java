package me.rhin.openciv.server.game.unit;

import java.util.List;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.production.ProductionItem;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.stat.StatValue;

public abstract class UnitItem implements ProductionItem {

	public static enum UnitType {
		MELEE,
		RANGED,
		SUPPORT,
		MOUNTED,
		NAVAL;
	}

	protected City city;
	protected float productionModifier;

	public UnitItem(City city) {
		this.city = city;
		this.productionModifier = 0;
	}

	public abstract float getUnitProductionCost();

	public abstract List<UnitType> getUnitItemTypes();

	@SuppressWarnings("unchecked")
	@Override
	public void create() {
		Tile tile = city.getOriginTile();

		Unit unit = null;

		try {
			Class<? extends Unit> unitClass = (Class<? extends Unit>) Class
					.forName(getClass().getName() + "$" + getClass().getSimpleName() + "Unit");

			unit = (Unit) unitClass.getConstructor(AbstractPlayer.class, Tile.class).newInstance(city.getPlayerOwner(),
					city.getOriginTile());
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

	@Override
	public float getProductionCost() {
		StatValue prodModifier = new StatValue(getUnitProductionCost(), productionModifier);

		return prodModifier.getValue();
	}

	@Override
	public void setProductionModifier(float modifier) {
		this.productionModifier = modifier;
	}

	public float getProductionModifier() {
		return productionModifier;
	}
}
