package me.rhin.openciv.server.game;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.civilization.type.RandomCivilization;
import me.rhin.openciv.server.game.unit.TraderUnit;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Caravan.CaravanUnit;
import me.rhin.openciv.server.listener.ChooseHeritageListener;
import me.rhin.openciv.server.listener.ChooseTechListener;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.server.listener.TradeCityListener;
import me.rhin.openciv.shared.packet.type.ChooseHeritagePacket;
import me.rhin.openciv.shared.packet.type.ChooseTechPacket;
import me.rhin.openciv.shared.packet.type.PlayerStatUpdatePacket;
import me.rhin.openciv.shared.packet.type.TradeCityPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;
import me.rhin.openciv.shared.stat.StatType;

public class Player extends AbstractPlayer
		implements NextTurnListener, ChooseTechListener, ChooseHeritageListener, TradeCityListener {

	private WebSocket conn;
	private String name;

	private Unit selectedUnit;
	private boolean loaded;
	private boolean host;
	private boolean turnDone;

	public Player(WebSocket conn) {
		this.conn = conn;
		this.name = "Player" + Server.getInstance().getPlayerIndex();
		this.civilization = new RandomCivilization(this);
		this.loaded = false;

		this.host = false;

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().addListener(ChooseTechListener.class, this);
		Server.getInstance().getEventManager().addListener(ChooseHeritageListener.class, this);
		Server.getInstance().getEventManager().addListener(TradeCityListener.class, this);
	}

	@Override
	public void onNextTurn() {
		if (ownedCities.size() < 1)
			return;

		updateOwnedStatlines(true);
	}

	// FIXME: Move to researchTree
	@Override
	public void onChooseTech(WebSocket conn, ChooseTechPacket packet) {
		if (!conn.equals(this.conn))
			return;

		// FIXME: Check if the player is able to research that tech. (Prevent cheating).
		researchTree.chooseTech(packet.getTechID());
	}

	@Override
	public void onChooseHeritage(WebSocket conn, ChooseHeritagePacket packet) {
		if (!conn.equals(this.conn))
			return;

		heritageTree.studyHeritage(packet.getName());
	}

	@Override
	public void onTradeCity(WebSocket conn, TradeCityPacket packet) {
		if (!conn.equals(this.conn))
			return;

		Unit unit = Server.getInstance().getMap().getTiles()[packet.getUnitGridX()][packet.getUnitGridY()]
				.getUnitFromID(packet.getUnitID());

		City city = null;

		for (AbstractPlayer player : Server.getInstance().getAbstractPlayers())
			for (City playerCity : player.getOwnedCities())
				if (playerCity.getName().equals(packet.getCityName())) {
					city = playerCity;
				}

		if (!(unit instanceof TraderUnit) || city == null)
			return;

		System.out.println("Attempting to trade w/ city: " + city.getName());
		TraderUnit traderUnit = (TraderUnit) unit;
		traderUnit.setTradingCity(city);
		traderUnit.setCityHeadquarters(unit.getStandingTile().getCity());
		traderUnit.trade();
	}

	@Override
	public void updateOwnedStatlines(boolean increaseValues) {

		super.updateOwnedStatlines(increaseValues);
		
		PlayerStatUpdatePacket packet = new PlayerStatUpdatePacket();
		for (Stat stat : statLine.getStatValues().keySet()) {
			if (stat.getStatType() != StatType.CITY_EXCLUSIVE)
				packet.addStat(stat.name(), this.statLine.getStatValues().get(stat).getValue());
		}

		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	public void mergeStatLine(StatLine statLine) {
		this.statLine.mergeStatLine(statLine);

		sendStatUpdatePacket();
	}

	@Override
	public void reduceStatLine(StatLine statLine) {
		super.reduceStatLine(statLine);

		sendStatUpdatePacket();
	}

	@Override
	public void sendPacket(String json) {
		conn.send(json);
	}

	@Override
	public boolean hasConnection() {
		return !conn.isClosed() && !conn.isClosing();
	}

	public void sendStatUpdatePacket() {
		PlayerStatUpdatePacket packet = new PlayerStatUpdatePacket();
		for (Stat stat : this.statLine.getStatValues().keySet()) {
			packet.addStat(stat.name(), this.statLine.getStatValues().get(stat).getValue());
		}
		Json json = new Json();
		conn.send(json.toJson(packet));
	}

	public void setSelectedUnit(Unit selectedUnit) {
		if (this.selectedUnit != null)
			this.selectedUnit.setSelected(false);
		this.selectedUnit = selectedUnit;
	}

	public String getName() {
		return name;
	}

	public void finishLoading() {
		this.loaded = true;

		heritageTree.initHeritage();
		civilization.initHeritage();
	}

	public boolean isLoaded() {
		return loaded;
	}

	public void setHost() {
		this.host = true;
	}

	public boolean isHost() {
		return host;
	}

	public void setTurnDone(boolean turnDone) {
		this.turnDone = turnDone;
	}

	public boolean isTurnDone() {
		return turnDone;
	}

	public WebSocket getConn() {
		return conn;
	}
}
