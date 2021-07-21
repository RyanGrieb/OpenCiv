package me.rhin.openciv.ui.window.type;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.game.GameNotificationBox;
import me.rhin.openciv.ui.window.AbstractWindow;

public class NotificationWindow extends AbstractWindow implements ResizeListener {

	private ArrayList<GameNotificationBox> gameNotifications;
	private ColoredBackground backgroundSprite;

	public NotificationWindow() {
		super.setBounds(viewport.getWorldWidth() - 244, viewport.getWorldHeight() - 450, 242, 400);

		this.backgroundSprite = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0, 242, 400);
		// addActor(backgroundSprite);

		this.gameNotifications = new ArrayList<>();

		Civilization.getInstance().getEventManager().addListener(ResizeListener.class, this);
	}

	@Override
	public void onResize(int width, int height) {
		this.setPosition(width - 244, height - 450);
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

	public void addNotification(AbstractNotification notification) {

		float y = gameNotifications.size() < 1 ? getHeight()
				: gameNotifications.get(gameNotifications.size() - 1).getY();
		y -= 80;
		GameNotificationBox notificationBox = new GameNotificationBox(notification, 0, y);
		gameNotifications.add(notificationBox);
		addActor(notificationBox);

		updatePositions();
	}

	public void removeNotification(AbstractNotification notification) {

		Iterator<GameNotificationBox> iterator = gameNotifications.iterator();

		while (iterator.hasNext()) {
			GameNotificationBox gameNotification = iterator.next();

			if (gameNotification.getNotification().equals(notification)) {
				iterator.remove();
				removeActor(gameNotification);
			}
		}

		updatePositions();
	}

	public void updatePositions() {
		Collections.sort(gameNotifications);
		// Reset the positions of the notifications.
		float y = getHeight();

		Iterator<GameNotificationBox> iterator = gameNotifications.iterator();

		// Displaying the values after iterating through the queue
		while (iterator.hasNext()) {
			GameNotificationBox gameNotification = iterator.next();

			y -= 80;
			gameNotification.setPosition(gameNotification.getX(), y);
		}
	}
}
