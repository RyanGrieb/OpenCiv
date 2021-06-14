package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.shared.packet.type.SetWorldSizePacket;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.game.WorldOptionsMenu;

public class IncreaseWorldSizeButton extends Button {

	private WorldOptionsMenu worldOptions;

	public IncreaseWorldSizeButton(WorldOptionsMenu worldOptions, String text, float x, float y, float width,
			float height) {
		super(text, x, y, width, height);
		this.worldOptions = worldOptions;
	}

	@Override
	public void onClick() {
		SetWorldSizePacket packet = new SetWorldSizePacket();
		packet.setWorldSize(worldOptions.getWorldSize() + 1);
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

}
