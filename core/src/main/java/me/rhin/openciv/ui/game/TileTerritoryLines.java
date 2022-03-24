package me.rhin.openciv.ui.game;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.GL20;
import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.glutils.ShapeRenderer;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.tile.Tile;

public class TileTerritoryLines extends Actor {

	private City city;
	private ShapeRenderer shapeRenderer;

	public TileTerritoryLines(City city) {
		this.city = city;
		this.shapeRenderer = new ShapeRenderer();

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

		for (Tile tile : city.getTerritory()) {

			if (tile.getTileObservers().size() > 0 || !Civilization.SHOW_FOG) {
				// Draw the hexagon outline

				// FIXME: Don't render lines if they're off the screen. This isn't part of the
				// actor class so we need to manually put that in.

				for (int i = 0; i < tile.getTerritoryBorders().length; i++) {
					boolean renderLine = tile.getTerritoryBorders()[i];
					// System.out.println(renderLine);
					if (!renderLine) {
						continue;
					}
					// 0 = 5 0
					// 1 = 0 1
					// 2 = 1 2
					int v1 = i - 1;
					int v2 = i;
					if (v1 == -1) {
						v1 = 5;
						v2 = 0;
					}

					shapeRenderer.setColor(tile.getTerritory().getPlayerOwner().getCivilization().getBorderColor());
					shapeRenderer.line(tile.getVectors()[v1], tile.getVectors()[v2]);
				}
			}

		}

		Gdx.gl.glDisable(GL20.GL_BLEND);
		shapeRenderer.setColor(Color.WHITE);
		shapeRenderer.end();

		batch.begin();
	}

	@Override
	public boolean remove() {
		shapeRenderer.dispose();
		return super.remove();
	}
}
