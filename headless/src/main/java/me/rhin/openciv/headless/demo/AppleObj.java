package me.rhin.openciv.headless.demo;

import me.rhin.openciv.headless.HeadlessLauncher;
import me.rhin.openciv.headless.listener.events.type.AppleFallEvent;

public class AppleObj {

	public void fall() {
		HeadlessLauncher.getInstance().getEventManager().fireEvent(new AppleFallEvent(this));
	}

}
