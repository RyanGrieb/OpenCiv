package me.rhin.openciv.ui.overlay;

import javax.swing.GroupLayout.Alignment;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.utils.Align;
import com.badlogic.gdx.utils.viewport.Viewport;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.label.CustomLabel;

public class GameOverlay extends Overlay {

	private CustomLabel fpsLabel;
	private Sprite topBar;
	private Sprite scienceIcon;
	private CustomLabel scienceLabel;

	public GameOverlay(Viewport viewport) {
		super(0, viewport.getWorldHeight() - 20, viewport.getWorldWidth(), 20);

		this.fpsLabel = new CustomLabel("FPS: 0", 4, 4, viewport.getWorldWidth(), 20);

		this.topBar = TextureEnum.UI_BLACK.sprite();
		topBar.setPosition(x, y);
		topBar.setSize(width, height);

		this.scienceIcon = TextureEnum.ICON_RESEARCH.sprite();
		scienceIcon.setPosition(x + 1, y + 3);
		scienceIcon.setSize(12, 12);

		this.scienceLabel = new CustomLabel("0");
		scienceLabel.setSize(43, 20);
		scienceLabel.setPosition(x, y - 2);
		scienceLabel.setAlignment(Align.center);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		topBar.draw(batch);
		scienceIcon.draw(batch);
		scienceLabel.draw(batch, parentAlpha);
		fpsLabel.draw(batch, parentAlpha);
	}

	public CustomLabel getFPSLabel() {
		return fpsLabel;
	}

}
