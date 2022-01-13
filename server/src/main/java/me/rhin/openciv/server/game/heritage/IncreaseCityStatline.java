package me.rhin.openciv.server.game.heritage;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.stat.StatLine;

public interface IncreaseCityStatline {
	
	public StatLine getStatLine(City city);
	
}
