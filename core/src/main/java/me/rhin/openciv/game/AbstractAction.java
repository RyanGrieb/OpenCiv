package me.rhin.openciv.game;

import com.badlogic.gdx.scenes.scene2d.Action;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.UnitActListener.UnitActEvent;

public abstract class AbstractAction extends Action {

	protected Unit unit;

	public AbstractAction(Unit unit) {
		this.unit = unit;
	}

	public abstract boolean canAct();

	public abstract String getName();

	public abstract TextureEnum getSprite();
}
