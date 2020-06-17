package me.rhin.openciv.game.city;

import com.badlogic.gdx.graphics.g2d.Batch;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.InputEvent;
import com.badlogic.gdx.scenes.scene2d.utils.ClickListener;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.ui.button.Button;
import me.rhin.openciv.ui.label.CustomLabel;
import me.rhin.openciv.ui.window.type.CityInfoWindow;

public class City extends Actor {

	private Tile tile;
	private Player playerOwner;
	private CustomLabel nameLabel;

	public City(Tile tile, Player playerOwner, String name) {
		this.playerOwner = playerOwner;
		setName(name);
		this.nameLabel = new CustomLabel(name);
		nameLabel.setPosition(tile.getX() + tile.getWidth() / 2 - nameLabel.getWidth() / 2,
				tile.getY() + tile.getHeight() + 5);
		// Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().addActor(nameLabel);

		this.setPosition(nameLabel.getX(), nameLabel.getY());
		this.setSize(nameLabel.getWidth(), nameLabel.getHeight());

		Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().addActor(this);

		addListener(new ClickListener() {
			@Override
			public void clicked(InputEvent event, float x, float y) {
				if (!Civilization.getInstance().getWindowManager().allowsInput()) {
					return;
				}

				City cityActor = (City) event.getListenerActor();
				cityActor.onClick();
			}
		});
	}

	@Override
	public void draw(Batch batch, float parentAlpha) {
		nameLabel.draw(batch, parentAlpha);
	}

	public void onClick() {
		// TODO: Unselect selected unit
		Civilization.getInstance().getGame().getPlayer().unselectUnit();
		Civilization.getInstance().getWindowManager().toggleWindow(new CityInfoWindow(this));
	}
}
