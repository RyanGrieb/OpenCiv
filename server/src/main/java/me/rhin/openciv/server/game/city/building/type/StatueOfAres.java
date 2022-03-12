package me.rhin.openciv.server.game.city.building.type;

import java.util.ArrayList;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.wonders.Wonder;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.research.type.BronzeWorkingTech;
import me.rhin.openciv.server.game.unit.RangedUnit;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.listener.CaptureCityListener;
import me.rhin.openciv.server.listener.UnitFinishedMoveListener;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class StatueOfAres extends Building implements Wonder, UnitFinishedMoveListener, CaptureCityListener {

	public StatueOfAres(City city) {
		super(city);

		Server.getInstance().getEventManager().addListener(UnitFinishedMoveListener.class, this);
		Server.getInstance().getEventManager().addListener(CaptureCityListener.class, this);

		// FIXME: When we capture a city, we need to update those units inside the
		// captured enemy city.
		
		//TODO: Handle territory growth & newly created units.
	}
	
	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.HERITAGE_GAIN, 1);

		return statLine;
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
			// LOGGER.info("Moved out of enemy territory.");
			modifyCombatStrength(unit, -0.15F);
			return;
		}

		// If we moved into enemy territory
		if (prevTileFriendly && inEnemyTerritory) {
			// LOGGER.info("Moved into enemy territory.");
			modifyCombatStrength(unit, 0.15F);
			return;
		}
	}

	@Override
	public void onCaptureCity(City city, AbstractPlayer oldPlayer) {
		ArrayList<Unit> units = new ArrayList<>();

		if (city.getPlayerOwner().hasBuilt(StatueOfAres.class)) {
			units.addAll(city.getPlayerOwner().getOwnedUnits());
		}

		if (oldPlayer.hasBuilt(StatueOfAres.class)) {
			units.addAll(oldPlayer.getOwnedUnits());
		}

		for (Unit unit : units) {
			// If there are units of the old city owner w/ statue of ares buff
			if (unit.getPlayerOwner().equals(oldPlayer)) {
				// Now in enemy territory
				modifyCombatStrength(unit, 0.15F);
			}

			// If there are units of the new city owner w/ statue of ares buff
			if (unit.getPlayerOwner().equals(city.getPlayerOwner())) {
				// Out of enemy territory.
				modifyCombatStrength(unit, -0.15F);
			}
		}
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(BronzeWorkingTech.class)
				&& !Server.getInstance().getInGameState().getWonders().isBuilt(getClass());
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

	private void modifyCombatStrength(Unit unit, float amount) {
		unit.getCombatStatLine().addModifier(Stat.COMBAT_STRENGTH, amount);
		if (unit instanceof RangedUnit) {
			((RangedUnit) unit).getRangedCombatStatLine().addModifier(Stat.COMBAT_STRENGTH, amount);
		}
	}
}
