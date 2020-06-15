package me.rhin.openciv.game;

import java.lang.reflect.Constructor;
import java.util.HashMap;

import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.GameMap;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.game.unit.type.Settler;
import me.rhin.openciv.listener.AddUnitListener;
import me.rhin.openciv.listener.DeleteUnitListener;
import me.rhin.openciv.listener.FetchPlayerListener;
import me.rhin.openciv.listener.LeftClickListener;
import me.rhin.openciv.listener.MouseMoveListener;
import me.rhin.openciv.listener.MoveUnitListener;
import me.rhin.openciv.listener.PlayerConnectListener;
import me.rhin.openciv.listener.PlayerListRequestListener;
import me.rhin.openciv.listener.RightClickListener;
import me.rhin.openciv.listener.SelectUnitListener;
import me.rhin.openciv.listener.SettleCityListener;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;

public class CivGame implements PlayerConnectListener, AddUnitListener, PlayerListRequestListener, FetchPlayerListener,
		MoveUnitListener, DeleteUnitListener, SettleCityListener {

	private GameMap map;
	private Player player;
	private HashMap<String, Player> players;

	public CivGame() {
		this.map = new GameMap();
		this.players = new HashMap<>();

		Civilization.getInstance().getEventManager().addListener(PlayerConnectListener.class, this);
		Civilization.getInstance().getEventManager().addListener(AddUnitListener.class, this);
		Civilization.getInstance().getEventManager().addListener(PlayerListRequestListener.class, this);
		Civilization.getInstance().getEventManager().addListener(FetchPlayerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(MoveUnitListener.class, this);
		Civilization.getInstance().getEventManager().addListener(DeleteUnitListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SettleCityListener.class, this);

		Civilization.getInstance().getNetworkManager().sendPacket(new FetchPlayerPacket());
		Civilization.getInstance().getNetworkManager().sendPacket(new PlayerListRequestPacket());
	}

	@Override
	public void onPlayerConnect(PlayerConnectPacket packet) {
		//
	}

	@Override
	public void onUnitAdd(AddUnitPacket packet) {

		try {
			Player playerOwner = players.get(packet.getPlayerOwner());
			Tile tile = map.getTiles()[packet.getTileGridX()][packet.getTileGridY()];
			UnitParameter unitParameter = new UnitParameter(packet.getUnitName(), playerOwner, tile);
			Class<? extends Unit> unitClass = (Class<? extends Unit>) Class
					.forName("me.rhin.openciv.game.unit.type." + packet.getUnitName());
			Constructor<?> ctor = unitClass.getConstructor(UnitParameter.class);
			Unit unit = (Unit) ctor.newInstance(new Object[] { unitParameter });
			tile.addUnit(unit);
			Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().addActor(unit);
			if (unit instanceof Settler && unit.getPlayerOwner().equals(player)) {
				// Focus camera on unit.
				Civilization.getInstance().getScreenManager().getCurrentScreen().setCameraPosition(unit.getX(),
						unit.getY());
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	public void onPlayerListRequested(PlayerListRequestPacket packet) {
		for (String playerName : packet.getPlayerList()) {
			if (playerName == null)
				continue;

			if (playerName.equals(player.getName()))
				players.put(playerName, player);
			else
				players.put(playerName, new Player(playerName));
		}
	}

	@Override
	public void onFetchPlayer(FetchPlayerPacket packet) {
		this.player = new Player(packet.getPlayerName());
		Civilization.getInstance().getEventManager().addListener(MouseMoveListener.class, player);
		Civilization.getInstance().getEventManager().addListener(LeftClickListener.class, player);
		Civilization.getInstance().getEventManager().addListener(RightClickListener.class, player);
		Civilization.getInstance().getEventManager().addListener(SelectUnitListener.class, player);
	}

	// FIXME: Move these 2 tile methods to map class?
	@Override
	public void onUnitMove(MoveUnitPacket packet) {
		Tile prevTile = map.getTiles()[packet.getPrevGridX()][packet.getPrevGridY()];
		Tile targetTile = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()];
		Unit unit = prevTile.getUnits().get(0);

		unit.setTargetTile(targetTile);
		unit.moveToTargetTile();

		// If we own this unit, add the movement cooldown.
		if (unit.getPlayerOwner().equals(player)) {
			unit.reduceMovement(packet.getMovementCost());
		}
	}

	@Override
	public void onUnitDelete(DeleteUnitPacket packet) {
		Tile tile = map.getTiles()[packet.getTileGridX()][packet.getTileGridY()];
		Unit unit = tile.getUnits().get(0);
		tile.removeUnit(unit);
		for (Actor actor : Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().getActors()) {
			if (actor.equals(unit))
				actor.addAction(Actions.removeActor());
		}
	}

	@Override
	public void onSettleCity(SettleCityPacket packet) {
		Player playerOwner = players.get(packet.getPlayerOwner());
		City city = new City(playerOwner);
		playerOwner.addCity(city);

		Tile tile = map.getTiles()[packet.getGridX()][packet.getGridY()];
		tile.setCity(city);
	}

	public GameMap getMap() {
		return map;
	}
}
