package me.rhin.openciv.game.notification.type;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.notification.AbstractNotification;
import me.rhin.openciv.game.notification.NotificationPriority;
import me.rhin.openciv.listener.MoveUnitListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;

public class MovementRangeHelpNotification extends AbstractNotification implements MoveUnitListener, NextTurnListener {

	public MovementRangeHelpNotification() {
		Civilization.getInstance().getEventManager().addListener(MoveUnitListener.class, this);
		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {
		Civilization.getInstance().getGame().getNotificationHanlder().removeNotification(this);
	}

	@Override
	public void onUnitMove(MoveUnitPacket packet) {
		Civilization.getInstance().getGame().getNotificationHanlder().removeNotification(this);
	}

	@Override
	public void act() {

	}

	@Override
	public String getName() {
		return "Movement range help notification";
	}

	@Override
	public Sprite getIcon() {
		return TextureEnum.ICON_QUESTION.sprite();
	}

	@Override
	public String getText() {
		return "Tip: Try right \nclicking closer\nto move the unit.";
	}

	@Override
	public NotificationPriority getPriorityLevel() {
		return NotificationPriority.LOWEST;
	}
}
