package me.rhin.openciv.game.unit.actions.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.ImprovementType;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.research.type.MiningTech;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.actions.AbstractAction;
import me.rhin.openciv.game.unit.type.Builder.BuilderUnit;
import me.rhin.openciv.listener.UnitActListener.UnitActEvent;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;

public class ChopAction extends AbstractAction {

	public ChopAction(Unit unit) {
		super(unit);
	}

	@Override
	public boolean act(float delta) {
		// unit.getPlayerOwner().unselectUnit();
		unit.reduceMovement(2);

		BuilderUnit builderUnit = (BuilderUnit) unit;
		builderUnit.setBuilding(true);
		builderUnit.setImprovementType(ImprovementType.CHOP);

		WorkTilePacket packet = new WorkTilePacket();
		packet.setTile("chop", unit.getID(), unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
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

		if (!unit.getPlayerOwner().getResearchTree().hasResearched(MiningTech.class)) {
			return false;
		}

		boolean farmableTile = !tile.isImproved() && tile.containsTileType(TileType.FOREST)
				&& tile.getTerritory() != null
				&& tile.getTerritory().getPlayerOwner().equals(unit.getPlayerOwner());

		BuilderUnit builderUnit = (BuilderUnit) unit;
		if (unit.getCurrentMovement() < 1 || !farmableTile || builderUnit.isBuilding()) {
			return false;
		}

		return true;
	}

	@Override
	public String getName() {
		return "Chop";
	}

	@Override
	public TextureEnum getSprite() {
		return TextureEnum.ICON_CHOP;
	}
}
