package me.rhin.openciv.game.map.tooltip;

import java.util.ArrayList;
import java.util.Iterator;

import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.ui.screen.type.InGameScreen;

public class TileTooltipHandler implements Listener {

	ArrayList<Actor> tileTooltipActors;

	public TileTooltipHandler() {
		this.tileTooltipActors = new ArrayList<>();

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onRender() {
		handleCombatTooltips();
	}

	public void flashIcon(Tile tile, TextureEnum textureEnum) {
		CombatActor newCombatActor = new CombatActor(textureEnum, tile.getX() + 6, tile.getY() + 8, 16, 16);

		((InGameScreen) Civilization.getInstance().getScreenManager().getCurrentScreen()).getCombatTooltipGroup()
				.addActor(newCombatActor);

		tileTooltipActors.add(newCombatActor);
	}

	private void handleCombatTooltips() {
		Iterator<Actor> iterator = tileTooltipActors.iterator();
		while (iterator.hasNext()) {
			Actor actor = iterator.next();
			CombatActor combatActor = (CombatActor) actor;
			if (combatActor.isVisible()) {
				iterator.remove();
				combatActor.addAction(Actions.removeActor());
			}
		}
	}

}
