package me.rhin.openciv.server.game.heritage.type.all;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.heritage.Heritage;
import me.rhin.openciv.shared.packet.type.SetCityHealthPacket;

public class CapitalDefenseHeritage extends Heritage {

	public CapitalDefenseHeritage(AbstractPlayer player) {
		super(player);
	}

	@Override
	public int getLevel() {
		return 1;
	}

	@Override
	public String getName() {
		return "Capital Defense";
	}

	@Override
	public float getCost() {
		return 20;
	}

	@Override
	protected void onStudied() {

		Json json = new Json();

		City city = player.getCapitalCity();
		float healthIncrease = city.getMaxHealth() * 0.33F;

		city.setMaxHealth(city.getMaxHealth() + healthIncrease);

		SetCityHealthPacket cityHealthPacket = new SetCityHealthPacket();
		cityHealthPacket.setCity(city.getName(), city.getHealth(), city.getMaxHealth(), city.getCombatStrength());

		for (Player player : Server.getInstance().getPlayers()) {
			player.getConn().send(json.toJson(cityHealthPacket));
		}

	}

}
