package me.rhin.openciv.game.city.specialist;

import me.rhin.openciv.shared.city.SpecialistType;

public interface SpecialistContainer {

	public void addSpecialist();

	public void removeSpecialist();
	
	public int getSpecialistSlots();

	public SpecialistType getSpecialistType();
	
	public String getName();

}
