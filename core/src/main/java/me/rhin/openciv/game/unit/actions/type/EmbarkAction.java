package me.rhin.openciv.game.unit.actions.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.events.type.UnitActEvent;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.research.type.OpticsTech;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem.UnitType;
import me.rhin.openciv.game.unit.actions.AbstractAction;
import me.rhin.openciv.shared.packet.type.UnitEmbarkPacket;

public class EmbarkAction extends AbstractAction {

	public EmbarkAction(Unit unit) {
		super(unit);
	}

	@Override
	public boolean act(float delta) {

		// Send embark packet
		UnitEmbarkPacket packet = new UnitEmbarkPacket();
		packet.setUnit(unit.getID(), unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());

		Civilization.getInstance().getNetworkManager().sendPacket(packet);

		Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));

		unit.removeAction(this);
		return true;
	}

	@Override
	public boolean canAct() {
		if (!unit.allowsMovement())
			return false;

		if (unit.getUnitTypes().contains(UnitType.NAVAL))
			return false;

		boolean adjOceanTile = false;
		for (Tile tile : unit.getStandingTile().getAdjTiles())
			if (tile.containsTileType(TileType.SHALLOW_OCEAN) && tile.getUnits().size() < 1)
				adjOceanTile = true;

		return unit.getCurrentMovement() > 0 && unit.getPlayerOwner().getResearchTree().hasResearched(OpticsTech.class)
				&& adjOceanTile;
	}

	@Override
	public String getName() {
		return "Embark";
	}

	@Override
	public TextureEnum getSprite() {
		return TextureEnum.UNIT_TRANSPORT_SHIP;
	}
}