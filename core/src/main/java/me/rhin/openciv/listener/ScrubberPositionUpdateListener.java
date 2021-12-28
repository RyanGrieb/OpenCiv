package me.rhin.openciv.listener;

import java.util.ArrayList;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.ui.scrub.ScrubBar;

public interface ScrubberPositionUpdateListener extends Listener {

	public void onScrubberPositionUpdate(ScrubBar scrubber);

	public static class ScrubberPositionUpdateEvent extends Event<ScrubberPositionUpdateListener> {

		private ScrubBar scrubber;

		public ScrubberPositionUpdateEvent(ScrubBar scrubber) {
			this.scrubber = scrubber;
		}

		@Override
		public void fire(ArrayList<ScrubberPositionUpdateListener> listeners) {
			for (ScrubberPositionUpdateListener listener : listeners)
				listener.onScrubberPositionUpdate(scrubber);
		}

		@Override
		public Class<ScrubberPositionUpdateListener> getListenerType() {
			return ScrubberPositionUpdateListener.class;
		}

	}

}
