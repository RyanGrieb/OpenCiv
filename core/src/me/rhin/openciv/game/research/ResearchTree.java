package me.rhin.openciv.game.research;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import me.rhin.openciv.game.research.type.AnimalHusbandryTech;
import me.rhin.openciv.game.research.type.ArcheryTech;
import me.rhin.openciv.game.research.type.MiningTech;
import me.rhin.openciv.game.research.type.PotteryTech;
import me.rhin.openciv.game.research.type.SailingTech;

public class ResearchTree {

	private LinkedHashMap<Class<? extends Technology>, Technology> technologies;

	public ResearchTree() {
		this.technologies = new LinkedHashMap<>();

		// FIXME: This is going to be a crappton of techs
		technologies.put(PotteryTech.class, new PotteryTech());
		technologies.put(AnimalHusbandryTech.class, new AnimalHusbandryTech());
		technologies.put(ArcheryTech.class, new ArcheryTech());
		technologies.put(MiningTech.class, new MiningTech());
		technologies.put(SailingTech.class, new SailingTech());
	}

	public List<Technology> getTechnologies() {
		// FIXME: This seems dumb
		return new ArrayList<>(technologies.values());
	}

	public <T extends Technology> boolean hasResearched(Class<T> technologyClass) {
		return technologies.get(technologyClass).isResearched();
	}

	public Technology getTechnology(Class<? extends Technology> clazz) {
		return technologies.get(clazz);
	}

}
