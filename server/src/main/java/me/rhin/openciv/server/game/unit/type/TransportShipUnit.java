package me.rhin.openciv.server.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem.UnitType;

public class TransportShipUnit extends Unit {

	private Unit transportUnit;
	
	public TransportShipUnit(AbstractPlayer playerOwner, Unit transportUnit, Tile standingTile) {
		super(playerOwner, standingTile);
		
		this.transportUnit = transportUnit;
	}

	@Override
	public float getMovementCost(Tile prevTile, Tile tile) {
		if (!tile.containsTileProperty(TileProperty.WATER))
			return 1000000;
		else
			return tile.getMovementCost(prevTile);
	}

	@Override
	public List<UnitType> getUnitTypes() {
		return Arrays.asList(UnitType.SUPPORT);
	}

	public String getName() {
		return "Transport Ship";
	}

	public Unit getTransportUnit() {
		return transportUnit;
	}
}