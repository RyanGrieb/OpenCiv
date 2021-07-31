package me.rhin.openciv.server.game.unit;

import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public abstract class RangedUnit extends Unit {

	protected StatLine rangedCombatStrength;

	public RangedUnit(Player playerOwner, Tile standingTile) {
		super(playerOwner, standingTile);

		this.rangedCombatStrength = new StatLine();
	}

	public float getRangedCombatStrength(AttackableEntity target) {
		return rangedCombatStrength.getStatValue(Stat.COMBAT_STRENGTH);
	}

	public StatLine getRangedCombatStatLine() {
		return rangedCombatStrength;
	}
}
