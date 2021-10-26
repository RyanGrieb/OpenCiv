package me.rhin.openciv.game.unit.type;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.game.research.type.OpticsTech;
import me.rhin.openciv.game.unit.AbstractAction;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitItem.UnitType;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.listener.UnitActListener.UnitActEvent;
import me.rhin.openciv.shared.packet.type.UnitDisembarkPacket;
import me.rhin.openciv.shared.packet.type.UnitEmbarkPacket;

public class TransportShip {

	public static class TransportShipUnit extends Unit {

		public TransportShipUnit(UnitParameter unitParameter) {
			super(unitParameter, TextureEnum.UNIT_TRANSPORT_SHIP);

			customActions.add(new DisembarkAction(this));
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
			return Arrays.asList(UnitType.SUPPORT, UnitType.NAVAL);
		}

		public static class DisembarkAction extends AbstractAction {

			public DisembarkAction(Unit unit) {
				super(unit);
			}

			@Override
			public boolean act(float delta) {
				
				// Send embark packet
				UnitDisembarkPacket packet = new UnitDisembarkPacket();
				packet.setUnit(unit.getID(), unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());

				Civilization.getInstance().getNetworkManager().sendPacket(packet);
				
				Civilization.getInstance().getEventManager().fireEvent(new UnitActEvent(unit));
				unit.removeAction(this);
				return true;
			}

			@Override
			public boolean canAct() {

				boolean adjLandTile = false;
				for (Tile tile : unit.getStandingTile().getAdjTiles())
					if (!tile.containsTileProperty(TileProperty.WATER) && tile.getUnits().size() < 1
							&& tile.getMovementCost(unit.getStandingTile()) < 100)
						adjLandTile = true;

				return unit.getCurrentMovement() > 0
						&& unit.getPlayerOwner().getResearchTree().hasResearched(OpticsTech.class) && adjLandTile;
			}

			@Override
			public String getName() {
				return "Disembark";
			}

			@Override
			public TextureEnum getSprite() {
				return TileType.GRASS.getTextureEnum();
			}
		}
	}
}
