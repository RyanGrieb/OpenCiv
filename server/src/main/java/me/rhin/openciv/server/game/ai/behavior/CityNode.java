package me.rhin.openciv.server.game.ai.behavior;

import me.rhin.openciv.server.game.city.City;

public abstract class CityNode extends Node {

	protected City city;

	public CityNode(City city, String name) {
		super(name);
		this.city = city;
	}
}
