package me.rhin.openciv.events.type;

import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.shared.listener.Event;

public class PickResearchEvent implements Event {

	private Technology tech;

	public PickResearchEvent(Technology tech) {
		this.tech = tech;
	}

	@Override
	public String getMethodName() {
		return "onPickResearch";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { tech };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { Technology.class };
	}

}
