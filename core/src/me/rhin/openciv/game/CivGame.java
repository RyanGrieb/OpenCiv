package me.rhin.openciv.game;

import java.util.HashMap;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.utils.reflect.ClassReflection;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.map.GameMap;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.game.unit.type.Settler.SettlerUnit;
import me.rhin.openciv.listener.AddUnitListener;
import me.rhin.openciv.listener.DeleteUnitListener;
import me.rhin.openciv.listener.FetchPlayerListener;
import me.rhin.openciv.listener.FinishLoadingRequestListener;
import me.rhin.openciv.listener.MoveUnitListener;
import me.rhin.openciv.listener.PlayerConnectListener;
import me.rhin.openciv.listener.PlayerListRequestListener;
import me.rhin.openciv.listener.SettleCityListener;
import me.rhin.openciv.listener.TerritoryGrowListener;
import me.rhin.openciv.listener.TurnTimeUpdateListener;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.FinishLoadingPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.packet.type.TerritoryGrowPacket;
import me.rhin.openciv.shared.packet.type.TurnTimeUpdatePacket;

public class CivGame implements PlayerConnectListener, AddUnitListener, PlayerListRequestListener, FetchPlayerListener,
		MoveUnitListener, DeleteUnitListener, SettleCityListener, TurnTimeUpdateListener, FinishLoadingRequestListener,
		TerritoryGrowListener {

	private static final int BASE_TURN_TIME = 9;

	private GameMap map;
	private Player player;
	private HashMap<String, Player> players;
	private int turnTime;
	private int turns;

	public CivGame() {
		this.map = new GameMap();
		this.players = new HashMap<>();
		this.turnTime = BASE_TURN_TIME;
		this.turns = 0;

		Civilization.getInstance().getEventManager().addListener(PlayerConnectListener.class, this);
		Civilization.getInstance().getEventManager().addListener(AddUnitListener.class, this);
		Civilization.getInstance().getEventManager().addListener(PlayerListRequestListener.class, this);
		Civilization.getInstance().getEventManager().addListener(FetchPlayerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(MoveUnitListener.class, this);
		Civilization.getInstance().getEventManager().addListener(DeleteUnitListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SettleCityListener.class, this);
		Civilization.getInstance().getEventManager().addListener(TurnTimeUpdateListener.class, this);
		Civilization.getInstance().getEventManager().addListener(FinishLoadingRequestListener.class, this);
		Civilization.getInstance().getEventManager().addListener(TerritoryGrowListener.class, this);

		Civilization.getInstance().getNetworkManager().sendPacket(new FetchPlayerPacket());
		Civilization.getInstance().getNetworkManager().sendPacket(new PlayerListRequestPacket());
	}

	@Override
	public void onPlayerConnect(PlayerConnectPacket packet) {
		//
	}

	@Override
	public void onUnitAdd(AddUnitPacket packet) {

		// Find unit class using reflection & create an instance of it.
		try {
			Player playerOwner = players.get(packet.getPlayerOwner());
			Tile tile = map.getTiles()[packet.getTileGridX()][packet.getTileGridY()];
			UnitParameter unitParameter = new UnitParameter(packet.getUnitID(), packet.getUnitName(), playerOwner,
					tile);

			Class<? extends Unit> unitClass = (Class<? extends Unit>) ClassReflection.forName(
					"me.rhin.openciv.game.unit.type." + packet.getUnitName() + "$" + packet.getUnitName() + "Unit");

			Unit unit = (Unit) ClassReflection.getConstructor(unitClass, UnitParameter.class)
					.newInstance(unitParameter);
			tile.addUnit(unit);
			Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().addActor(unit);

			if (unit instanceof SettlerUnit && unit.getPlayerOwner().equals(player)) {
				// Focus camera on unit.
				Civilization.getInstance().getScreenManager().getCurrentScreen().setCameraPosition(unit.getX(),
						unit.getY());
			}

		} catch (Exception e) {
			Gdx.app.log(Civilization.WS_LOG_TAG, e.getMessage());
			e.printStackTrace();
		}
	}

	@Override
	public void onPlayerListRequested(PlayerListRequestPacket packet) {
		for (int i = 0; i < packet.getPlayerList().length; i++) {
			String playerName = packet.getPlayerList()[i];
			if (playerName == null)
				continue;

			if (playerName.equals(player.getName()))
				players.put(playerName, player);
			else
				players.put(playerName, new Player(playerName));

			players.get(playerName).setColor(Color.valueOf(packet.getColorList()[i]));
		}
	}

	@Override
	public void onFetchPlayer(FetchPlayerPacket packet) {
		this.player = new Player(packet.getPlayerName());
	}

	// FIXME: Move these 2 tile methods to map class?
	@Override
	public void onUnitMove(MoveUnitPacket packet) {
		Tile prevTile = map.getTiles()[packet.getPrevGridX()][packet.getPrevGridY()];
		Tile targetTile = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()];
		Unit unit = prevTile.getUnitFromID(packet.getUnitID());

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
		Unit unit = tile.getUnitFromID(packet.getUnitID());
		unit.getPlayerOwner().removeUnit(unit);
		tile.removeUnit(unit);
		for (Actor actor : Civilization.getInstance().getScreenManager().getCurrentScreen().getStage().getActors()) {
			if (actor.equals(unit))
				actor.addAction(Actions.removeActor());
		}
	}

	@Override
	public void onSettleCity(SettleCityPacket packet) {
		Player playerOwner = players.get(packet.getPlayerOwner());

		Tile tile = map.getTiles()[packet.getGridX()][packet.getGridY()];
		City city = new City(tile, playerOwner, packet.getCityName());
		playerOwner.addCity(city);
		tile.setCity(city);
	}

	@Override
	public void onTurnTimeUpdate(TurnTimeUpdatePacket packet) {
		if (turnTime != packet.getTurnTime()) {
			Gdx.app.log(Civilization.LOG_TAG, "Updating turn time to: " + packet.getTurnTime());
			turnTime = packet.getTurnTime();
		}

		turns++;
	}

	@Override
	public void onFinishLoadingRequest(FinishLoadingPacket packet) {
		// FIXME: Actually check were done loading.
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

	@Override
	public void onTerritoryGrow(TerritoryGrowPacket packet) {
		Player player = players.get(packet.getPlayerOwner());
		City city = player.getCityFromName(packet.getCityName());
		Tile tile = map.getTiles()[packet.getGridX()][packet.getGridY()];
		city.growTerritory(tile);
	}

	public GameMap getMap() {
		return map;
	}

	public Player getPlayer() {
		return player;
	}

	public int getTurnTime() {
		return turnTime;
	}

	public int getTurn() {
		return turns;
	}
}
