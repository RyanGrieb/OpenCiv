package me.rhin.openciv.server.events.type;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.shared.listener.Event;

public class ServerDeclareWarEvent implements Event {

	private AbstractPlayer player, targetPlayer;

	public ServerDeclareWarEvent(AbstractPlayer player, AbstractPlayer targetPlayer) {
		this.player = player;
		this.targetPlayer = targetPlayer;
	}

	@Override
	public String getMethodName() {
		return "onServerDeclareWar";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { player, targetPlayer };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { player.getClass(), targetPlayer.getClass() };
	}
}
