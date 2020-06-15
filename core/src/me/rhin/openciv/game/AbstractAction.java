package me.rhin.openciv.game;

import com.badlogic.gdx.scenes.scene2d.Action;
import com.badlogic.gdx.scenes.scene2d.Actor;

public abstract class AbstractAction extends Action {
	
	protected Actor actor;
	
	public AbstractAction(Actor actor) {
		this.actor = actor;
	}
	
	public abstract boolean canAct();
}
