package me.rhin.openciv.server.game.city.building.type;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.research.type.MasonryTech;
import me.rhin.openciv.shared.packet.type.SetCityHealthPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class Walls extends Building {

	public Walls(City city) {
		super(city);
	}

	@Override
	public StatLine getStatLine() {
		StatLine statLine = new StatLine();

		statLine.addValue(Stat.MAINTENANCE, 1);

		return statLine;
	}

	@Override
	public void create() {
		super.create();

		Json json = new Json();

		city.setMaxHealth(city.getMaxHealth() + 50);
		city.setCombatStrength(city.getCombatStrength() + 5);

		SetCityHealthPacket cityHealthPacket = new SetCityHealthPacket();
		cityHealthPacket.setCity(city.getName(), city.getHealth(), city.getMaxHealth(), city.getCombatStrength());

		for (Player player : Server.getInstance().getPlayers()) {
			player.getConn().send(json.toJson(cityHealthPacket));
		}
	}

	@Override
	public boolean meetsProductionRequirements() {
		return city.getPlayerOwner().getResearchTree().hasResearched(MasonryTech.class);
	}

	@Override
	public float getGoldCost() {
		return 150;
	}

	@Override
	public float getBuildingProductionCost() {
		return 75;
	}

	@Override
	public String getName() {
		return "Walls";
	}

}
