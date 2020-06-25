package me.rhin.openciv.ui.list;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;

public abstract class ListItem {

	private int yOffset;
	private float x, y;
	private float width, height;
	private Sprite backgroundSprite;

	public ListItem(float width, float height) {
		this.yOffset = 0;
		this.width = width;
		this.height = height;
	}

	public abstract void draw(Batch batch, float parentAlpha);

	public void setPosition(float x, float y) {
		this.x = x;
		this.y = y;
	}

	public void setYOffset(int yOffset) {
		this.yOffset = yOffset;
	}

	public float getHeight() {
		return height;
	}

	public float getY() {
		return y;
	}
}
