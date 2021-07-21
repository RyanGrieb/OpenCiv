package me.rhin.openciv.ui.window.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.listener.RequestEndTurnListener;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.packet.type.RequestEndTurnPacket;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.NextTurnButton;
import me.rhin.openciv.ui.button.type.WaitingNextTurnButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class NextTurnWindow extends AbstractWindow implements RequestEndTurnListener, NextTurnListener, ResizeListener {

	private ColoredBackground background;
	private NextTurnButton nextTurnButton;
	private WaitingNextTurnButton waitingNextTurnButton;
	private CustomLabel waitingOnDescLabel;

	public NextTurnWindow() {
		super.setBounds(viewport.getWorldWidth() / 2 - 200 / 2, 0, 200, 125);

		this.background = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0, getWidth(), getHeight());
		// addActor(background);
		this.nextTurnButton = new NextTurnButton(getWidth() / 2 - 125 / 2, 4, 125, 36);
		addActor(nextTurnButton);

		this.waitingNextTurnButton = new WaitingNextTurnButton(getWidth() / 2 - 125 / 2, 4, 125, 36);

		Civilization.getInstance().getEventManager().addListener(RequestEndTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void onRequestEndTurn(RequestEndTurnPacket packet) {
		Player player = Civilization.getInstance().getGame().getPlayers().get(packet.getPlayerName());

		if (!player.equals(Civilization.getInstance().getGame().getPlayer())) {

			// TODO: Display information stating that this player ended his turn.
			return;
		}

		removeActor(nextTurnButton);
		addActor(waitingNextTurnButton);
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {
		addActor(nextTurnButton);
		removeActor(waitingNextTurnButton);
	}

	@Override
	public void onResize(int width, int height) {
		super.setPosition(width / 2 - 200 / 2, 0);
	}

	@Override
	public void onClose() {
		super.onClose();

		Civilization.getInstance().getEventManager().clearListenersFromObject(this);
	}

	@Override
	public boolean disablesInput() {
		return false;
	}

	@Override
	public boolean disablesCameraMovement() {
		return false;
	}

	@Override
	public boolean closesOtherWindows() {
		return false;
	}

	@Override
	public boolean closesGameDisplayWindows() {
		return false;
	}

	@Override
	public boolean isGameDisplayWindow() {
		return true;
	}
}
