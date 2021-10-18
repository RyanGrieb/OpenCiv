package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.shared.packet.type.SetTurnLengthPacket;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.game.GameOptionsMenu;

public class ReduceTurnLengthButton extends Button {

	private GameOptionsMenu gameOptions;

	public ReduceTurnLengthButton(GameOptionsMenu gameOptions, String text, float x, float y, float width,
			float height) {
		super(text, x, y, width, height);
		this.gameOptions = gameOptions;
	}

	@Override
	public void onClick() {
		SetTurnLengthPacket packet = new SetTurnLengthPacket();
		packet.setTurnLengthOffset(gameOptions.getTurnLengthOffset() - 1);
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

}