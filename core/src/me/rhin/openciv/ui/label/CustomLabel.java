package me.rhin.openciv.ui.label;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.utils.Align;

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

	public CustomLabel(CharSequence text, int textAlignment, float x, float y, float width, float height) {
		super(text, getDefaultStyle());
		setAlignment(textAlignment);
		setPosition(x, y);
		setSize(width, height);
	}
}
