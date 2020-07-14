package me.rhin.openciv.ui.button.type;

import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.ui.button.Button;

public class CitizenTileButton extends Button {

	private Tile tile;

	public CitizenTileButton(Tile tile, float x, float y, float width, float height) {
		super(TextureEnum.ICON_CITIZEN_UNWORKED, "", x, y, width, height);
		this.tile = tile;
	}

	@Override
	public void onClick() {
		System.out.println("Yo.");
	}

}
