package me.rhin.openciv.game.unit.actions.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.ImprovementType;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.research.type.WheelTech;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.actions.AbstractAction;
import me.rhin.openciv.game.unit.type.Builder.BuilderUnit;
import me.rhin.openciv.listener.UnitActListener.UnitActEvent;
import me.rhin.openciv.shared.packet.type.WorkTilePacket;

public class RoadAction extends AbstractAction {

	public RoadAction(Unit unit) {
		super(unit);
	}

	@Override
	public boolean act(float delta) {
		// unit.getPlayerOwner().unselectUnit();
		unit.reduceMovement(2);

		BuilderUnit builderUnit = (BuilderUnit) unit;
		builderUnit.setBuilding(true);
		builderUnit.setImprovementType(ImprovementType.ROAD);

		WorkTilePacket packet = new WorkTilePacket();
		packet.setTile("road", unit.getID(), unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
		// unit.removeAction(this);

		Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

		unit.removeAction(this);
		return true;
	}

	@Override
	public boolean canAct() {
		Tile tile = unit.getStandingTile();

		if (!unit.getPlayerOwner().getResearchTree().hasResearched(WheelTech.class)) {
			return false;
		}

		BuilderUnit builderUnit = (BuilderUnit) unit;
		if (unit.getCurrentMovement() < 1 || builderUnit.isBuilding()) {
			return false;
		}

		if (tile.containsTileType(TileType.ROAD))
			return false;

		return true;
	}

	@Override
	public String getName() {
		return "Road";
	}

	@Override
	public TextureEnum getSprite() {
		// TODO Auto-generated method stub
		return TextureEnum.ROAD_HORIZONTAL;
	}
}