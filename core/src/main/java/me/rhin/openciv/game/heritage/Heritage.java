package me.rhin.openciv.game.heritage;

import com.badlogic.gdx.graphics.g2d.Sprite;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.listener.CompleteHeritageListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.shared.packet.type.CompleteHeritagePacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.stat.Stat;

public abstract class Heritage implements NextTurnListener, CompleteHeritageListener {

	protected boolean studied;
	private float appliedHeritage;
	private boolean studying;
	private int appliedTurns;

	public Heritage() {
		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(CompleteHeritageListener.class, this);
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {
		if (studying) {
			appliedHeritage += Civilization.getInstance().getGame().getPlayer().getStatLine()
					.getStatValue(Stat.HERITAGE_GAIN);
			appliedTurns++;
		}
	}

	@Override
	public void onCompleteHeritage(CompleteHeritagePacket packet) {
		if (!Civilization.getInstance().getGame().getPlayer().getHeritageTree()
				.getHeritageFromClassName(packet.getHeritageName()).equals(this))
			return;

		studied = true;
		studying = false;

		onStudied();
	}

	public abstract int getLevel();

	public abstract String getName();

	public abstract Sprite getIcon();

	public abstract float getCost();

	public abstract String getDesc();

	// Client side call
	protected abstract void onStudied();

	public boolean ableToStudy() {
		// Return based on how many heritage's we study of the same level.
		// e.g. two LOW level heritage's.
		int maxStudiedLevel = 0;
		int maxAmountStudied = 0; // Amount studied at the current max level.

		for (Heritage heritage : Civilization.getInstance().getGame().getPlayer().getHeritageTree().getAllHeritage())
			if (heritage.getLevel() > maxStudiedLevel && heritage.isStudied())
				maxStudiedLevel = heritage.getLevel();

		for (Heritage heritage : Civilization.getInstance().getGame().getPlayer().getHeritageTree().getAllHeritage())
			if (heritage.getLevel() == maxStudiedLevel && heritage.isStudied())
				maxAmountStudied++;

		// Deny study if we already researched two heritage on the same level.
		int studiedOnLevel = 0;
		for (Heritage heritage : Civilization.getInstance().getGame().getPlayer().getHeritageTree().getAllHeritage())
			if (heritage.getLevel() == getLevel() && heritage.isStudied())
				studiedOnLevel++;

		if (studiedOnLevel >= 2)
			return false;

		// Unlock heritage on the next level if we research two heritage
		return getLevel() == 0 || maxStudiedLevel >= getLevel()
				|| (getLevel() <= maxStudiedLevel + 1 && maxAmountStudied >= 2);
	}

	public boolean isStudied() {
		return studied;
	}

	public boolean isStudying() {
		return studying;
	}

	public void setStudying(boolean studying) {
		this.studying = studying;
	}

	public int getAppliedTurns() {
		return appliedTurns;
	}

	public float getAppliedHeritage() {
		return appliedHeritage;
	}

}
