package me.rhin.openciv.ui.screen.type;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Texture;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.AssetHandler;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.screen.ScreenEnum;

public class LoadingScreen extends AbstractScreen {

	private AssetHandler assetHandler;
	private CustomLabel loadingLabel;

	private SpriteBatch batch;
	private Sprite backgroundBar;
	private Sprite loadingBar;
	private Sprite logoSprite;

	public LoadingScreen() {
		this.assetHandler = Civilization.getInstance().getAssetHandler();
		batch = new SpriteBatch();

		Civilization.getInstance().getFontHandler().loadStyles();

		this.loadingLabel = new CustomLabel("Loading: 0%");
		loadingLabel.setPosition(Gdx.graphics.getWidth() / 2 - loadingLabel.getWidth() / 2,
				viewport.getWorldHeight() / 1.1F);
		loadingLabel.setAlignment(Align.center);
		stage.addActor(loadingLabel);
		Texture backgroundTexture = new Texture("ui_red.png");
		backgroundBar = new Sprite(backgroundTexture, 0, 0, 150, 15);
		Texture loadingTexture = new Texture("ui_green.png");
		loadingBar = new Sprite(loadingTexture, 0, 0, 150, 15);
	}

	@Override
	public void show() {
		super.show();
	}

	@Override
	public void render(float delta) {
		super.render(delta);

		float progress = assetHandler.getProgress();

		batch.begin();
		batch.draw(backgroundBar, Gdx.graphics.getWidth() / 2 - 150 / 2, (int) loadingLabel.getY() - 25, 150, 15);
		batch.draw(loadingBar, Gdx.graphics.getWidth() / 2 - 150 / 2, (int) loadingLabel.getY() - 25, 150 * (progress),
				15);
		batch.end();

		if (assetHandler.update()) {
			Civilization.getInstance().getSoundHandler().loadSounds();
			Civilization.getInstance().getScreenManager().setScreen(ScreenEnum.TITLE);
		} else {

			loadingLabel.setText(("Loading: " + (int) (progress * 100) + "%"));
		}
	}

	@Override
	public ScreenEnum getType() {
		return ScreenEnum.LOADING;
	}
}
