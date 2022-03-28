package me.rhin.openciv.server.scenarios.type;

import com.badlogic.gdx.math.MathUtils;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.events.type.StartGameRequestEvent;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.ai.AIPlayer;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.options.GameOptionType;
import me.rhin.openciv.server.scenarios.Scenario;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;

public class CityStateAITestScenario extends Scenario implements Listener {

	@Override
	public void toggle() {

		Server.getInstance().getGameOptions().setOptionValue(GameOptionType.MAP_LENGTH, 0);
		Server.getInstance().getGameOptions().setOptionValue(GameOptionType.BARBARIAN_AMOUNT, 0);
		Server.getInstance().getGameOptions().setOptionValue(GameOptionType.CITY_STATE_AMOUNT, 1);

		Server.getInstance().getEventManager().addListener(this);

		Server.getInstance().getEventManager().fireEvent(new StartGameRequestEvent());
	}

	@Override
	public boolean preGameOnly() {
		return true;
	}

	@EventHandler
	public void onPlayerSpawnsSet() {

		Player player = Server.getInstance().getPlayers().get(0);
		AIPlayer aiPlayer = Server.getInstance().getAIPlayers().get(0);

		Tile tile = null;

		while (tile == null || !Server.getInstance().getMap().isSafeSpawnTile(tile)) {
			int rndX = 0;
			int rndY = 0;

			while (rndX == 0 || rndY == 0 || aiPlayer.getSpawnX() + rndX >= Server.getInstance().getMap().getWidth()
					|| aiPlayer.getSpawnY() + rndY >= Server.getInstance().getMap().getHeight()
					|| aiPlayer.getSpawnX() + rndX < 0 || aiPlayer.getSpawnY() + rndY < 0) {
				rndX = MathUtils.random(-3, 3);
				rndY = MathUtils.random(-3, 3);
			}

			// FIXME: Correct any out of bounds exceptions here
			tile = Server.getInstance().getMap().getTiles()[aiPlayer.getSpawnX() + rndX][aiPlayer.getSpawnY() + rndY];
		}

		player.setSpawnPos(tile.getGridX(), tile.getGridY());
	}

}
