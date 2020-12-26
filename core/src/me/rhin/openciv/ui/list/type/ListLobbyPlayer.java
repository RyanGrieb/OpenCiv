package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ListObject;

public class ListLobbyPlayer extends ListObject {

	private Sprite backgroundSprite;
	private CustomLabel playerNameLabel;

	public ListLobbyPlayer(String playerName, float width, float height) {
		super(width, height, playerName);

		backgroundSprite = TextureEnum.UI_DARK_GRAY.sprite();
		backgroundSprite.setSize(width, height);

		this.playerNameLabel = new CustomLabel(playerName);
		playerNameLabel.setSize(width, height);
		playerNameLabel.setAlignment(Align.center);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);
		playerNameLabel.draw(batch, parentAlpha);

		// FIXME: Ordering looks weird..
		super.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		playerNameLabel.setPosition(x, y);
	}
}
