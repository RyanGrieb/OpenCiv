package me.rhin.openciv.ui.list.type;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.list.ListObject;

public class ListLobbyPlayer extends ListObject {

	private String playerName;
	private boolean isHost;
	private Sprite backgroundSprite;
	private Sprite hoveredBackgroundSprite;
	private Sprite hostSprite;
	private CustomLabel playerNameLabel;
	private Sprite chosenCivSprite;
	private boolean hovered;

	public ListLobbyPlayer(final String playerName, float width, float height) {
		super(width, height, playerName);
		this.playerName = playerName;

		backgroundSprite = TextureEnum.UI_DARK_GRAY.sprite();
		backgroundSprite.setSize(width, height);

		this.hoveredBackgroundSprite = TextureEnum.UI_GRAY.sprite();
		this.hoveredBackgroundSprite.setSize(width, height);

		this.playerNameLabel = new CustomLabel(playerName);
		playerNameLabel.setSize(width, height);
		playerNameLabel.setAlignment(Align.center);

		chosenCivSprite = TextureEnum.ICON_UNKNOWN.sprite();
		chosenCivSprite.setSize(32, 32);

		hostSprite = TextureEnum.UI_STAR.sprite();
		hostSprite.setSize(16, 16);

		this.hovered = false;

		this.addListener(new ClickListener() {
			@Override
			public void clicked(InputEvent event, float x, float y) {
				System.out.println(playerName + "!!");
			}

			@Override
			public void enter(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				hovered = true;
			}

			@Override
			public void exit(InputEvent event, float x, float y, int pointer, Actor fromActor) {
				hovered = false;
			}
		});

	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		if (hovered)
			hoveredBackgroundSprite.draw(batch);
		else
			backgroundSprite.draw(batch);

		if (isHost)
			hostSprite.draw(batch);

		playerNameLabel.draw(batch, parentAlpha);
		chosenCivSprite.draw(batch, parentAlpha);

		// FIXME: Ordering looks weird..
		super.draw(batch, parentAlpha);
	}

	@Override
	public void setPosition(float x, float y) {
		super.setPosition(x, y);
		backgroundSprite.setPosition(x, y);
		hoveredBackgroundSprite.setPosition(x, y);
		playerNameLabel.setPosition(x, y);
		hostSprite.setPosition(x + 3, y + getHeight() / 2 - 16 / 2);
		chosenCivSprite.setPosition(x + getWidth() - 36, y + getHeight() / 2 - 32 / 2);
	}

	public String getPlayerName() {
		return playerName;
	}

	public void setHost() {
		this.isHost = true;
	}
}
