package me.rhin.openciv.server.game.city.building.type;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.city.building.Building;

public class Palace extends Building {

	public Palace(City city) {
		super(city);
	}

	@Override
	public String getName() {
		return "Palace";
	}

}
