package me.rhin.openciv.server.game.unit.type;

import java.util.Arrays;
import java.util.List;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.type.Palace;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.server.listener.ServerSettleCityListener.ServerSettleCityEvent;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.RemoveTileTypePacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.packet.type.TerritoryGrowPacket;
import me.rhin.openciv.shared.stat.Stat;

public class Settler extends UnitItem {

	public Settler(City city) {
		super(city);
	}

	public static class SettlerUnit extends Unit {

		public SettlerUnit(AbstractPlayer playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);

			combatStrength.setValue(Stat.COMBAT_STRENGTH, 0);
		}

		@Override
		public float getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public boolean isUnitCapturable() {
			return true;
		}

		@Override
		public List<UnitType> getUnitTypes() {
			return Arrays.asList(UnitType.SUPPORT);
		}

		public void settleCity() {
			settleCity(City.getRandomCityName());
		}

		public void settleCity(String cityName) {

			Tile tile = getStandingTile();

			Json json = new Json();
			if (tile.containsTileType(TileType.FOREST) || tile.containsTileType(TileType.JUNGLE)) {

				TileType type = (tile.containsTileType(TileType.FOREST) ? TileType.FOREST : TileType.JUNGLE);

				RemoveTileTypePacket removeTileTypePacket = new RemoveTileTypePacket();
				removeTileTypePacket.setTile(type.name(), tile.getGridX(), tile.getGridY());

				for (Player player : Server.getInstance().getPlayers())
					player.sendPacket(json.toJson(removeTileTypePacket));
			}

			City city = new City(playerOwner, cityName, tile);
			playerOwner.addCity(city);
			playerOwner.setSelectedUnit(null);

			playerOwner.removeUnit(this);
			tile.removeUnit(this);
			kill();

			SettleCityPacket settleCityPacket = new SettleCityPacket();
			settleCityPacket.setCityName(cityName);
			settleCityPacket.setOwner(playerOwner.getName());
			settleCityPacket.setLocation(standingTile.getGridX(), standingTile.getGridY());

			DeleteUnitPacket deleteUnitPacket = new DeleteUnitPacket();
			deleteUnitPacket.setUnit(getID(), standingTile.getGridX(), standingTile.getGridY());

			for (Player player : Server.getInstance().getPlayers()) {
				player.sendPacket(json.toJson(deleteUnitPacket));
				player.sendPacket(json.toJson(settleCityPacket));

				for (Tile territoryTile : city.getTerritory()) {
					if (territoryTile == null)
						continue;
					TerritoryGrowPacket territoryGrowPacket = new TerritoryGrowPacket();
					territoryGrowPacket.setCityName(city.getName());
					territoryGrowPacket.setLocation(territoryTile.getGridX(), territoryTile.getGridY());
					territoryGrowPacket.setOwner(city.getPlayerOwner().getName());
					player.sendPacket(json.toJson(territoryGrowPacket));
				}
			}

			city.addBuilding(new Palace(city));
			city.updateWorkedTiles();

			city.getPlayerOwner().updateOwnedStatlines(false);

			Server.getInstance().getEventManager().fireEvent(new ServerSettleCityEvent(city));
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 80;
	}

	@Override
	public float getGoldCost() {
		return 250;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return true;
	}

	@Override
	public String getName() {
		return "Settler";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.SUPPORT);
	}

	@Override
	public float getBaseCombatStrength() {

		return 0;
	}
}
