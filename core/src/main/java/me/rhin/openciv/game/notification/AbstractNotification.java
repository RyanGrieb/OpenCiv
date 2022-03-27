package me.rhin.openciv.game.notification;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.shared.listener.Listener;

public abstract class AbstractNotification implements Listener, Comparable<AbstractNotification> {


	public abstract void act();

	public abstract String getName();

	public abstract Sprite getIcon();

	public abstract String getText();

	public NotificationPriority getPriorityLevel() {
		return NotificationPriority.LOW;
	}

	public void merge(AbstractNotification notification) {
		Civilization.getInstance().getEventManager().removeListener(notification);
	}

	@Override
	public int compareTo(AbstractNotification notification) {
		return Integer.valueOf(notification.getPriorityLevel().ordinal()).compareTo(getPriorityLevel().ordinal());
	}

}
