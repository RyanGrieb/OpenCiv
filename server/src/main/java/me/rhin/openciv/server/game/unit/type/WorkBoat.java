package me.rhin.openciv.server.game.unit.type;

import java.util.Arrays;
import java.util.List;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.map.tile.TileType.TileProperty;
import me.rhin.openciv.server.game.map.tile.improvement.TileImprovement;
import me.rhin.openciv.server.game.research.type.SailingTech;
import me.rhin.openciv.server.game.unit.DeleteUnitOptions;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.UnitItem;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.stat.Stat;

public class WorkBoat extends UnitItem {

	public WorkBoat(City city) {
		super(city);
	}

	public static class WorkBoatUnit extends Unit {

		public WorkBoatUnit(AbstractPlayer playerOwner, Tile standingTile) {
			super(playerOwner, standingTile);

			combatStrength.setValue(Stat.COMBAT_STRENGTH, 0);
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

		public void improveTile(String improvementName) {

			TileImprovement improvement = standingTile.getBaseTileType().getImprovement(improvementName);
			improvement.setTile(standingTile);

			if (improvement.getRequiredTech() != null
					&& !playerOwner.getResearchTree().hasResearched(improvement.getRequiredTech()))
				return;

			// FIXME: Redundant code from Tile
			improvement.improveTile();

			City city = standingTile.getCity();

			if (city != null) {
				city.addMorale(standingTile.getStatLine().getStatValue(Stat.MORALE));
				city.updateWorkedTiles();
			}

			// Delete the workboat
			deleteUnit(DeleteUnitOptions.SERVER_DELETE);

		}

		@Override
		public String getName() {
			return "Work Boat";
		}
	}

	@Override
	public float getUnitProductionCost() {
		return 30;
	}

	@Override
	public float getGoldCost() {
		return 150;
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.isCoastal() && city.getPlayerOwner().getResearchTree().hasResearched(SailingTech.class);
	}

	@Override
	public String getName() {
		return "Work Boat";
	}

	@Override
	public List<UnitType> getUnitItemTypes() {
		return Arrays.asList(UnitType.SUPPORT, UnitType.NAVAL);
	}

	@Override
	public float getBaseCombatStrength() {
		return 0;
	}
}