
package me.rhin.openciv.server.game.city.wonders;
import java.util.HashMap;

import me.rhin.openciv.server.game.city.building.Building;
import me.rhin.openciv.server.game.city.building.type.Colossus;
import me.rhin.openciv.server.game.city.building.type.GreatLibrary;
import me.rhin.openciv.server.game.city.building.type.GreatPyramids;
import me.rhin.openciv.server.game.city.building.type.HangingGardens;
import me.rhin.openciv.server.game.city.building.type.MachuPicchu;
import me.rhin.openciv.server.game.city.building.type.StatueOfAres;
import me.rhin.openciv.server.game.city.building.type.Stonehenge;

public class GameWonders {

	private HashMap<Class<? extends Building>, Boolean> availableWonders;

	public GameWonders() {
		this.availableWonders = new HashMap<>();

		addWonder(GreatPyramids.class);
		addWonder(GreatLibrary.class);
		addWonder(HangingGardens.class);
		addWonder(StatueOfAres.class);
		addWonder(Stonehenge.class);
		addWonder(MachuPicchu.class);
		addWonder(Colossus.class);
	}

	private void addWonder(Class<? extends Building> clazz) {
		availableWonders.put(clazz, true);
	}

	public boolean isBuilt(Class<? extends Building> clazz) {
		return !availableWonders.get(clazz);
	}

	public void setBuilt(Class<? extends Building> clazz) {
		availableWonders.put(clazz, false);
	}

}
