package me.rhin.openciv.game.unit.type;

import com.badlogic.gdx.scenes.scene2d.Action;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitParameter;

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
			System.out.println("Settle act!");
			Unit unit = (Unit) actor;
			unit.getPlayerOwner().unselectUnit();
			// Fire packet here?
			return true;
		}
	}
}
