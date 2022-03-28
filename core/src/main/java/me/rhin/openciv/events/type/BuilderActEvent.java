package me.rhin.openciv.events.type;

import me.rhin.openciv.game.unit.actions.BuilderAction;
import me.rhin.openciv.shared.listener.Event;

public class BuilderActEvent implements Event {

	private BuilderAction builderAction;

	public BuilderActEvent(BuilderAction builderAction) {
		this.builderAction = builderAction;
	}

	@Override
	public String getMethodName() {
		return "onBuilderAct";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { builderAction };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { builderAction.getClass() };
	}

}
