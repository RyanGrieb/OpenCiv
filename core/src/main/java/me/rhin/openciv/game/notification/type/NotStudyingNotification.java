package me.rhin.openciv.game.notification.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.heritage.Heritage;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.game.notification.NotificationPriority;
import me.rhin.openciv.listener.PickHeritageListener;
import me.rhin.openciv.ui.window.type.HeritageWindow;

public class NotStudyingNotification extends AbstractNotification implements PickHeritageListener {

	public NotStudyingNotification() {
		Civilization.getInstance().getEventManager().addListener(PickHeritageListener.class, this);
	}

	@Override
	public void act() {
		// TODO: Prompt the player that they need to settle a city.
		if (Civilization.getInstance().getGame().getPlayer().getOwnedCities().size() < 1)
			return;

		Civilization.getInstance().getWindowManager().toggleWindow(new HeritageWindow());
	}

	@Override
	public void onPickHeritage(Heritage heritage) {
		Civilization.getInstance().getGame().getNotificationHanlder().removeNotification(this);
	}

	@Override
	public String getName() {
		return "Not studying notification";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_HERITAGE.sprite();
	}

	@Override
	public String getText() {
		return "You can study\nyour countries \nheritage.";
	}

	@Override
	public NotificationPriority getPriorityLevel() {
		return NotificationPriority.HIGH;
	}
}