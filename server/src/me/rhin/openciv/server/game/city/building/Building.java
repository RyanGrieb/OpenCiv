package me.rhin.openciv.server.game.city.building;

import me.rhin.openciv.server.game.city.City;

public abstract class Building {

	private City city;

	public Building(City city) {
		this.city = city;
	}
	
	public abstract String getName();
}
