package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.ui.button.Button;

public class WaitingNextTurnButton extends Button {

	public WaitingNextTurnButton(float x, float y, float width, float height) {
		super("Waiting...", x, y, width, height);
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getGame().cancelEndTurn();
	}

}
