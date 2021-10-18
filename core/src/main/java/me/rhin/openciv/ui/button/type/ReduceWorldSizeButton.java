package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.shared.packet.type.SetWorldSizePacket;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.game.GameOptionsMenu;

public class ReduceWorldSizeButton extends Button {

	private GameOptionsMenu gameOptions;

	public ReduceWorldSizeButton(GameOptionsMenu gameOptions, String text, float x, float y, float width,
			float height) {
		super(text, x, y, width, height);
		this.gameOptions = gameOptions;
	}

	@Override
	public void onClick() {
		SetWorldSizePacket packet = new SetWorldSizePacket();
		packet.setWorldSize(gameOptions.getWorldSize() - 1);
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

}
