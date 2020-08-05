package me.rhin.openciv.server.game.city.specialist;

import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.shared.city.SpecialistType;

public class UnemployedSpecialist extends Specialist {

	public UnemployedSpecialist(City city) {
		super(city);
	}

	@Override
	public void onClick() {
		
	}

	@Override
	public SpecialistType getSpecialistType() {
		return SpecialistType.UNEMPLOYED;
	}

}
