package me.rhin.openciv.ui.game;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.game.unit.Unit;

public class UnitHealthBubble extends Actor {

	private static final ShapeRenderer shapeRenderer =  new ShapeRenderer();
	private Unit unit;

	public UnitHealthBubble(Unit unit) {
		shapeRenderer.setAutoShapeType(true);

		this.unit = unit;
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);

		batch.end();

		shapeRenderer.setProjectionMatrix(batch.getProjectionMatrix());

		Gdx.gl.glEnable(GL20.GL_BLEND);
		Gdx.gl.glBlendFunc(GL20.GL_SRC_ALPHA, GL20.GL_ONE_MINUS_SRC_ALPHA);
		shapeRenderer.begin(ShapeRenderer.ShapeType.Filled);

		float healthOffset = unit.getHealth() / unit.getMaxHealth();

		float greenFill = (360 * healthOffset);
		float redFill = 360 - greenFill;

		shapeRenderer.setColor(Color.GREEN);
		shapeRenderer.arc(getX(), getY(), 5, 90, greenFill);

		shapeRenderer.setColor(Color.RED);
		shapeRenderer.arc(getX(), getY(), 5, 90 - redFill , redFill);
		
		// shapeRenderer.circle(getX(), getY(), 5);

		shapeRenderer.end();
		Gdx.gl.glDisable(GL20.GL_BLEND);
		Gdx.gl.glLineWidth(1f);
		shapeRenderer.setColor(Color.WHITE);

		batch.begin();
	}
}
