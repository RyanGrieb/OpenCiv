package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.player.AbstractPlayer;
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
	private ArrayList<CustomLabel> notificationLabels;

	public NextTurnWindow() {
		super.setBounds(viewport.getWorldWidth() / 2 - 200 / 2, 0, 200, 125);

		this.background = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0, getWidth(), getHeight());
		// addActor(background);
		this.nextTurnButton = new NextTurnButton(getWidth() / 2 - 125 / 2, 4, 125, 36);
		addActor(nextTurnButton);

		this.waitingNextTurnButton = new WaitingNextTurnButton(getWidth() / 2 - 125 / 2, 4, 125, 36);

		this.notificationLabels = new ArrayList<>();

		Civilization.getInstance().getEventManager().addListener(RequestEndTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void onRequestEndTurn(RequestEndTurnPacket packet) {
		AbstractPlayer player = Civilization.getInstance().getGame().getPlayers().get(packet.getPlayerName());

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

		nextTurnButton.setPosition(getWidth() / 2 - 125 / 2, 4);
		waitingNextTurnButton.setPosition(getWidth() / 2 - 125 / 2, 4);
	}

	@Override
	public void onClose() {
		super.onClose();

		// Civilization.getInstance().getEventManager().clearListenersFromObject(this);
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

	public void notify(String text) {
		for (CustomLabel label : notificationLabels) {
			if (label.getText().toString().equals(text)) {
				return;
			}
		}

		CustomLabel label = new CustomLabel(text, Align.center, 0, 37 + (13 * notificationLabels.size()), getWidth(),
				15);
		notificationLabels.add(label);
		addActor(label);

		new java.util.Timer().schedule(new java.util.TimerTask() {
			@Override
			public void run() {

				Gdx.app.postRunnable(new Runnable() {
					@Override
					public void run() {
						label.addAction(Actions.removeActor());
						notificationLabels.remove(label);

						int index = 0;
						for (CustomLabel label : notificationLabels) {
							label.setPosition(0, 37 + (13 * index));
							index++;
						}
					}
				});

			}
		}, 3000);

	}

	public ArrayList<CustomLabel> getNotificationLabels() {
		return notificationLabels;
	}
}
