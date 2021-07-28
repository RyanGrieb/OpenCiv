package me.rhin.openciv.server.game.city.wonders;

import java.util.HashMap;

import me.rhin.openciv.server.game.city.building.type.GreatPyramids;

public class GameWonders {

	private HashMap<Class<? extends Wonder>, Boolean> availableWonders;

	public GameWonders() {
		this.availableWonders = new HashMap<>();

		addWonder(GreatPyramids.class);
	}

	private void addWonder(Class<? extends Wonder> clazz) {
		availableWonders.put(clazz, true);
	}

	public boolean isBuilt(Class<? extends Wonder> clazz) {
		return !availableWonders.get(clazz);
	}

	public void setBuilt(Class<? extends Wonder> clazz) {
		availableWonders.put(clazz, false);
	}

}
