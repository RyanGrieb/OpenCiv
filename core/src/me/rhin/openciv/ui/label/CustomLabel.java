package me.rhin.openciv.ui.label;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.scenes.scene2d.ui.Label;

import me.rhin.openciv.Civilization;

public class CustomLabel extends Label {

	public static LabelStyle getDefaultStyle() {
		Label.LabelStyle labelStyle = new Label.LabelStyle();
		labelStyle.font = Civilization.getInstance().getFont();
		labelStyle.fontColor = Color.WHITE;

		return labelStyle;
	}

	public CustomLabel(CharSequence text) {
		super(text, getDefaultStyle());
	}

	public CustomLabel(CharSequence text, float x, float y, float width, float height) {
		super(text, getDefaultStyle());
		setPosition(x, y);
		setSize(width, height);
	}
}
