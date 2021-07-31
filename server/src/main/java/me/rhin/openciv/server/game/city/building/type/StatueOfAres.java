package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.wonders.Wonder;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.research.type.BronzeWorkingTech;
import me.rhin.openciv.server.game.unit.RangedUnit;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.UnitFinishedMoveListener;
import me.rhin.openciv.shared.stat.Stat;

public class StatueOfAres extends Building implements Wonder, UnitFinishedMoveListener {

	public StatueOfAres(City city) {
		super(city);

		this.statLine.addValue(Stat.HERITAGE_GAIN, 1);

		Server.getInstance().getEventManager().addListener(UnitFinishedMoveListener.class, this);

		// FIXME: When we capture a city, we need to update those units inside the
		// captured enemy city.
	}

	@Override
	public void create() {
		super.create();
		Server.getInstance().getGame().getWonders().setBuilt(getClass());
	}

	@Override
	public void onUnitFinishMove(Tile prevTile, Unit unit) {

		if (!unit.getPlayerOwner().equals(city.getPlayerOwner()))
			return;

		boolean inEnemyTerritory = true;

		if (unit.getStandingTile().getTerritory() == null) {
			inEnemyTerritory = false;
		}

		City city = unit.getStandingTile().getTerritory();

		if (city != null && city.getPlayerOwner().equals(this.city.getPlayerOwner())) {
			inEnemyTerritory = false;
		}

		boolean prevTileFriendly = prevTile.getTerritory() == null
				|| prevTile.getTerritory().getPlayerOwner().equals(this.city.getPlayerOwner());

		// If we moved out of enemy territory
		if (!prevTileFriendly && !inEnemyTerritory) {
			// System.out.println("Moved out of enemy territory.");

			unit.getCombatStatLine().addModifier(Stat.COMBAT_STRENGTH, -0.15F);
			if (unit instanceof RangedUnit) {
				((RangedUnit) unit).getRangedCombatStatLine().addModifier(Stat.COMBAT_STRENGTH, -0.15F);
			}

			return;
		}

		// If we moved into enemy territory
		if (prevTileFriendly && inEnemyTerritory) {
			// System.out.println("Moved into enemy territory.");

			unit.getCombatStatLine().addModifier(Stat.COMBAT_STRENGTH, 0.15F);
			if (unit instanceof RangedUnit) {
				((RangedUnit) unit).getRangedCombatStatLine().addModifier(Stat.COMBAT_STRENGTH, 0.15F);
			}

			return;
		}
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(BronzeWorkingTech.class)
				&& !Server.getInstance().getGame().getWonders().isBuilt(getClass());
	}

	@Override
	public float getGoldCost() {
		return -1;
	}

	@Override
	public float getBuildingProductionCost() {
		return 185;
	}

	@Override
	public String getName() {
		return "Statue Of Ares";
	}
}
