package me.rhin.openciv.game.unit.actions.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.events.type.UnitActEvent;
import me.rhin.openciv.game.map.tile.ImprovementType;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.research.type.BronzeWorkingTech;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.actions.BuilderAction;
import me.rhin.openciv.game.unit.type.Builder.BuilderUnit;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;

public class ClearAction extends BuilderAction {

	public ClearAction(Unit unit) {
		super(unit);
	}

	@Override
	public boolean act(float delta) {
		super.act(delta);

		// unit.getPlayerOwner().unselectUnit();
		unit.reduceMovement(2);

		BuilderUnit builderUnit = (BuilderUnit) unit;
		builderUnit.setBuilding(true);
		builderUnit.setImprovementType(ImprovementType.CLEAR);

		WorkTilePacket packet = new WorkTilePacket();
		packet.setTile("clear", unit.getID(), unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
		// unit.removeAction(this);

		Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

		unit.removeAction(this);
		return true;
	}

	@Override
	public boolean canAct() {
		Tile tile = unit.getStandingTile();

		if (tile.getCity() != null)
			return false;

		if (!unit.getPlayerOwner().getResearchTree().hasResearched(BronzeWorkingTech.class)) {
			return false;
		}

		boolean farmableTile = !tile.isImproved() && tile.containsTileType(TileType.JUNGLE)
				&& tile.getTerritory() != null && tile.getTerritory().getPlayerOwner().equals(unit.getPlayerOwner());

		BuilderUnit builderUnit = (BuilderUnit) unit;
		if (unit.getCurrentMovement() < 1 || !farmableTile || builderUnit.isBuilding()) {
			return false;
		}

		return true;
	}

	@Override
	public String getName() {
		return "Clear";
	}

	@Override
	public TextureEnum getSprite() {
		return TextureEnum.ICON_CHOP;
	}
}
