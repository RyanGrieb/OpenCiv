package me.rhin.openciv.ui.font;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.scenes.scene2d.ui.Label.LabelStyle;

import me.rhin.openciv.Civilization;

public class FontHandler {

	private LabelStyle defaultLabelStyle;

	public FontHandler() {
	}

	public void loadStyles() {
		this.defaultLabelStyle = new Label.LabelStyle();
		this.defaultLabelStyle.font = Civilization.getInstance().getAssetHandler().get("fonts/font.fnt",
				BitmapFont.class);
		this.defaultLabelStyle.fontColor = Color.WHITE;
	}

	public LabelStyle getDefaultStyle() {
		return defaultLabelStyle;
	}

}
