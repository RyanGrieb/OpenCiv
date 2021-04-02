package me.rhin.openciv.ui.button.type;

import com.badlogic.gdx.Gdx;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.button.Button;

public class GithubButton extends Button {

	public GithubButton(float x, float y, float width, float height) {
		super(TextureEnum.UI_GITHUB, "", x, y, width, height);

		this.hoveredSprite = null;
	}

	@Override
	public void onClick() {
		Gdx.net.openURI("https://github.com/rhin123/OpenCiv");
	}
}
