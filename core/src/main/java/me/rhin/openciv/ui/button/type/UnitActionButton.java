package me.rhin.openciv.ui.button.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.unit.AbstractAction;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.window.type.UnitWindow;

public class UnitActionButton extends Button {

	private Sprite actionSprite;
	private Unit unit;
	private AbstractAction action;

	public UnitActionButton(Unit unit, AbstractAction action, UnitWindow unitWindow, float x, float y, float width,
			float height) {
		super(TextureEnum.UI_BUTTON_ICON, "", x, y, width, height);
		this.unit = unit;
		this.action = action;

		this.hoveredSprite = TextureEnum.UI_BUTTON_ICON_HOVERED.sprite();
		hoveredSprite.setBounds(x, y, width, height);

		this.actionSprite = action.getSprite().sprite();
		actionSprite.setBounds(x + width / 2 - 32 / 2, y + height / 2 - 32 / 2, 32, 32);

		addListener(new ClickListener() {
			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				unitWindow.setHoveredAction(action);
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				unitWindow.unsetHoveredAction();
			}
		});
	}

	@Override
	public void onClick() {
		if (action.canAct())
			unit.addAction(action);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);
		actionSprite.draw(batch);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		actionSprite.setPosition(x + (getWidth() / 2) - (32 / 2), y + (getHeight() / 2) - (32 / 2));
	}

	public AbstractAction getAction() {
		return action;
	}
}
