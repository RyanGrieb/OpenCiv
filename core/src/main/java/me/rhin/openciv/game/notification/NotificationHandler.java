package me.rhin.openciv.game.notification;

import java.util.PriorityQueue;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.notification.type.ServerNotification;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.ServerNotificationPacket;
import me.rhin.openciv.ui.window.type.NotificationWindow;

public class NotificationHandler implements Listener {

	private NotificationWindow window;
	private PriorityQueue<AbstractNotification> activeNotifications;

	public NotificationHandler(NotificationWindow window) {
		this.window = window;

		this.activeNotifications = new PriorityQueue<>();

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onServerNotification(ServerNotificationPacket packet) {
		TextureEnum texture = TextureEnum.valueOf(packet.getIconName());
		String text = packet.getText();

		fireNotification(new ServerNotification(texture, text));
	}

	public void fireNotification(AbstractNotification notification) {
		// Note: We don't want to stack similar notifications (e.g. unit movement). This
		// is where this class comes into play.
		for (AbstractNotification activeNotification : activeNotifications) {
			if (activeNotification.getName().equals(notification.getName())) {
				activeNotification.merge(notification);
				return;
			}
		}

		window.addNotification(notification);
		activeNotifications.add(notification);
	}

	public void removeNotification(AbstractNotification notification) {
		// LOGGER.info("remove: " + notification.getName());

		window.removeNotification(notification);
		activeNotifications.remove(notification);
		Civilization.getInstance().getEventManager().removeListener(notification);
	}

	public boolean isNotificationActive(Class<? extends AbstractNotification> clazz) {
		for (AbstractNotification activeNotification : activeNotifications) {
			if (activeNotification.getClass() == clazz)
				return true;
		}
		return false;
	}
}
