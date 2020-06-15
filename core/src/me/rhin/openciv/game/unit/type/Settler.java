package me.rhin.openciv.game.unit.type;

import com.badlogic.gdx.scenes.scene2d.Action;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;

public class Settler extends Unit {

	public Settler(UnitParameter unitParameter) {
		super(unitParameter, TextureEnum.UNIT_SETTLER);
		customActions.add(new SettleAction());
	}

	@Override
	public int getMovementCost(Tile tile) {
		if (tile.getTileType().isWater())
			return 1000000;
		else
			return tile.getTileType().getMovementCost();
	}

	public static class SettleAction extends Action {
		@Override
		public boolean act(float delta) {
			Unit unit = (Unit) actor;
			unit.getPlayerOwner().unselectUnit();
			SettleCityPacket packet = new SettleCityPacket();
			packet.setLocation(unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
			Civilization.getInstance().getNetworkManager().sendPacket(packet);
			return true;
		}
	}
}
