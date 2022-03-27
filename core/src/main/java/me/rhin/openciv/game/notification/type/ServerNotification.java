package me.rhin.openciv.game.notification.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.game.notification.NotificationPriority;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;

public class ServerNotification extends AbstractNotification {

	private TextureEnum icon;
	private String text;

	public ServerNotification(TextureEnum icon, String text) {
		this.icon = icon;
		this.text = text;

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onNextTurn(NextTurnPacket packet) {
		Civilization.getInstance().getGame().getNotificationHanlder().removeNotification(this);
	}

	@Override
	public void act() {
		// Note: We don't do anything here. Were just displaying information.
		Civilization.getInstance().getGame().getNotificationHanlder().removeNotification(this);
	}

	@Override
	public String getName() {
		return "Server notification";
	}

	@Override
	public Sprite getIcon() {
		return icon.sprite();
	}

	@Override
	public String getText() {
		return text;
	}

	// TODO: Include priority in packet?
	@Override
	public NotificationPriority getPriorityLevel() {
		return NotificationPriority.LOW;
	}

}
