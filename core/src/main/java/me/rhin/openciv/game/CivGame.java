package me.rhin.openciv.game;

import java.util.ArrayList;
import java.util.HashMap;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.scenes.scene2d.Actor;
import com.badlogic.gdx.scenes.scene2d.actions.Actions;
import com.badlogic.gdx.utils.reflect.ClassReflection;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum;
import me.rhin.openciv.asset.SoundEnum.SoundType;
import me.rhin.openciv.asset.TextureEnum;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.city.wonders.GameWonders;
import me.rhin.openciv.game.civilization.Civ;
import me.rhin.openciv.game.civilization.type.CityState;
import me.rhin.openciv.game.civilization.type.CityState.CityStateType;
import me.rhin.openciv.game.map.GameMap;
import me.rhin.openciv.game.map.tile.Tile;
import me.rhin.openciv.game.map.tooltip.TileTooltipHandler;
import me.rhin.openciv.game.notification.NotificationHandler;
import me.rhin.openciv.game.notification.type.AvailableMovementNotification;
import me.rhin.openciv.game.notification.type.AvailableProductionNotification;
import me.rhin.openciv.game.notification.type.NotResearchingNotification;
import me.rhin.openciv.game.notification.type.NotStudyingNotification;
import me.rhin.openciv.game.player.AIPlayer;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.player.Player;
import me.rhin.openciv.game.unit.AttackableEntity;
import me.rhin.openciv.game.unit.Unit;
import me.rhin.openciv.game.unit.UnitParameter;
import me.rhin.openciv.game.unit.type.Settler.SettlerUnit;
import me.rhin.openciv.listener.AddUnitListener;
import me.rhin.openciv.listener.DeleteUnitListener;
import me.rhin.openciv.listener.FetchPlayerListener;
import me.rhin.openciv.listener.FinishLoadingRequestListener;
import me.rhin.openciv.listener.LeftClickListener;
import me.rhin.openciv.listener.MoveUnitListener;
import me.rhin.openciv.listener.NextTurnListener;
import me.rhin.openciv.listener.PlayerConnectListener;
import me.rhin.openciv.listener.PlayerListRequestListener;
import me.rhin.openciv.listener.PlayerStatUpdateListener;
import me.rhin.openciv.listener.RelativeMouseMoveListener;
import me.rhin.openciv.listener.RightClickListener;
import me.rhin.openciv.listener.SelectUnitListener;
import me.rhin.openciv.listener.SetCityHealthListener;
import me.rhin.openciv.listener.SetCityOwnerListener;
import me.rhin.openciv.listener.SetUnitHealthListener;
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
import me.rhin.openciv.shared.packet.type.RequestEndTurnPacket;
import me.rhin.openciv.shared.packet.type.SetCityHealthPacket;
import me.rhin.openciv.shared.packet.type.SetCityOwnerPacket;
import me.rhin.openciv.shared.packet.type.SetUnitHealthPacket;
import me.rhin.openciv.shared.packet.type.SetUnitOwnerPacket;
import me.rhin.openciv.shared.packet.type.SettleCityPacket;
import me.rhin.openciv.shared.packet.type.TerritoryGrowPacket;
import me.rhin.openciv.shared.packet.type.UnitAttackPacket;
import me.rhin.openciv.shared.util.StrUtil;
import me.rhin.openciv.ui.screen.type.InGameScreen;
import me.rhin.openciv.ui.window.type.CurrentHeritageWindow;
import me.rhin.openciv.ui.window.type.CurrentResearchWindow;
import me.rhin.openciv.ui.window.type.InfoButtonsWindow;
import me.rhin.openciv.ui.window.type.NextTurnWindow;
import me.rhin.openciv.ui.window.type.NotificationWindow;

//FIXME: Instead of the civ game listening for everything. Just split them off into the respective classes. (EX: UnitAttackListener in the Unit class)
public class CivGame implements PlayerConnectListener, AddUnitListener, PlayerListRequestListener, FetchPlayerListener,
		MoveUnitListener, DeleteUnitListener, SettleCityListener, NextTurnListener, FinishLoadingRequestListener,
		TerritoryGrowListener, UnitAttackListener, SetUnitOwnerListener, SetCityOwnerListener, SetCityHealthListener,
		SetUnitHealthListener {

	private static final int BASE_TURN_TIME = 9;

	private GameMap map;
	private Player player;
	private HashMap<String, AbstractPlayer> players;
	private NotificationHandler notificationHandler;
	private GameWonders gameWonders;
	private TileTooltipHandler tileTooltipHandler;
	private int turnTime;
	private int turns;

	public CivGame() {
		this.map = new GameMap();
		this.players = new HashMap<>();
		this.gameWonders = new GameWonders();
		this.tileTooltipHandler = new TileTooltipHandler();
		this.turnTime = BASE_TURN_TIME;
		this.turns = 0;

		Civilization.getInstance().getSoundHandler().playTrackBySoundtype(SoundType.AMBIENCE);

		NotificationWindow notificationWindow = new NotificationWindow();
		Civilization.getInstance().getWindowManager().toggleWindow(notificationWindow);
		this.notificationHandler = new NotificationHandler(notificationWindow);

		Civilization.getInstance().getWindowManager().toggleWindow(new NextTurnWindow());
		Civilization.getInstance().getWindowManager().toggleWindow(new InfoButtonsWindow());

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
		Civilization.getInstance().getEventManager().addListener(SetUnitHealthListener.class, this);

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
			AbstractPlayer playerOwner = players.get(packet.getPlayerOwner());
			Tile tile = map.getTiles()[packet.getTileGridX()][packet.getTileGridY()];
			UnitParameter unitParameter = new UnitParameter(packet.getUnitID(), packet.getUnitName(), playerOwner,
					tile);

			Class<? extends Unit> unitClass = (Class<? extends Unit>) ClassReflection
					.forName("me.rhin.openciv.game.unit.type." + packet.getUnitName().replaceAll("\\s", "") + "$"
							+ packet.getUnitName().replaceAll("\\s", "") + "Unit");

			Unit unit = (Unit) ClassReflection.getConstructor(unitClass, UnitParameter.class)
					.newInstance(unitParameter);

			if (packet.getUnitMovement() != -1)
				unit.setMovement(packet.getUnitMovement());

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
			String civilizationName = packet.getCivList()[i];
			if (playerName == null)
				continue;

			// TODO: Have a seperate AI playerlist?
			if (packet.getAIList()[i]) {
				players.put(playerName, new AIPlayer(playerName));
			} else {
				if (playerName.equals(player.getName()))
					players.put(playerName, player);
				else
					players.put(playerName, new Player(playerName));
			}

			// TODO: Handle reflection of citystates better.
			String civName = StrUtil.capitalize(civilizationName.toLowerCase());
			try {
				Class<? extends Civ> civClass = null;
				if (civName.contains("citystate")) {
					civClass = ClassReflection.forName("me.rhin.openciv.game.civilization.type.CityState");
				} else
					civClass = ClassReflection.forName("me.rhin.openciv.game.civilization.type." + civName);

				Civ civ = (Civ) ClassReflection.getConstructor(civClass, AbstractPlayer.class)
						.newInstance(players.get(playerName));

				if (civName.contains("citystate")) {
					CityState cityState = (CityState) civ;
					civName = civName.toUpperCase();
					cityState.setCityStateType(CityStateType.valueOf(civName.substring(0, civName.indexOf('_'))));
				}

				players.get(playerName).setCivilization(civ);
			} catch (Exception e) {
				e.printStackTrace();
			}

		}
	}

	@Override
	public void onFetchPlayer(FetchPlayerPacket packet) {
		this.player = new Player(packet.getPlayerName());
		Civilization.getInstance().getEventManager().addListener(RelativeMouseMoveListener.class, player);
		Civilization.getInstance().getEventManager().addListener(LeftClickListener.class, player);
		Civilization.getInstance().getEventManager().addListener(RightClickListener.class, player);
		Civilization.getInstance().getEventManager().addListener(SelectUnitListener.class, player);
		Civilization.getInstance().getEventManager().addListener(PlayerStatUpdateListener.class, player);
		Civilization.getInstance().getEventManager().addListener(DeleteUnitListener.class, player);

	}

	// FIXME: Move these 2 tile methods to map class?
	@Override
	public void onUnitMove(MoveUnitPacket packet) {
		Tile prevTile = map.getTiles()[packet.getPrevGridX()][packet.getPrevGridY()];
		Tile targetTile = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()];
		Unit unit = prevTile.getUnitFromID(packet.getUnitID());

		// FIXME: This still is null sometimes. W/ barbarian AI & cities states
		if (unit == null) {
			for (AbstractPlayer player : this.getPlayers().values())
				for (Unit playerUnit : player.getOwnedUnits())
					if (playerUnit.getID() == packet.getUnitID()) {
						System.out.println("Move error at:" + playerUnit.getStandingTile().getGridX() + ","
								+ playerUnit.getStandingTile().getGridY());
					}
			System.out.println("MOVE NULL:" + packet.getUnitID());
			// System.exit(1);
		}

		// TODO: Have force set target tile still init values like setTargetTile()
		unit.forceSetTargetTile(targetTile);
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

		// FIXME: This still is null sometimes. W/ barbarian AI & cities states
		if (unit == null) {
			System.out.println("DELETE NULL:" + packet.getUnitID());
			// System.exit(1);
		}

		System.out.println("Deleting unit from: " + unit.getPlayerOwner().getName());
		unit.kill();
		tile.removeUnit(unit);
		unit.getPlayerOwner().removeUnit(unit);

		for (Actor actor : ((InGameScreen) Civilization.getInstance().getScreenManager().getCurrentScreen())
				.getUnitGroup().getChildren()) {
			if (actor.equals(unit))
				actor.addAction(Actions.removeActor());
		}

		if (packet.isKilled())
			tileTooltipHandler.flashIcon(tile, TextureEnum.ICON_SKULL);

		if (packet.isKilled() && unit.getPlayerOwner().equals(player)) {
			Civilization.getInstance().getSoundHandler().playEffect(SoundEnum.UNIT_DEATH);
		}
	}

	@Override
	public void onSettleCity(SettleCityPacket packet) {
		AbstractPlayer playerOwner = players.get(packet.getPlayerOwner());

		Tile tile = map.getTiles()[packet.getGridX()][packet.getGridY()];
		City city = new City(tile, playerOwner, packet.getCityName());
		playerOwner.addCity(city);
		tile.setCity(city);

		if (playerOwner.equals(player) && playerOwner.getOwnedCities().size() <= 1) {

			Civilization.getInstance().getWindowManager().toggleWindow(new CurrentResearchWindow());
			Civilization.getInstance().getWindowManager().toggleWindow(new CurrentHeritageWindow());

			Civilization.getInstance().getGame().getNotificationHanlder()
					.fireNotification(new NotResearchingNotification());

			Civilization.getInstance().getGame().getNotificationHanlder()
					.fireNotification(new NotStudyingNotification());
		}
	}

	@Override
	public void onNextTurn(NextTurnPacket packet) {
		if (turnTime != packet.getTurnTime()) {
			Gdx.app.log(Civilization.LOG_TAG, "Updating turn time to: " + packet.getTurnTime());
			turnTime = packet.getTurnTime();
		}

		Civilization.getInstance().getSoundHandler().playEffect(SoundEnum.NEXT_TURN);
		// SoundEnum.playSound(SoundEnum.NEXT_TURN);

		turns++;
	}

	@Override
	public void onFinishLoadingRequest(FinishLoadingPacket packet) {
		// FIXME: Actually check were done loading.
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

	@Override
	public void onTerritoryGrow(TerritoryGrowPacket packet) {
		AbstractPlayer player = players.get(packet.getPlayerOwner());
		City city = player.getCityFromName(packet.getCityName());
		Tile tile = map.getTiles()[packet.getGridX()][packet.getGridY()];
		city.growTerritory(tile);
	}

	@Override
	public void onUnitAttack(UnitAttackPacket packet) {
		Unit unit = map.getTiles()[packet.getUnitGridX()][packet.getUnitGridY()].getUnitFromID(packet.getUnitID());
		// FIXME: Not having a unit ID here is problematic.
		AttackableEntity targetEntity = null;
		// If the target is a city.
		if (packet.getTargetID() == -1) {
			targetEntity = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()].getCity();
		} else {

			targetEntity = map.getTiles()[packet.getTargetGridX()][packet.getTargetGridY()]
					.getUnitFromID(packet.getTargetID());
		}

		targetEntity.flashColor(Color.RED);

		unit.setHealth(unit.getHealth() - packet.getUnitDamage());
		unit.reduceMovement(2);
		unit.flashColor(Color.YELLOW);

		if (unit.getStandingTile().getTileObservers().size() > 0)
			tileTooltipHandler.flashIcon(unit.getStandingTile(), TextureEnum.ICON_COMBAT);

		if (targetEntity.getTile().getTileObservers().size() > 0)
			tileTooltipHandler.flashIcon(targetEntity.getTile(), TextureEnum.ICON_SHIELD);

		targetEntity.setHealth(targetEntity.getHealth() - packet.getTargetUnitDamage());

		if (unit.getPlayerOwner().equals(player) || targetEntity.getPlayerOwner().equals(player))
			Civilization.getInstance().getSoundHandler().playEffect(SoundEnum.UNIT_COMBAT);
	}

	@Override
	public void onSetUnitOwner(SetUnitOwnerPacket packet) {
		Unit unit = map.getTiles()[packet.getTileGridX()][packet.getTileGridY()].getUnitFromID(packet.getUnitID());
		unit.setPlayerOwner(players.get(packet.getPlayerOwner()));

		//Send movement notification for captured units
		if (Civilization.getInstance().getGame().getPlayer().equals(unit.getPlayerOwner())
				&& unit.getCurrentMovement() > 0) {
			
			Civilization.getInstance().getGame().getNotificationHanlder()
					.fireNotification(new AvailableMovementNotification(unit));
		}
	}

	@Override
	public void onSetCityHealth(SetCityHealthPacket packet) {
		// FIXME: Iterating through players to find the city seems silly
		for (AbstractPlayer player : players.values()) {
			City city = player.getCityFromName(packet.getCityName());
			if (city != null) {

				// FIXME: Should be a better way to implement this
				if (packet.getMaxHealth() != -1 && packet.getCombatStrength() != -1) {
					// city.setCombatStrength(packet.getCombatStrength());
					city.setMaxHealth(packet.getMaxHealth());
				}

				city.setHealth(packet.getHealth());
			}
		}
	}

	@Override
	public void onSetCityOwner(SetCityOwnerPacket packet) {
		// FIXME: Iterating through players to find the city seems silly
		for (AbstractPlayer player : players.values()) {
			City city = player.getCityFromName(packet.getCityName());
			if (city != null) {

				AbstractPlayer newPlayer = players.get(packet.getPlayerName());

				city.getProducibleItemManager().getItemQueue().clear();
				city.setOwner(newPlayer);
				player.removeCity(city);
				newPlayer.addCity(city);

				// Toggle new windows for the player that captured the city.
				// FIXME: Move this to notification handler
				if (newPlayer.equals(this.player) && newPlayer.getOwnedCities().size() <= 1) {

					if (!Civilization.getInstance().getWindowManager().isOpenWindow(CurrentResearchWindow.class))
						Civilization.getInstance().getWindowManager().toggleWindow(new CurrentResearchWindow());

					if (!Civilization.getInstance().getWindowManager().isOpenWindow(CurrentHeritageWindow.class))
						Civilization.getInstance().getWindowManager().toggleWindow(new CurrentHeritageWindow());

					if (!newPlayer.getResearchTree().isResearching())
						Civilization.getInstance().getGame().getNotificationHanlder()
								.fireNotification(new NotResearchingNotification());

					if (!newPlayer.getHeritageTree().isStudying())
						Civilization.getInstance().getGame().getNotificationHanlder()
								.fireNotification(new NotStudyingNotification());

					if (city.getProducibleItemManager().getCurrentProducingItem() == null)
						Civilization.getInstance().getGame().getNotificationHanlder()
								.fireNotification(new AvailableProductionNotification(city));
				}

				// Remove windows for the target player, if they have no cities left.
				if (player.equals(this.player) && player.getOwnedCities().size() < 1) {
					Civilization.getInstance().getWindowManager().toggleWindow(new CurrentResearchWindow());
					Civilization.getInstance().getWindowManager().toggleWindow(new CurrentHeritageWindow());
				}
			}
		}
	}

	@Override
	public void onSetUnitHealth(SetUnitHealthPacket packet) {
		Unit unit = map.getTiles()[packet.getTileGridX()][packet.getTileGridY()].getUnitFromID(packet.getUnitID());
		unit.setHealth(packet.getHealth());
		unit.flashColor(Color.GREEN);
	}

	public void endTurn() {
		EndTurnPacket packet = new EndTurnPacket();
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

	public void requestEndTurn() {
		RequestEndTurnPacket packet = new RequestEndTurnPacket();
		Civilization.getInstance().getNetworkManager().sendPacket(packet);
	}

	public void cancelEndTurn() {

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

	public ArrayList<City> getCities() {
		ArrayList<City> cities = new ArrayList<>();
		for (AbstractPlayer player : players.values())
			cities.addAll(player.getOwnedCities());

		return cities;
	}

	public NotificationHandler getNotificationHanlder() {
		return notificationHandler;
	}

	public HashMap<String, AbstractPlayer> getPlayers() {
		return players;
	}

	public GameWonders getWonders() {
		return gameWonders;
	}
}
