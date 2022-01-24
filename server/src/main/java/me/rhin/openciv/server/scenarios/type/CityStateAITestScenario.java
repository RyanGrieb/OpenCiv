package me.rhin.openciv.server.scenarios.type;

import java.util.Random;

import com.badlogic.gdx.math.MathUtils;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.ai.AIPlayer;
import me.rhin.openciv.server.game.map.tile.Tile;
import me.rhin.openciv.server.game.options.GameOptionType;
import me.rhin.openciv.server.listener.PlayersSpawnsSetListener;
import me.rhin.openciv.server.listener.StartGameRequestListener.StartGameRequestEvent;
import me.rhin.openciv.server.scenarios.Scenario;

public class CityStateAITestScenario extends Scenario implements PlayersSpawnsSetListener {

	@Override
	public void toggle() {

		Server.getInstance().getGameOptions().setOptionValue(GameOptionType.MAP_LENGTH, 0);
		Server.getInstance().getGameOptions().setOptionValue(GameOptionType.BARBARIAN_AMOUNT, 0);
		Server.getInstance().getGameOptions().setOptionValue(GameOptionType.CITY_STATE_AMOUNT, 1);

		Server.getInstance().getEventManager().addListener(PlayersSpawnsSetListener.class, this);

		Server.getInstance().getEventManager().fireEvent(new StartGameRequestEvent());
	}

	@Override
	public boolean preGameOnly() {
		return true;
	}

	@Override
	public void onPlayersSpawnSet() {

		Player player = Server.getInstance().getPlayers().get(0);
		AIPlayer aiPlayer = Server.getInstance().getAIPlayers().get(0);

		System.out.println(Server.getInstance().getAIPlayers());

		Tile tile = null;

		while (tile == null || !Server.getInstance().getMap().isSafeSpawnTile(tile)) {
			int rndX = 0;
			int rndY = 0;

			while (rndX == 0 || rndY == 0) {
				rndX = MathUtils.random(-3, 3);
				rndY = MathUtils.random(-3, 3);
			}
			rndX *= 2;
			rndY *= 2;
			
			//FIXME: Correct any out of bounds exceptions here
			tile = Server.getInstance().getMap().getTiles()[aiPlayer.getSpawnX() + rndX][aiPlayer.getSpawnY() + rndY];
		}

		player.setSpawnPos(tile.getGridX(), tile.getGridY());
	}

}
