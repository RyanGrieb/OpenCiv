package me.rhin.openciv.ui.game;

import java.util.ArrayList;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.utils.viewport.Viewport;

import me.rhin.openciv.Civilization;

public class HeritageLineWeb extends Actor {

	private ShapeRenderer shapeRenderer;
	private ArrayList<HeritageLeaf> heritageLeafs;

	public HeritageLineWeb(ArrayList<HeritageLeaf> heritageLeafs) {
		this.shapeRenderer = new ShapeRenderer();
		this.heritageLeafs = heritageLeafs;

		shapeRenderer.setAutoShapeType(true);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		super.draw(batch, parentAlpha);

		batch.end();

		shapeRenderer.setProjectionMatrix(batch.getProjectionMatrix());

		Gdx.gl.glEnable(GL20.GL_BLEND);
		Gdx.gl.glBlendFunc(GL20.GL_SRC_ALPHA, GL20.GL_ONE_MINUS_SRC_ALPHA);
		
		shapeRenderer.begin();

		// Get max level and draw lines on the way down
		int maxLevel = 0;
		for (HeritageLeaf leaf : heritageLeafs) {
			if (maxLevel < leaf.getHeritage().getLevel())
				maxLevel = leaf.getHeritage().getLevel();
		}
		
		Viewport viewport = Civilization.getInstance().getCurrentScreen().getViewport();
		
		for (int i = 0; i < maxLevel + 1; i++) {
			shapeRenderer.setColor(Color.WHITE);
			shapeRenderer.line(0, viewport.getWorldHeight() - 125 * (i + 1), viewport.getWorldWidth(),
					viewport.getWorldHeight() - 125 * (i + 1));
		}

		shapeRenderer.end();
		Gdx.gl.glDisable(GL20.GL_BLEND);

		batch.begin();
	}
}
