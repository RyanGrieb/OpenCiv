package me.rhin.openciv.server.game.unit;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public abstract class RangedUnit extends Unit {

	protected StatLine rangedCombatStrength;

	public RangedUnit(AbstractPlayer playerOwner, Tile standingTile) {
		super(playerOwner, standingTile);

		this.rangedCombatStrength = new StatLine();
	}

	public float getRangedCombatStrength(AttackableEntity target) {
		return rangedCombatStrength.getStatValue(Stat.COMBAT_STRENGTH);
	}

	public StatLine getRangedCombatStatLine() {
		return rangedCombatStrength;
	}

	//FIXME: Merge some of this code w/ mele attack
	public void rangeAttack(AttackableEntity targetEntity) {

		if (targetEntity.getPlayerOwner().equals(playerOwner))
			return;

		reduceMovement(2);

		Json json = new Json();
		float unitDamage = 0; // A shooting unit takes no damage
		float targetDamage = targetEntity.getDamageTaken(this, true);

		onCombat();
		targetEntity.onCombat();

		setHealth(getHealth() - unitDamage);
		targetEntity.setHealth(targetEntity.getHealth() - targetDamage);

		// If our ranged unit reduces the city below health, just set it to the min
		// amount.
		if (targetEntity instanceof City && targetEntity.getHealth() < 0) {
			targetEntity.setHealth(1);
		}

		if (targetEntity.getHealth() > 0) {
			UnitAttackPacket attackPacket = new UnitAttackPacket();
			attackPacket.setUnitLocations(getTile().getGridX(), getTile().getGridY(), targetEntity.getTile().getGridX(),
					targetEntity.getTile().getGridY());
			attackPacket.setUnitDamage(unitDamage);
			attackPacket.setTargetDamage(targetDamage);
			attackPacket.setIDs(getID(), targetEntity.getID());

			for (Player player : Server.getInstance().getPlayers()) {
				player.sendPacket(json.toJson(attackPacket));
			}
		}

		if (targetEntity.getHealth() <= 0) {
			if (targetEntity instanceof Unit && targetEntity.getTile().getCity() == null) {

				Unit targetUnit = (Unit) targetEntity;
				
				targetUnit.deleteUnit(DeleteUnitOptions.PLAYER_KILL);
			}
		}

		if (!playerOwner.getDiplomacy().atWar(targetEntity.getPlayerOwner()))
			playerOwner.getDiplomacy().declareWar(targetEntity.getPlayerOwner());

	}
}
