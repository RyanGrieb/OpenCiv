package me.rhin.openciv.ui.game;

import java.util.ArrayList;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.research.Technology;

public class TechLineWeb extends Actor {

	private ShapeRenderer shapeRenderer;
	private ArrayList<TechnologyLeaf> technologyLeafs;

	public TechLineWeb(ArrayList<TechnologyLeaf> technologyLeafs) {
		this.shapeRenderer = new ShapeRenderer();
		this.technologyLeafs = technologyLeafs;

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

		for (TechnologyLeaf leaf : technologyLeafs) {
			if (leaf.getTech().getRequiredTechs().size() > 0) {

				for (Class<? extends Technology> techClazz : leaf.getTech().getRequiredTechs()) {

					Technology tech = Civilization.getInstance().getGame().getPlayer().getResearchTree()
							.getTechnology(techClazz);

					for (TechnologyLeaf otherLeaf : technologyLeafs) {
						if (otherLeaf.getTech().equals(tech)) {

							// Draw line to other leaf of the required tech
							shapeRenderer.setColor(Color.WHITE);
							shapeRenderer.line(leaf.getBackVector(), otherLeaf.getFrontVector());
						}
					}
				}
			}
		}

		shapeRenderer.end();
		Gdx.gl.glDisable(GL20.GL_BLEND);

		batch.begin();
	}

	@Override
	public void setPosition(float x, float y) {

	}

	@Override
	public void setBounds(float x, float y, float w, float h) {

	}
}
