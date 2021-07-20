package me.rhin.openciv.ui.window.type;

import java.util.Iterator;
import java.util.PriorityQueue;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.game.GameNotificationBox;
import me.rhin.openciv.ui.window.AbstractWindow;

public class NotificationWindow extends AbstractWindow implements ResizeListener {

	private PriorityQueue<GameNotificationBox> gameNotifications;
	private ColoredBackground backgroundSprite;

	public NotificationWindow() {
		super.setBounds(viewport.getWorldWidth() - 244, viewport.getWorldHeight() - 450, 242, 400);

		this.backgroundSprite = new ColoredBackground(TextureEnum.UI_BLACK.sprite(), 0, 0, 242, 400);
		// addActor(backgroundSprite);

		this.gameNotifications = new PriorityQueue<>();
	}

	@Override
	public void onResize(int width, int height) {

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

		float y = gameNotifications.size() < 1 ? getHeight() : gameNotifications.peek().getY();
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
		// Reset the positions of the notifications.
		float y = getHeight();

		for (GameNotificationBox gameNotification : gameNotifications) {
			y -= 80;
			gameNotification.setPosition(gameNotification.getX(), y);
		}
	}
}
