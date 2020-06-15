package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.game.AbstractAction;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.ui.button.Button;

public class UnitActionButton extends Button {

	private Unit unit;
	private AbstractAction action;

	public UnitActionButton(Unit unit, AbstractAction action, float x, float y, float width, float height) {
		super(action.getClass().getSimpleName().substring(0,
				action.getClass().getSimpleName().length() - "action".length()), x, y, width, height);
		this.unit = unit;
		this.action = action;
	}

	@Override
	public void onClick() {
		if (action.canAct())
			unit.addAction(action);
	}

}
