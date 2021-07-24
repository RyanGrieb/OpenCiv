package me.rhin.openciv.game.heritage;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;

public abstract class Heritage {

	private boolean studied;

	public abstract int getLevel();

	public abstract String getName();

	public abstract Sprite getIcon();

	public boolean isStudied() {
		return studied;
	}

	public boolean ableToStudy() {
		// Return based on how many heritage's we study of the same level.
		// e.g. two LOW level heritage's.
		int maxStudiedLevel = 0;
		int maxAmountStudied = 0;

		for (Heritage heritage : Civilization.getInstance().getGame().getPlayer().getHeritageTree().getAllHeritage())
			if (heritage.getLevel() > maxStudiedLevel && heritage.isStudied())
				maxStudiedLevel = heritage.getLevel();

		for (Heritage heritage : Civilization.getInstance().getGame().getPlayer().getHeritageTree().getAllHeritage())
			if (heritage.getLevel() == maxStudiedLevel && heritage.isStudied())
				maxAmountStudied++;

		System.out.println(maxStudiedLevel + "," + maxAmountStudied);

		return getLevel() == 0 || maxStudiedLevel >= getLevel() || maxAmountStudied > 1;
	}

	public boolean isStudying() {
		// TODO Auto-generated method stub
		return false;
	}
}
