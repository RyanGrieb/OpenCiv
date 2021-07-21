package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;

public class NextTurnButton extends Button {
	
	public NextTurnButton(float x, float y, float width, float height) {
		super("Next Turn", x, y, width, height);
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getGame().requestEndTurn();
	}
}
