package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.listener.PickHeritageListener.PickHeritageEvent;
import me.rhin.openciv.shared.packet.type.ChooseHeritagePacket;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.PickHeritageWindow;

public class PickHeritageButton extends Button {

	private Heritage heritage;

	public PickHeritageButton(Heritage heritage, float x, float y, float width, float height) {
		super("Study", x, y, width, height);

		this.heritage = heritage;
	}

	@Override
	public void onClick() {
		ChooseHeritagePacket packet = new ChooseHeritagePacket();
		// FIXME: I don't like this substring stuff
		packet.setName(heritage.getClass().getName().substring(heritage.getClass().getName().indexOf("type.") + 5));
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
		Civilization.getInstance().getWindowManager().closeWindow(PickHeritageWindow.class);

		for (Heritage heritage : Civilization.getInstance().getGame().getPlayer().getHeritageTree().getAllHeritage())
			heritage.setStudying(false);

		heritage.setStudying(true);

		Civilization.getInstance().getEventManager().fireEvent(new PickHeritageEvent(heritage));
	}
}
