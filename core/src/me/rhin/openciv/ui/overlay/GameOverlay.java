package me.rhin.openciv.ui.overlay;

import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.ui.game.StatusBar;
import me.rhin.openciv.ui.label.CustomLabel;

public class GameOverlay extends Overlay {
	private CustomLabel fpsLabel;
	private StatusBar statusBar;

	public GameOverlay() {

		this.fpsLabel = new CustomLabel("FPS: 0", 4, 4, viewport.getWorldWidth(), 20);
		this.addActor(fpsLabel);

		// FIXME: Move the topbar & icons to it's own UI actor class
		this.statusBar = new StatusBar(0, viewport.getWorldHeight() - 20, viewport.getWorldWidth(), 20);
		addActor(statusBar);
		/*
		 * this.hertiageDescLabel = new CustomLabel("Hertiage:");
		 * hertiageDescLabel.setSize(40, 20); hertiageDescLabel.setPosition(x + 110, y -
		 * 2);
		 * 
		 * this.heritageIcon = TextureEnum.ICON_HERITAGE.sprite();
		 * heritageIcon.setPosition(x + 193, y + 3); heritageIcon.setSize(12, 12);
		 * 
		 * this.hertiageLabel = new CustomLabel("0"); hertiageLabel.setSize(40, 20);
		 * hertiageLabel.setPosition(x + 195, y - 2);
		 * hertiageLabel.setAlignment(Align.center);
		 * 
		 * this.goldDescLabel = new CustomLabel("Gold:"); goldDescLabel.setSize(40, 20);
		 * goldDescLabel.setPosition(x + 230, y - 2);
		 * 
		 * this.goldIcon = TextureEnum.ICON_GOLD.sprite(); goldIcon.setPosition(x + 277,
		 * y + 3); goldIcon.setSize(12, 12);
		 * 
		 * this.goldLabel = new CustomLabel("0"); goldLabel.setSize(40, 20);
		 * goldLabel.setPosition(x + 280, y - 2); goldLabel.setAlignment(Align.center);
		 */
	}

	public CustomLabel getFPSLabel() {
		return fpsLabel;
	}

}
