package me.rhin.openciv.server.game.ai.behavior.nodes;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.ai.behavior.BehaviorResult;
import me.rhin.openciv.server.game.ai.behavior.BehaviorStatus;
import me.rhin.openciv.server.game.ai.behavior.CityNode;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.civilization.type.Barbarians;

public class WeakerThanEnemyNode extends CityNode {

	public WeakerThanEnemyNode(City city, String name) {
		super(city, name);
	}

	@Override
	public BehaviorResult tick() {

		// Compares enemy combat strength to ourselves.
		float enemyCombatStrength = 0;
		for (AbstractPlayer enemyPlayer : city.getPlayerOwner().getDiplomacy().getEnemies()) {

			if (enemyPlayer.getCiv() instanceof Barbarians)
				continue;

			enemyCombatStrength += enemyPlayer.getTotalCombatStrength();
		}

		if (enemyCombatStrength > city.getPlayerOwner().getTotalCombatStrength())
			return new BehaviorResult(BehaviorStatus.SUCCESS, this);

		return new BehaviorResult(BehaviorStatus.FAILURE, this);
	}

}
