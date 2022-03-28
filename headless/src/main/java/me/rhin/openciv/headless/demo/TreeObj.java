package me.rhin.openciv.headless.demo;

import java.util.ArrayList;

import me.rhin.openciv.headless.HeadlessLauncher;
import me.rhin.openciv.headless.listener.EventHandler;
import me.rhin.openciv.headless.listener.Listener;

public class TreeObj implements Listener {

	public ArrayList<AppleObj> apples;

	public TreeObj() {
		apples = new ArrayList<>();

		HeadlessLauncher.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onAppleFall(AppleObj apple) {
		System.out.println(apple + " has fallen from the tree!");

		System.out.println("In tree? - " + apples.contains(apple));

		apples.remove(apple);
	}

	public ArrayList<AppleObj> getApples() {
		return apples;
	}

	public void dummyMethod() {
		System.out.println("Hello...?");
	}
}
