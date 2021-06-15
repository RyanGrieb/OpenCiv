package me.rhin.openciv.game.unit.type;

import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.AbstractAction;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;

public class Settler extends UnitItem {

	public static class SettlerUnit extends Unit {
		public SettlerUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_SETTLER);
			customActions.add(new SettleAction(this));
			this.canAttack = false;
		}

		@Override
		public int getMovementCost(Tile prevTile, Tile tile) {
			if (tile.containsTileProperty(TileProperty.WATER))
				return 1000000;
			else
				return tile.getMovementCost(prevTile);
		}

		@Override
		public int getCombatStrength() {
			return 0;
		}
	}

	public static class SettleAction extends AbstractAction {

		public SettleAction(Actor actor) {
			super(actor);
		}

		@Override
		public boolean act(float delta) {
			// FIXME: Cancel the act if the unit's movement < 1
			Unit unit = (Unit) actor;
			unit.getPlayerOwner().unselectUnit();
			SettleCityPacket packet = new SettleCityPacket();
			packet.setLocation(unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());
			Civilization.getInstance().getNetworkManager().sendPacket(packet);
			return true;
		}

		@Override
		public boolean canAct() {
			Unit unit = (Unit) actor;
			if (unit.getCurrentMovement() < 1) {
				unit.removeAction(this);
				return false;
			}
			return true;
		}
	}

	@Override
	public int getProductionCost() {
		return 80;
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
	public TextureEnum getTexture() {
		return TextureEnum.UNIT_SETTLER;
	}
}
