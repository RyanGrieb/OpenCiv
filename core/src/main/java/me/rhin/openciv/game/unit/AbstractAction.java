package me.rhin.openciv.game.unit;

import com.badlogic.gdx.scenes.scene2d.Action;

import me.rhin.openciv.asset.TextureEnum;

public abstract class AbstractAction extends Action {

	protected Unit unit;

	public AbstractAction(Unit unit) {
		this.unit = unit;
	}

	public abstract boolean canAct();

	public abstract String getName();

	public abstract TextureEnum getSprite();
}
