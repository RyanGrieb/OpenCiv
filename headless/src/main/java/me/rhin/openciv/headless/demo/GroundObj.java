package me.rhin.openciv.headless.demo;

import me.rhin.openciv.headless.HeadlessLauncher;
import me.rhin.openciv.headless.listener.EventHandler;
import me.rhin.openciv.headless.listener.EventPriority;
import me.rhin.openciv.headless.listener.Listener;

public class GroundObj implements Listener {

	public GroundObj() {
		HeadlessLauncher.getInstance().getEventManager().addListener(this);
	}

	@EventHandler(priority = EventPriority.LOWEST)
	public void onAppleFall(AppleObj apple) {
		System.out.println(apple + " - has fallen to the ground");
	}

	@EventHandler
	public void noParamMethod() {
		System.out.println("The method w/ no params has been invoked");
	}
}
