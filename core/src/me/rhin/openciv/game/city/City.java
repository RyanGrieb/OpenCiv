package me.rhin.openciv.game.city;

import com.badlogic.gdx.utils.Align;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.ui.label.CustomLabel;

public class City {

	private Tile tile;
	private Player playerOwner;
	private String name;
	private CustomLabel nameLabel;

	public City(Tile tile, Player playerOwner, String name) {
		this.playerOwner = playerOwner;
		this.name = name;
		this.nameLabel = new CustomLabel(name);
		nameLabel.setPosition(tile.getX() + tile.getWidth() / 2 - nameLabel.getWidth() / 2,
				tile.getY() + tile.getHeight() + 5);
		Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().addActor(nameLabel);
	}

}
