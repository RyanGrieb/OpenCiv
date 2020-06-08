package me.rhin.openciv.game;

import java.util.Random;

import me.rhin.openciv.game.map.GameMap;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tile.TileType;
import me.rhin.openciv.game.unit.Settler;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.Warrior;
import me.rhin.openciv.listener.LeftClickListener;
import me.rhin.openciv.listener.MouseMoveListener;
import me.rhin.openciv.listener.RightClickListener;
import me.rhin.openciv.ui.overlay.GameOverlay;
import me.rhin.openciv.ui.screen.type.InGameScreen;
import me.rhin.openciv.util.ClickType;

public class Game implements MouseMoveListener, LeftClickListener, RightClickListener {

	private InGameScreen screen;
	private GameMap map;
	private GameOverlay gameOveraly;

	private Tile hoveredTile;
	private Unit selectedUnit;
	private boolean rightMouseHeld;

	public Game(InGameScreen screen) {
		this.screen = screen;
		this.map = new GameMap(this);
		this.gameOveraly = new GameOverlay();
		this.screen.getOverlayStage().addActor(gameOveraly);

		placePlayers();
	}

	@Override
	public void onMouseMove(float x, float y) {

		Tile currentHoveredTile = map.getTileFromLocation(x, y);

		if (currentHoveredTile == null)
			return;

		if (rightMouseHeld) {
			if (!selectedUnit.getTargetTile().equals(hoveredTile))
				selectedUnit.setTargetTile(hoveredTile);
		}

		if (currentHoveredTile.equals(hoveredTile))
			return;

		if (hoveredTile != null)
			hoveredTile.onMouseUnhover();

		hoveredTile = currentHoveredTile;
		hoveredTile.onMouseHover();
	}

	@Override
	public void onLeftClick(float x, float y) {
		if (hoveredTile == null)
			return;

		// TODO: Account for clicking on cities in the future.
		if (hoveredTile.getUnits().size() < 1)
			return;

		hoveredTile.onLeftClick();
		selectedUnit = hoveredTile.getUnits().get(0);
	}

	@Override
	public void onRightClick(ClickType clickType, int x, int y) {
		if (selectedUnit == null)
			return;

		if (clickType == ClickType.DOWN) {
			// TODO: Check if the tile is passble for the unit.
			selectedUnit.setTargetTile(hoveredTile);
			rightMouseHeld = true;
		} else {
			selectedUnit.moveToTargetTile();
			selectedUnit.setSelected(false);
			selectedUnit = null;
			rightMouseHeld = false;
		}
	}

	private void placePlayers() {
		Random rnd = new Random();

		Tile tile = null;

		while (tile == null || !tile.getTileType().equals(TileType.GRASS)) {
			tile = map.getTiles()[rnd.nextInt(GameMap.WIDTH - 1)][rnd.nextInt(GameMap.HEIGHT - 1)];
		}

		Unit unit = new Settler(tile);
		tile.addUnit(unit);
		// FIXME: Instead of the game adding the actor, we should create an event such
		// as onActorCreation so that the InGameScreen can listen to & add it to the
		// stage
		// itself.
		screen.getStage().addActor(unit);

		screen.setCameraPosition(tile.getX(), tile.getY());

		for (Tile adjTile : tile.getAdjTiles()) {
			if (adjTile.getTileType().equals(TileType.GRASS)) {
				Unit warrior = new Warrior(adjTile);
				adjTile.addUnit(warrior);
				screen.getStage().addActor(warrior);
				 break;
			}
		}
	}

	public GameMap getGameMap() {
		return map;
	}

	public InGameScreen getScreen() {
		return screen;
	}

}
