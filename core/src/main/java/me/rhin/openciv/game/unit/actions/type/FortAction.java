package me.rhin.openciv.game.unit.actions.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.events.type.UnitActEvent;
import me.rhin.openciv.game.heritage.type.rome.DefensiveLogisticsHeritage;
import me.rhin.openciv.game.map.tile.ImprovementType;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.actions.BuilderAction;
import me.rhin.openciv.game.unit.type.Builder.BuilderUnit;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;

public class FortAction extends BuilderAction {

	public FortAction(Unit unit) {
		super(unit);
	}

	@Override
	public boolean act(float delta) {
		super.act(delta);
		
		// unit.getPlayerOwner().unselectUnit();
		unit.reduceMovement(2);

		BuilderUnit builderUnit = (BuilderUnit) unit;
		builderUnit.setBuilding(true);
		builderUnit.setImprovementType(ImprovementType.FORT);

		WorkTilePacket packet = new WorkTilePacket();
		packet.setTile("fort", unit.getID(), unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
		// unit.removeAction(this);

		Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

		unit.removeAction(this);
		return true;
	}

	@Override
	public boolean canAct() {
		Tile tile = unit.getStandingTile();

		if (!unit.getPlayerOwner().getHeritageTree().hasStudied(DefensiveLogisticsHeritage.class)) {
			return false;
		}

		boolean farmableTile = !tile.isImproved() && !tile.containsTileType(TileType.FOREST)
				&& !tile.containsTileType(TileType.JUNGLE);

		BuilderUnit builderUnit = (BuilderUnit) unit;
		if (unit.getCurrentMovement() < 1 || !farmableTile || builderUnit.isBuilding()) {
			return false;
		}

		return true;
	}

	@Override
	public String getName() {
		return "Fort";
	}

	@Override
	public TextureEnum getSprite() {
		return TextureEnum.TILE_FORT;
	}
}