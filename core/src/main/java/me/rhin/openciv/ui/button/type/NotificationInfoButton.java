package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.ui.button.Button;

public class NotificationInfoButton extends Button {

	private AbstractNotification notification;

	public NotificationInfoButton(AbstractNotification notification, float x, float y, float width, float height) {
		super(TextureEnum.ICON_QUESTION, "", x, y, width, height);

		this.notification = notification;
	}

	@Override
	public void onClick() {
		// TODO: Popup window explaining whats going on.
	}

}
