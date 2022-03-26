package me.rhin.openciv.game.map.tile;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.scenes.scene2d.Group;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.map.tile.Tile.TileTypeWrapper;

public class TopTileGroup extends Group {

	private Tile tile;

	public TopTileGroup(Tile tile) {
		this.tile = tile;
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		int index = 0;

		if (tile.isDiscovered() || !Civilization.SHOW_FOG)
			for (TileTypeWrapper sprite : tile.getTileTypeWrappers()) {

				index++;

				if (index == 1)
					continue;

				sprite.draw(batch);
			}

		if (!tile.isDiscovered() && Civilization.SHOW_FOG) {
			tile.getFogSprite().draw(batch);
		}

		if (tile.getTileObservers().size() < 1 && Civilization.SHOW_FOG) {
			tile.getNonVisibleSprite().draw(batch);
		}

		if (tile.isHovered()) {
			tile.getHoveredSprite().draw(batch);
		}

		if (tile.getTerritory() != null && (tile.getTileObservers().size() > 0 || !Civilization.SHOW_FOG)
				&& !tile.hasRangedTarget())
			tile.getTerritorySprite().draw(batch);

		if (tile.hasRangedTarget()) {
			tile.getRangedTargetSprite().draw(batch);
		}
	}
}
