package me.rhin.openciv.game;

import java.util.HashMap;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.utils.reflect.ClassReflection;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.civilization.CivType;
import me.rhin.openciv.game.map.GameMap;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.game.unit.type.Settler.SettlerUnit;
import me.rhin.openciv.listener.AddUnitListener;
import me.rhin.openciv.listener.CityStatUpdateListener;
import me.rhin.openciv.listener.DeleteUnitListener;
import me.rhin.openciv.listener.FetchPlayerListener;
import me.rhin.openciv.listener.FinishLoadingRequestListener;
import me.rhin.openciv.listener.LeftClickListener;
import me.rhin.openciv.listener.MoveUnitListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.listener.PlayerConnectListener;
import me.rhin.openciv.listener.PlayerListRequestListener;
import me.rhin.openciv.listener.RelativeMouseMoveListener;
import me.rhin.openciv.listener.RightClickListener;
import me.rhin.openciv.listener.SelectUnitListener;
import me.rhin.openciv.listener.SetCityHealthListener;
import me.rhin.openciv.listener.SetCityOwnerListener;
import me.rhin.openciv.listener.SetUnitOwnerListener;
import me.rhin.openciv.listener.SettleCityListener;
import me.rhin.openciv.listener.TerritoryGrowListener;
import me.rhin.openciv.listener.UnitAttackListener;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.packet.type.DeleteUnitPacket;
import me.rhin.openciv.shared.packet.type.EndTurnPacket;
import me.rhin.openciv.shared.packet.type.FetchPlayerPacket;
import me.rhin.openciv.shared.packet.type.FinishLoadingPacket;
import me.rhin.openciv.shared.packet.type.MoveUnitPacket;
import me.rhin.openciv.shared.packet.type.NextTurnPacket;
import me.rhin.openciv.shared.packet.type.PlayerConnectPacket;
import me.rhin.openciv.shared.packet.type.PlayerListRequestPacket;
import me.rhin.openciv.shared.packet.type.SetCityHealthPacket;
import me.rhin.openciv.shared.packet.type.SetCityOwnerPacket;
import me.rhin.openciv.shared.packet.type.SetUnitOwnerPacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.packet.type.TerritoryGrowPacket;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;
import me.rhin.openciv.ui.screen.type.InGameScreen;
import me.rhin.openciv.ui.window.type.CurrentResearchWindow;

//FIXME: Instead of the civ game listening for everything. Just split them off into the respective classes. (EX: UnitAttackListener in the Unit class)
public class CivGame implements PlayerConnectListener, AddUnitListener, PlayerListRequestListener, FetchPlayerListener,
		MoveUnitListener, DeleteUnitListener, SettleCityListener, NextTurnListener, FinishLoadingRequestListener,
		TerritoryGrowListener, UnitAttackListener, SetUnitOwnerListener, SetCityOwnerListener, SetCityHealthListener {

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

		Civilization.getInstance().getWindowManager().toggleWindow(new CurrentResearchWindow());

		Civilization.getInstance().getEventManager().addListener(PlayerConnectListener.class, this);
		Civilization.getInstance().getEventManager().addListener(AddUnitListener.class, this);
		Civilization.getInstance().getEventManager().addListener(PlayerListRequestListener.class, this);
		Civilization.getInstance().getEventManager().addListener(FetchPlayerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(MoveUnitListener.class, this);
		Civilization.getInstance().getEventManager().addListener(DeleteUnitListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SettleCityListener.class, this);
		Civilization.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Civilization.getInstance().getEventManager().addListener(FinishLoadingRequestListener.class, this);
		Civilization.getInstance().getEventManager().addListener(TerritoryGrowListener.class, this);
		Civilization.getInstance().getEventManager().addListener(UnitAttackListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetUnitOwnerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetCityOwnerListener.class, this);
		Civilization.getInstance().getEventManager().addListener(SetCityHealthListener.class, this);

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

			Class<? extends Unit> unitClass = (Class<? extends Unit>) ClassReflection
					.forName("me.rhin.openciv.game.unit.type." + packet.getUnitName().replaceAll("\\s", "") + "$"
							+ packet.getUnitName().replaceAll("\\s", "") + "Unit");

			Unit unit = (Unit) ClassReflection.getConstructor(unitClass, UnitParameter.class)
					.newInstance(unitParameter);
			tile.addUnit(unit);

			((InGameScreen) Civilization.getInstance().getScreenManager().getCurrentScreen()).getUnitGroup()
					.addActor(unit);

			if (unit instanceof SettlerUnit && unit.getPlayerOwner().equals(player) && turns < 1) {
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

			players.get(playerName).setCivType(CivType.valueOf(packet.getCivList()[i]));
		}
	}

	@Override
	public void onFetchPlayer(FetchPlayerPacket packet) {
		this.player = new Player(packet.getPlayerName());
		Civilization.getInstance().getEventManager().addListener(RelativeMouseMoveListener.class, player);
		Civilization.getInstance().getEventManager().addListener(LeftClickListener.class, player);
		Civilization.getInstance().getEventManager().addListener(RightClickListener.class, player);
		Civilization.getInstance().getEventManager().addListener(SelectUnitListener.class, player);
	}

	// FIXME: Move these 2 tile methods to map class?
	@Override
	public void onUnitMove(MoveUnitPacket packet) {
		Tile prevTile = map.getTiles()[packet.getPrevGridX()][packet.getPrevGridY()];
		Tile targetTile = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()];
		Unit unit = prevTile.getUnitFromID(packet.getUnitID());

		unit.setTargetTile(targetTile, false);
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
		for (Actor actor : ((InGameScreen) Civilization.getInstance().getScreenManager().getCurrentScreen())
				.getUnitGroup().getChildren()) {
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
	public void onNextTurn(NextTurnPacket packet) {
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

	@Override
	public void onUnitAttack(UnitAttackPacket packet) {
		Unit unit = map.getTiles()[packet.getUnitGridX()][packet.getUnitGridY()].getTopUnit();
		// FIXME: Not having a unit ID here is problematic.
		AttackableEntity targetEntity = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()]
				.getAttackableEntity();
		targetEntity.flashColor(Color.RED);

		unit.setHealth(unit.getHealth() - packet.getUnitDamage());
		unit.reduceMovement(2);
		targetEntity.setHealth(targetEntity.getHealth() - packet.getTargetUnitDamage());
	}

	@Override
	public void onSetUnitOwner(SetUnitOwnerPacket packet) {
		Unit unit = map.getTiles()[packet.getTileGridX()][packet.getTileGridY()].getUnitFromID(packet.getUnitID());
		unit.setPlayerOwner(players.get(packet.getPlayerOwner()));
	}

	@Override
	public void onSetCityHealth(SetCityHealthPacket packet) {
		// FIXME: Iterating through players to find the city seems silly
		for (Player player : players.values()) {
			City city = player.getCityFromName(packet.getCityName());
			if (city != null) {
				city.setHealth(packet.getHealth());
			}
		}
	}

	@Override
	public void onSetCityOwner(SetCityOwnerPacket packet) {
		// FIXME: Iterating through players to find the city seems silly
		for (Player player : players.values()) {
			City city = player.getCityFromName(packet.getCityName());
			if (city != null) {
				city.setOwner(players.get(packet.getPlayerName()));
				player.removeCity(city);
				players.get(packet.getPlayerName()).addCity(city);
			}
		}
	}

	public void endTurn() {
		EndTurnPacket packet = new EndTurnPacket();
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
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
