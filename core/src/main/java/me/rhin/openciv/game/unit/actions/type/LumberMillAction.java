package me.rhin.openciv.game.unit.actions.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.ImprovementType;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.ConstructionTech;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.actions.BuilderAction;
import me.rhin.openciv.game.unit.type.Builder.BuilderUnit;
import me.rhin.openciv.listener.UnitActListener.UnitActEvent;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;

public class LumberMillAction extends BuilderAction {

	public LumberMillAction(Unit unit) {
		super(unit);
	}

	@Override
	public boolean act(float delta) {
		super.act(delta);

		unit.reduceMovement(2);

		BuilderUnit builderUnit = (BuilderUnit) unit;
		builderUnit.setBuilding(true);
		builderUnit.setImprovementType(ImprovementType.LUMBER_MILL);

		WorkTilePacket packet = new WorkTilePacket();
		packet.setTile("lumbermill", unit.getID(), unit.getStandingTile().getGridX(),
				unit.getStandingTile().getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);

		Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

		unit.removeAction(this);
		return true;
	}

	@Override
	public boolean canAct() {

		if (!unit.getPlayerOwner().getResearchTree().hasResearched(ConstructionTech.class)) {
			return false;
		}

		Tile tile = unit.getStandingTile();
		boolean farmableTile = !tile.isImproved() && !tile.containsTileProperty(TileProperty.RESOURCE)
				&& tile.getBaseTileType() == TileType.FOREST && tile.getTerritory() != null
				&& tile.getTerritory().getPlayerOwner().equals(unit.getPlayerOwner());

		BuilderUnit builderUnit = (BuilderUnit) unit;
		if (unit.getCurrentMovement() < 1 || !farmableTile || builderUnit.isBuilding()) {
			return false;
		}

		return true;
	}

	@Override
	public String getName() {
		return "Lumber Mill";
	}

	@Override
	public TextureEnum getSprite() {
		return TextureEnum.TILE_LUMBERMILL;
	}
}