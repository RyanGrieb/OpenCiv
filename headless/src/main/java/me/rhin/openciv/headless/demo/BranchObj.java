package me.rhin.openciv.headless.demo;

import java.util.ArrayList;

import me.rhin.openciv.headless.listener.EventHandler;
import me.rhin.openciv.headless.listener.Listener;

public class BranchObj extends TreeObj implements Listener {

	public BranchObj() {
		super();
	}

	@EventHandler
	public void onAppleFall(AppleObj apple) {
		System.out.println(apple + " has fallen from the BRANCH!");
	}

	public void dummyMethod() {
		System.out.println("Hello...?");
	}
}
