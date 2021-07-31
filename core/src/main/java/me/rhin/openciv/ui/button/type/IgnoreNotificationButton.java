package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.ui.button.Button;

public class IgnoreNotificationButton extends Button {

	private AbstractNotification notification;

	public IgnoreNotificationButton(AbstractNotification notification, float x, float y, float width, float height) {
		super(TextureEnum.ICON_CANCEL, "", x, y, width, height);

		this.notification = notification;
	}

	@Override
	public void onClick() {
		Civilization.getInstance().getGame().getNotificationHanlder().removeNotification(notification);
	}

}