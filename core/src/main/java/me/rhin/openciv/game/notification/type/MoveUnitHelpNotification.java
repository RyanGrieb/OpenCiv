package me.rhin.openciv.game.notification.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.game.notification.NotificationPriority;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;

public class MoveUnitHelpNotification extends AbstractNotification {

	public MoveUnitHelpNotification() {
		Civilization.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onNextTurn(NextTurnPacket packet) {
		Civilization.getInstance().getGame().getNotificationHanlder().removeNotification(this);
	}

	@EventHandler
	public void onUnitMove(MoveUnitPacket packet) {
		Civilization.getInstance().getGame().getNotificationHanlder().removeNotification(this);
	}

	@Override
	public void act() {

	}

	@Override
	public String getName() {
		return "Move unit help notification";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_QUESTION.sprite();
	}

	@Override
	public String getText() {
		return "Tip: You can move \nunits by right \nclicking.";
	}

	@Override
	public NotificationPriority getPriorityLevel() {
		return NotificationPriority.LOWEST;
	}
}
