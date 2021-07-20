package me.rhin.openciv.ui.game;

import com.badlogic.gdx.scenes.scene2d.Group;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.ui.background.ColoredBackground;
import me.rhin.openciv.ui.button.type.ActNotificationButton;
import me.rhin.openciv.ui.button.type.NotificationInfoButton;
import me.rhin.openciv.ui.label.CustomLabel;

public class GameNotificationBox extends Group implements Comparable<GameNotificationBox> {

	private AbstractNotification notification;
	private ColoredBackground background;
	private ColoredBackground notificationIcon;
	private CustomLabel notificationLabel;
	private ActNotificationButton actNotificationButton;
	private NotificationInfoButton notificationInfoButton;
	// private IgnoreNotificationButton ignoreNotificationButton;

	public GameNotificationBox(AbstractNotification notification, float x, float y) {
		super.setBounds(x, y, 242, 76);

		this.notification = notification;

		this.background = new ColoredBackground(TextureEnum.UI_NOTIFICATION_BOX.sprite(), 40, 0, 200, 76);
		addActor(background);

		this.notificationIcon = new ColoredBackground(notification.getIcon(), 46, getHeight() / 2 - 32 / 2, 32, 32);
		addActor(notificationIcon);

		this.notificationLabel = new CustomLabel(notification.getText());
		notificationLabel.setPosition(80, getHeight() / 2 - notificationLabel.getHeight() / 2);
		addActor(notificationLabel);

		this.actNotificationButton = new ActNotificationButton(notification, 0, getHeight() - 38, 36, 36);
		addActor(actNotificationButton);
	}

	public AbstractNotification getNotification() {
		return notification;
	}

	@Override
	public int compareTo(GameNotificationBox gameNotification) {
		return notification.compareTo(gameNotification.getNotification());
	}
}
