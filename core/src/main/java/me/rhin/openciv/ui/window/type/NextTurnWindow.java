package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.utils.Align;
import com.badlogic.gdx.utils.Timer;
import com.badlogic.gdx.utils.Timer.Task;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.notification.type.AvailableProductionNotification;
import me.rhin.openciv.game.notification.type.NotResearchingNotification;
import me.rhin.openciv.game.notification.type.NotStudyingNotification;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.packet.type.RequestEndTurnPacket;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.CustomButton;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.AbstractWindow;

public class NextTurnWindow extends AbstractWindow {

	private ColoredBackground background;
	private CustomButton nextTurnButton;
	private CustomButton waitingNextTurnButton;
	private CustomLabel waitingOnDescLabel;
	private ArrayList<CustomLabel> notificationLabels;

	public NextTurnWindow() {
		super.setBounds(viewport.getWorldWidth() / 2 - 200 / 2, 0, 200, 125);

		this.background = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0, getWidth(), getHeight());
		// addActor(background);
		this.nextTurnButton = new CustomButton("Next Turn", getWidth() / 2 - 125 / 2, 4, 125, 36);
		nextTurnButton.onClick(() -> {
			if (Civilization.getInstance().getGame().getNotificationHanlder()
					.isNotificationActive(AvailableProductionNotification.class)) {
				Civilization.getInstance().getWindowManager().getWindow(NextTurnWindow.class)
						.notify("Chose a production item...");
			}

			if (Civilization.getInstance().getGame().getNotificationHanlder()
					.isNotificationActive(NotResearchingNotification.class)) {
				Civilization.getInstance().getWindowManager().getWindow(NextTurnWindow.class)
						.notify("Choose a technology...");
			}

			if (Civilization.getInstance().getGame().getNotificationHanlder()
					.isNotificationActive(NotStudyingNotification.class)) {
				Civilization.getInstance().getWindowManager().getWindow(NextTurnWindow.class)
						.notify("Choose a heritage...");
			}

			if (Civilization.getInstance().getWindowManager().getWindow(NextTurnWindow.class).getNotificationLabels()
					.size() > 0)
				return;

			Civilization.getInstance().getGame().requestEndTurn();
		});
		addActor(nextTurnButton);

		this.waitingNextTurnButton = new CustomButton("Waiting...", getWidth() / 2 - 125 / 2, 4, 125, 36);
		waitingNextTurnButton.onClick(() -> {
			Civilization.getInstance().getGame().cancelEndTurn();
		});

		this.notificationLabels = new ArrayList<>();
	}

	@EventHandler
	public void onRequestEndTurn(RequestEndTurnPacket packet) {
		AbstractPlayer player = Civilization.getInstance().getGame().getPlayers().get(packet.getPlayerName());

		if (!player.equals(Civilization.getInstance().getGame().getPlayer())) {

			// TODO: Display information stating that this player ended his turn.
			return;
		}

		removeActor(nextTurnButton);
		addActor(waitingNextTurnButton);
	}

	@EventHandler
	public void onNextTurn(NextTurnPacket packet) {
		addActor(nextTurnButton);
		removeActor(waitingNextTurnButton);
	}

	@EventHandler
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

		Timer.schedule(new Task() {
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

		}, 3);
	}

	public ArrayList<CustomLabel> getNotificationLabels() {
		return notificationLabels;
	}
}
