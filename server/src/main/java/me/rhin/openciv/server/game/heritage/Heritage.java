package me.rhin.openciv.server.game.heritage;

import me.rhin.openciv.server.game.AbstractPlayer;

public abstract class Heritage {

	protected AbstractPlayer player;
	protected boolean studied;
	private float appliedHeritage;
	private boolean studying;

	public Heritage(AbstractPlayer player) {
		this.player = player;
	}

	public abstract int getLevel();

	public abstract String getName();

	public abstract float getCost();

	protected abstract void onStudied();

	public boolean isStudied() {
		return studied;
	}

	public boolean ableToStudy() {
		// Return based on how many heritage's we study of the same level.
		// e.g. two LOW level heritage's.
		int maxStudiedLevel = 0;
		int maxAmountStudied = 0;

		for (Heritage heritage : player.getHeritageTree().getAllHeritage())
			if (heritage.getLevel() > maxStudiedLevel && heritage.isStudied())
				maxStudiedLevel = heritage.getLevel();

		for (Heritage heritage : player.getHeritageTree().getAllHeritage())
			if (heritage.getLevel() == maxStudiedLevel && heritage.isStudied())
				maxAmountStudied++;

		return getLevel() == 0 || maxStudiedLevel >= getLevel() || maxAmountStudied > 1;
	}

	public boolean isStudying() {
		return studying;
	}

	public void setStudying(boolean studying) {
		this.studying = studying;
	}

	public void setStudied(boolean studied) {
		this.studied = studied;

		if (studied)
			onStudied();
	}

	public void applyHeritage(float heritageAmount) {
		appliedHeritage += heritageAmount;
	}

	public float getAppliedHeritage() {
		return appliedHeritage;
	}

}
