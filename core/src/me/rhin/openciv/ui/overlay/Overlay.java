package me.rhin.openciv.ui.overlay;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.scenes.scene2d.Actor;

public abstract class Overlay extends Actor {

	protected float x, y, width, height;

	public Overlay(float x, float y, float width, float height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	
	
	public abstract void draw(Batch batch, float parentAlpha);
}
