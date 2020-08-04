package me.rhin.openciv.server.game.city.specialist;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.city.SpecialistType;

public abstract class Specialist {

	private City city;
	
	public Specialist(City city) {
		this.city = city;
	}

	public abstract void onClick();
	
	public abstract SpecialistType getSpecialistType();
}
