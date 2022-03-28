package me.rhin.openciv.headless;

import me.rhin.openciv.headless.demo.AppleObj;
import me.rhin.openciv.headless.demo.BranchObj;
import me.rhin.openciv.headless.demo.GroundObj;
import me.rhin.openciv.headless.demo.TreeObj;
import me.rhin.openciv.headless.listener.EventManager;
import me.rhin.openciv.headless.listener.events.type.NoParamEvent;

/**
 * Launches the headless application. Can be converted into a utilities project
 * or a server application.
 */
public class HeadlessLauncher {

	private static HeadlessLauncher instance;

	private EventManager eventManager;

	public HeadlessLauncher() {
		eventManager = new EventManager();

		instance = this;

		GroundObj ground = new GroundObj();
		TreeObj tree = new TreeObj();
		BranchObj branch = new BranchObj();
		AppleObj apple = new AppleObj();

		eventManager.fireEvent(new NoParamEvent());

		tree.getApples().add(apple);

		System.out.println(apple);

		apple.fall();

		System.out.println("==== Removing Listener - Ground =====");
		eventManager.removeListener(ground);

		apple.fall();
	}

	public static void main(String[] args) {
		new HeadlessLauncher();
	}

	public static final HeadlessLauncher getInstance() {
		return instance;
	}

	public EventManager getEventManager() {
		return eventManager;
	}
}