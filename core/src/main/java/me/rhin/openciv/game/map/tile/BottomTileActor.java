package me.rhin.openciv.game.map.tile;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.map.tile.Tile.TileTypeWrapper;

public class BottomTileActor extends Actor {

	private Tile tile;

	public BottomTileActor(Tile tile) {
		this.tile = tile;
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {

		if (tile.isDiscovered() || !Civilization.SHOW_FOG) {
			TileTypeWrapper sprite = tile.getTileTypeWrappers().first();

			sprite.draw(batch);
		}
	}
}
