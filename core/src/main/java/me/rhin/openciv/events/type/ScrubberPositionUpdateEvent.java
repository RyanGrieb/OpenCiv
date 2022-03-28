package me.rhin.openciv.events.type;

import me.rhin.openciv.shared.listener.Event;
import me.rhin.openciv.ui.scrub.ScrubBar;

public class ScrubberPositionUpdateEvent implements Event {

	private ScrubBar scrubBar;

	public ScrubberPositionUpdateEvent(ScrubBar scrubBar) {
		this.scrubBar = scrubBar;
	}

	@Override
	public String getMethodName() {
		return "onScrubberPositionUpdate";
	}

	@Override
	public Object[] getMethodParams() {
		return new Object[] { scrubBar };
	}

	@Override
	public Class<?>[] getMethodParamClasses() {
		return new Class<?>[] { scrubBar.getClass() };
	}

}
