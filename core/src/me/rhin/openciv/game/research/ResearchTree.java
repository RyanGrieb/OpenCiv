package me.rhin.openciv.game.research;

import java.util.ArrayList;
import java.util.HashMap;

import me.rhin.openciv.game.city.building.type.Granary;

public class ResearchTree {

	private HashMap<Class<? extends Technology>, Technology> technologies;

	public ResearchTree() {
		this.technologies = new HashMap<>();
	}

	public ArrayList<Technology> getTechnologies() {
		return (ArrayList<Technology>) technologies.values();
	}

	public boolean hasResearched(Class<Granary> technologyClass) {
		return false;
	}

}
