package me.rhin.openciv.ui.label;

import com.badlogic.gdx.graphics.g2d.GlyphLayout;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.ui.Label;
import com.badlogic.gdx.utils.Null;

import me.rhin.openciv.Civilization;

public class CustomLabel extends Label {

	public CustomLabel(CharSequence text) {
		super(text, Civilization.getInstance().getFontHandler().getDefaultStyle());
		this.setScale(10);
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

	// FIXME: I have no idea why, even with the bouding boxes in the correct
	// positions.
	// Does the libgdx click event detect labels overriding random actors such as
	// buttons & groups.
	@Override
	public @Null Actor hit(float x, float y, boolean touchable) {
		return null;
	}
	

	private void updateSize() {
		GlyphLayout layout = new GlyphLayout(Civilization.getInstance().getFontHandler().getDefaultStyle().font,
				getText());
		this.setSize(layout.width, layout.height);
	}
}
