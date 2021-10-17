package me.rhin.openciv.ui.font;

import com.badlogic.gdx.Gdx;
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
		BitmapFont font = new BitmapFont(Gdx.files.internal("fonts/font.fnt"));
		this.defaultLabelStyle.font = font;
		this.defaultLabelStyle.fontColor = Color.WHITE;
	}

	public LabelStyle getDefaultStyle() {
		return defaultLabelStyle;
	}

}
