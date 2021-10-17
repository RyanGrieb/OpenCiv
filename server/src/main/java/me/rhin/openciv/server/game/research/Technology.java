package me.rhin.openciv.server.game.research;

import java.util.ArrayList;

public abstract class Technology {

	protected ArrayList<Class<? extends Technology>> requiredTechs;

	protected ResearchTree researchTree;
	private boolean researched;
	private int id;
	private float appliedScience;
	private TechProperty[] properties;

	public Technology(ResearchTree researchTree, TechProperty... properties) {
		this.researchTree = researchTree;

		this.requiredTechs = new ArrayList<>();
		this.researched = false;
		this.appliedScience = 0;
		this.id = researchTree.getCurrentTechIDIndex();
		this.properties = properties;
	}

	public abstract int getScienceCost();

	public abstract String getName();

	public boolean isResearched() {
		return researched;
	}

	public ArrayList<Class<? extends Technology>> getRequiredTechs() {
		return requiredTechs;
	}

	public int getID() {
		return id;
	}

	public void applyScience(float science) {
		appliedScience += science;
	}

	public float getAppliedScience() {
		return appliedScience;
	}

	public void setResearched(boolean researched) {
		this.researched = researched;

		if (researched)
			onResearched();
	}

	public void onResearched() {
	}

	public boolean canResearch() {

		if (researched)
			return false;

		for (Class<? extends Technology> techClazz : requiredTechs) {
			Technology tech = researchTree.getTechnology(techClazz);

			if (!tech.isResearched())
				return false;
		}

		return true;
	}

	public float getTechValue() {
		float topValue = 0;
		for (TechProperty property : properties) {
			float value = property.ordinal();
			if (topValue < value)
				topValue = value;
		}

		return topValue;
	}

}
