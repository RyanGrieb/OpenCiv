package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ListObject;

public class ListLobbyPlayer extends ListObject {

	private String playerName;
	private boolean isHost;
	private Sprite backgroundSprite;
	private Sprite hostSprite;
	private CustomLabel playerNameLabel;

	public ListLobbyPlayer(String playerName, float width, float height) {
		super(width, height, playerName);
		this.playerName = playerName;

		backgroundSprite = TextureEnum.UI_DARK_GRAY.sprite();
		backgroundSprite.setSize(width, height);

		this.playerNameLabel = new CustomLabel(playerName);
		playerNameLabel.setSize(width, height);
		playerNameLabel.setAlignment(Align.center);

		hostSprite = TextureEnum.UI_STAR.sprite();
		hostSprite.setSize(16, 16);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		backgroundSprite.draw(batch);

		if (isHost)
			hostSprite.draw(batch);

		playerNameLabel.draw(batch, parentAlpha);

		// FIXME: Ordering looks weird..
		super.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		playerNameLabel.setPosition(x, y);
		hostSprite.setPosition(x + 3, y + getHeight() / 2 - 16 / 2);
	}

	public String getPlayerName() {
		return playerName;
	}

	public void setHost() {
		System.out.println("Setting host for " + playerName);
		this.isHost = true;
	}
}
