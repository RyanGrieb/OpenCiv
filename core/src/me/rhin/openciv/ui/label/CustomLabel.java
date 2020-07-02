package me.rhin.openciv.ui.label;

import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.GlyphLayout;
import com.badlogic.gdx.scenes.scene2d.ui.Label;

import me.rhin.openciv.Civilization;

public class CustomLabel extends Label {

	public CustomLabel(CharSequence text) {
		super(text, Civilization.getInstance().getFontHandler().getDefaultStyle());
		updateSize();
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

	@Override
	public boolean setText(int value) {
		boolean returnValue = super.setText(value);
		updateSize();
		return returnValue;
	}

	@Override
	public void setText(CharSequence newText) {
		super.setText(newText);
		updateSize();
	}

	private void updateSize() {
		GlyphLayout layout = new GlyphLayout(Civilization.getInstance().getFontHandler().getDefaultStyle().font,
				getText());
		this.setSize(layout.width, layout.height);
	}
}
