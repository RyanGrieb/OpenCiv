package me.rhin.openciv.game.research;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;

public abstract class Technology {

	protected ArrayList<Class<? extends Technology>> requiredTechs;

	private boolean researched;

	public Technology() {
		this.requiredTechs = new ArrayList<>();
		this.researched = false;
	}

	public static Technology fromID(int techID) {
		return Civilization.getInstance().getGame().getPlayer().getResearchTree().getTechnologies().get(techID);
	}

	public abstract int getScienceCost();

	public abstract String getName();

	public boolean isResearched() {
		return researched;
	}

	public ArrayList<Class<? extends Technology>> getRequiredTechs() {
		return requiredTechs;
	}

	public boolean hasResearchedRequiredTechs() {
		for (Class<? extends Technology> techClazz : requiredTechs) {
			Technology tech = Civilization.getInstance().getGame().getPlayer().getResearchTree()
					.getTechnology(techClazz);

			if (!tech.isResearched())
				return false;
		}

		return true;
	}
}
