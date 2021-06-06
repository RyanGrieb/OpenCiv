package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.shared.packet.type.StartGameRequestPacket;
import me.rhin.openciv.ui.button.Button;

public class MPStartButton extends Button {

	public MPStartButton(float x, float y, float width, float height) {
		super("Start Game", x, y, width, height);
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getNetworkManager().sendPacket(new StartGameRequestPacket());
	}

}
