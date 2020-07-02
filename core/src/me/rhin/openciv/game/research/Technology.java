package me.rhin.openciv.game.research;

import me.rhin.openciv.Civilization;

public abstract class Technology {

	public static Technology fromID(int techID) {
		return Civilization.getInstance().getGame().getPlayer().getResearchTree().getTechnologies().get(techID);
	}
}
