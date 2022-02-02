package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.listener.ResizeListener;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ContainerList;
import me.rhin.openciv.ui.list.ListObject;

public class ListDiplomacyCivilization extends ListObject {

	private Sprite hoveredBackgroundSprite;
	private Sprite backgroundSprite;
	private Sprite civSprite;
	private CustomLabel playerNameLabel;
	private CustomLabel civNameLabel;

	public ListDiplomacyCivilization(AbstractPlayer player, ContainerList containerList, float width, float height) {
		super(width, height, containerList, "Players");

		backgroundSprite = TextureEnum.UI_DARK_GRAY.sprite();
		backgroundSprite.setSize(width, height);

		this.hoveredBackgroundSprite = TextureEnum.UI_GRAY.sprite();
		this.hoveredBackgroundSprite.setSize(width, height);

		this.civSprite = player.getCivilization().getIcon().sprite();
		civSprite.setSize(32, 32);

		this.civNameLabel = new CustomLabel(player.getCivilization().getName());
		this.playerNameLabel = new CustomLabel(player.getName());
	}

	@Override
	protected void onClicked(InputEvent event) {}
	
	@Override
	public void draw(Batch batch, float parentAlpha) {
		if (hovered)
			hoveredBackgroundSprite.draw(batch);
		else
			backgroundSprite.draw(batch);

		civSprite.draw(batch);
		civNameLabel.draw(batch, parentAlpha);
		playerNameLabel.draw(batch, parentAlpha);

		super.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		hoveredBackgroundSprite.setPosition(x, y);
		civSprite.setPosition(x + getHeight() / 2 - 16, getHeight() / 2 - 16);
		civNameLabel.setPosition(x + 50, y + 13);
		playerNameLabel.setPosition(x + 50, y + 36);
	}
}
