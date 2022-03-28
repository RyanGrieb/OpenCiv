package me.rhin.openciv.game.notification.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.game.notification.NotificationPriority;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;
import me.rhin.openciv.ui.window.type.ChoosePantheonWindow;

public class FoundPantheonNotification extends AbstractNotification {

	@Override
	public void act() {
		Civilization.getInstance().getWindowManager().toggleWindow(new ChoosePantheonWindow());

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onPickPantheon(PickPantheonPacket packet) {
		Civilization.getInstance().getGame().getNotificationHanlder().removeNotification(this);
	}

	@Override
	public String getName() {
		return "Found pantheon notification";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_FAITH.sprite();
	}

	@Override
	public String getText() {
		return "You can found a\npantheon.";
	}

	@Override
	public NotificationPriority getPriorityLevel() {
		return NotificationPriority.HIGH;
	}
}
