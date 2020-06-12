package me.rhin.openciv.game;

import java.lang.reflect.Constructor;
import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.map.GameMap;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.listener.AddUnitListener;
import me.rhin.openciv.listener.GameStartListener;
import me.rhin.openciv.listener.LeftClickListener;
import me.rhin.openciv.listener.MouseMoveListener;
import me.rhin.openciv.listener.PlayerConnectListener;
import me.rhin.openciv.listener.RightClickListener;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.ui.screen.type.InGameScreen;
import me.rhin.openciv.util.ClickType;

public class CivGame
		implements MouseMoveListener, LeftClickListener, RightClickListener, PlayerConnectListener, AddUnitListener {

	private GameMap map;
	private Tile hoveredTile;
	private Unit selectedUnit;
	private boolean rightMouseHeld;

	public CivGame() {
		this.map = new GameMap(this);

		Civilization.getInstance().getEventManager().addListener(MouseMoveListener.class, this);
		Civilization.getInstance().getEventManager().addListener(LeftClickListener.class, this);
		Civilization.getInstance().getEventManager().addListener(RightClickListener.class, this);
		Civilization.getInstance().getEventManager().addListener(PlayerConnectListener.class, this);
		Civilization.getInstance().getEventManager().addListener(AddUnitListener.class, this);
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

	@Override
	public void onPlayerConnect(PlayerConnectPacket packet) {
		//
	}

	@Override
	public void onUnitAdd(AddUnitPacket packet) {
		try {
			Tile tile = map.getTiles()[packet.getTileGridX()][packet.getTileGridY()];
			Class<? extends Unit> unitClass = (Class<? extends Unit>) Class
					.forName("me.rhin.openciv.game.unit.type." + packet.getUnitName());
			Constructor<?> ctor = unitClass.getConstructor(Tile.class);
			Unit unit = (Unit) ctor.newInstance(new Object[] { tile });
			tile.addUnit(unit);
			Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().addActor(unit);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public GameMap getMap() {
		return map;
	}
}
