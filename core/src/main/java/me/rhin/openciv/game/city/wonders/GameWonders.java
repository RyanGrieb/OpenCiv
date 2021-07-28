package me.rhin.openciv.game.city.wonders;

import java.util.HashMap;

import me.rhin.openciv.game.city.building.type.GreatPyramids;
import me.rhin.openciv.listener.FinishProductionItemListener;

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
