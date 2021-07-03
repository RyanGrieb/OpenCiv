package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface ServerConnectListener extends Listener {

	public void onServerConnect();

	public static class ServerConnectEvent extends Event<ServerConnectListener> {
		public ServerConnectEvent() {
		}

		@Override
		public void fire(ArrayList<ServerConnectListener> listeners) {
			for (ServerConnectListener listener : listeners) {
				listener.onServerConnect();
			}
		}

		@Override
		public Class<ServerConnectListener> getListenerType() {
			return ServerConnectListener.class;
		}

	}
}
