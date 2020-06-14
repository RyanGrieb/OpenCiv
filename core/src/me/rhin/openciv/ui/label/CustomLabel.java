package me.rhin.openciv.ui.label;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.GlyphLayout;
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

		GlyphLayout layout = new GlyphLayout(getDefaultStyle().font, text);
		this.setSize(layout.width, layout.height);
	}

	public CustomLabel(CharSequence text, float x, float y, float width, float height) {
		this(text);
		setPosition(x, y);
		setSize(width, height);
	}

	public CustomLabel(CharSequence text, int textAlignment, float x, float y, float width, float height) {
		this(text, x, y, width, height);
		setAlignment(textAlignment);
	}
}
