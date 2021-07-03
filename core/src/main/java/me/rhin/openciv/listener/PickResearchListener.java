package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.game.research.Technology;
import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;

public interface PickResearchListener extends Listener {

	public void onPickResearch(Technology tech);

	public static class PickResearchEvent extends Event<PickResearchListener> {

		private Technology tech;

		public PickResearchEvent(Technology tech) {
			this.tech = tech;
		}

		@Override
		public void fire(ArrayList<PickResearchListener> listeners) {
			for (PickResearchListener listener : listeners) {
				listener.onPickResearch(tech);
			}
		}

		@Override
		public Class<PickResearchListener> getListenerType() {
			return PickResearchListener.class;
		}
	}

}
