package me.rhin.openciv.game.unit;

public interface RangedUnit {

	public int getRangedCombatStrength();

	public void setRangedTarget(Unit rangedTarget);

	public void setTargeting(boolean targeting);

	public boolean isTargeting();
}
