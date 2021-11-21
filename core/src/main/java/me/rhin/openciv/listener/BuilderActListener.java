package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.game.unit.actions.BuilderAction;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface BuilderActListener extends Listener {

	public void onBuilderAct(BuilderAction action);

	public static class BuilderActEvent extends Event<BuilderActListener> {

		private BuilderAction action;

		public BuilderActEvent(BuilderAction action) {
			this.action = action;
		}

		@Override
		public void fire(ArrayList<BuilderActListener> listeners) {
			for (BuilderActListener listener : listeners) {
				listener.onBuilderAct(action);
			}
		}

		@Override
		public Class<BuilderActListener> getListenerType() {
			return BuilderActListener.class;
		}
	}
	
}
