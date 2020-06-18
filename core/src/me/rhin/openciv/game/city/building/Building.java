package me.rhin.openciv.game.city.building;

import me.rhin.openciv.game.city.City;

public abstract class Building {

	private City city;

	public Building(City city) {
		this.city = city;
	}
}
