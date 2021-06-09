package me.rhin.openciv.game.map;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.graphics.g2d.Sprite;
import com.badlogic.gdx.math.Vector2;
import com.badlogic.gdx.scenes.scene2d.Actor;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;

public class RiverPart extends Actor {

	private Tile tile;
	private int side;
	private Sprite sprite;

	public RiverPart(Tile tile, int side) {
		this.tile = tile;
		this.side = side;

		// FIXME: Set actor rotation & pivot

		int vector = side == 0 ? 5 : side - 1;

		int nextVector = vector + 1;
		if (nextVector > 5)
			nextVector = 0;

		Vector2 tileVector = tile.getVectors()[vector];
		Vector2 nextTileVector = tile.getVectors()[nextVector];

		Vector2 hexCenterVector = new Vector2(
				((tile.getVectors()[1].x - tile.getVectors()[5].x) / 2) + tile.getVectors()[5].x,
				((tile.getVectors()[4].y - tile.getVectors()[5].y) / 2) + tile.getVectors()[5].y);

		// TODO: Now /w the center, we want to expand out the existing tile vectors by a
		// bit

		Vector2[] expandedVectors = new Vector2[6];
		for (int i = 0; i < expandedVectors.length; i++) {
			// Find different between two points, if same, dont add. If different. Add the
			// diffence over 16

			// Divide is distance, - is the center
			// 0 - 16 /16
			//

			// Distance

			expandedVectors[i] = new Vector2(
					tile.getVectors()[i].x + ((tile.getVectors()[i].x - hexCenterVector.x)
							/ (tile.getVectors()[i].dst(hexCenterVector)) * 1.1F),
					tile.getVectors()[i].y + ((tile.getVectors()[i].y - hexCenterVector.y)
							/ (tile.getVectors()[i].dst(hexCenterVector)) * 1.1F));
		}

		this.setBounds(expandedVectors[vector].x, expandedVectors[vector].y,
				expandedVectors[vector].dst(expandedVectors[nextVector]), 2);

		double angle = Math.toDegrees(Math.atan2(nextTileVector.x - tileVector.x, nextTileVector.y - tileVector.y));
		this.sprite = TextureEnum.TILE_RIVER.sprite();
		this.sprite.setBounds(getX(), getY(), getWidth(), getHeight());
		this.sprite.setOrigin(0, 0);
		this.sprite.rotate(90 - (float) angle);
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		// FIXME: Don't draw on top of one another if there are two tile sides.
		if(tile.isDiscovered())
		sprite.draw(batch);
	}
}
