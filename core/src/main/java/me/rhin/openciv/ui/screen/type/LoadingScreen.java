package me.rhin.openciv.ui.screen.type;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.AssetHandler;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.screen.AbstractScreen;
import me.rhin.openciv.ui.screen.ScreenEnum;

public class LoadingScreen extends AbstractScreen {

	private AssetHandler assetHandler;
	//private CustomLabel loadingLabel;

	public LoadingScreen() {
		this.assetHandler = Civilization.getInstance().getAssetHandler();

		//this.loadingLabel = new CustomLabel("Loading: 0%");
		//loadingLabel.setPosition(Gdx.graphics.getWidth() / 2 - loadingLabel.getWidth() / 2,
		//		viewport.getWorldHeight() / 1.1F);
		//loadingLabel.setAlignment(Align.center);
		//stage.addActor(loadingLabel);
	}

	@Override
	public void show() {
		super.show();
	}

	@Override
	public void render(float delta) {
		super.render(delta);

		if (assetHandler.update()) {
			Civilization.getInstance().getFontHandler().loadStyles();
			Civilization.getInstance().getScreenManager().setScreen(ScreenEnum.TITLE);
		} else {
			float progress = assetHandler.getProgress();
			//loadingLabel.setText(("Loading: " + (int) (progress * 100) + "%"));
		}
	}
	
	@Override
	public ScreenEnum getType() {
		return ScreenEnum.LOADING;
	}
}
