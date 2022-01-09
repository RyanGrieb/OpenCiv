package me.rhin.openciv.server.listener;

import java.util.ArrayList;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface ServerDeclareWarListener extends Listener {

	public void onDeclareWar(AbstractPlayer attacker, AbstractPlayer defender);

	public static class ServerDeclareWarEvent extends Event<ServerDeclareWarListener> {

		private AbstractPlayer attacker;
		private AbstractPlayer defender;

		public ServerDeclareWarEvent(AbstractPlayer attacker, AbstractPlayer defender) {
			this.attacker = attacker;
			this.defender = defender;
		}

		@Override
		public void fire(ArrayList<ServerDeclareWarListener> listeners) {
			for (ServerDeclareWarListener listener : listeners) {
				listener.onDeclareWar(attacker, defender);
			}
		}

		@Override
		public Class<ServerDeclareWarListener> getListenerType() {
			return ServerDeclareWarListener.class;
		}

	}
}
