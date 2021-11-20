package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.shared.packet.type.DeclareWarPacket;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.DeclareWarWindow;

public class DeclareWarButton extends Button {

	private AbstractPlayer attacker, defender;

	public DeclareWarButton(AbstractPlayer attacker, AbstractPlayer defender, float x, float y, float width,
			float height) {
		super("Declare War", x, y, width, height);

		this.attacker = attacker;
		this.defender = defender;
	}

	@Override
	public void onClick() {

		DeclareWarPacket packet = new DeclareWarPacket();
		packet.setCombatants(attacker.getName(), defender.getName());

		Civilization.getInstance().getNetworkManager().sendPacket(packet);
		Civilization.getInstance().getWindowManager().closeWindow(DeclareWarWindow.class);
	}

}
