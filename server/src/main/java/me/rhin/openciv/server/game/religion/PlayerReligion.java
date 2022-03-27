package me.rhin.openciv.server.game.religion;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.city.City;
import me.rhin.openciv.server.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.server.game.religion.icon.ReligionIcon;
import me.rhin.openciv.server.game.unit.DeleteUnitOptions;
import me.rhin.openciv.server.game.unit.Unit;
import me.rhin.openciv.server.game.unit.type.Prophet.ProphetUnit;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.AddUnitPacket;
import me.rhin.openciv.shared.packet.type.AvailablePantheonPacket;
import me.rhin.openciv.shared.packet.type.FoundReligionPacket;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;
import me.rhin.openciv.shared.stat.Stat;
import me.rhin.openciv.shared.stat.StatLine;

public class PlayerReligion implements Listener {

	private static int chosenPantheons;

	private AbstractPlayer player;
	private ArrayList<ReligionBonus> pickedBonuses;
	private ReligionIcon religionIcon;
	private StatLine statLine;

	public PlayerReligion(AbstractPlayer player) {
		this.player = player;
		this.pickedBonuses = new ArrayList<>();
		this.statLine = new StatLine();

		Server.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onNextTurn() {
		// Choose bonus at 10 faith - NOTE: Were behind the statLine update here.

		Json json = new Json();

		if (chosenPantheons < 8
				&& Server.getInstance().getInGameState().getAvailableReligionBonuses().availablePantheons()
				&& player.getStatLine().getStatValue(Stat.FAITH) > 8 && pickedBonuses.size() < 1
				&& player instanceof Player) {

			AvailablePantheonPacket packet = new AvailablePantheonPacket();
			player.sendPacket(json.toJson(packet));

			chosenPantheons++;
		}

		// FIXME: Limit the number of religions to be founded
		if (!player.hasUnitOfType(ProphetUnit.class) && player.getStatLine().getStatValue(Stat.FAITH) > 175 // 13
				&& pickedBonuses.size() == 1 && player instanceof Player) {

			ProphetUnit unit = new ProphetUnit(player, player.getCapitalCity().getOriginTile());

			player.getCapitalCity().getOriginTile().addUnit(unit);

			AddUnitPacket addUnitPacket = new AddUnitPacket();
			addUnitPacket.setUnit(unit.getPlayerOwner().getName(), unit.getName(), unit.getID(),
					unit.getStandingTile().getGridX(), unit.getStandingTile().getGridY());

			for (Player player : Server.getInstance().getPlayers())
				player.sendPacket(json.toJson(addUnitPacket));
		}
	}

	@EventHandler
	public void onPickPantheon(WebSocket conn, PickPantheonPacket packet) {
		Player player = Server.getInstance().getPlayerByConn(conn);

		if (!player.equals(this.player))
			return;

		this.religionIcon = ReligionIcon.PANTHEON;
		pickedBonuses.add(Server.getInstance().getInGameState().getAvailableReligionBonuses().getPantheons()
				.get(packet.getReligionBonusID()));
	}

	@EventHandler
	public void onFoundReligion(WebSocket conn, FoundReligionPacket packet) {
		Player player = Server.getInstance().getPlayerByConn(conn);

		if (!player.equals(this.player))
			return;

		ReligionBonus founderBonus = Server.getInstance().getInGameState().getAvailableReligionBonuses()
				.getFounderBeliefs().get(packet.getFounderID());

		ReligionBonus followerBonus = Server.getInstance().getInGameState().getAvailableReligionBonuses()
				.getFollowerBeliefs().get(packet.getFollowerID());

		ReligionIcon religionIcon = Server.getInstance().getInGameState().getAvailableReligionIcons()
				.getByID(packet.getIconID());

		this.religionIcon = religionIcon;
		pickedBonuses.add(founderBonus);
		pickedBonuses.add(followerBonus);

		Unit unit = Server.getInstance().getMap().getTiles()[packet.getGridX()][packet.getGridY()]
				.getUnitFromID(packet.getUnitID());
		unit.deleteUnit(DeleteUnitOptions.SERVER_DELETE);

		player.getStatLine().subValue(Stat.FAITH, 175);
		player.updateOwnedStatlines(false);
	}

	public ArrayList<ReligionBonus> getPickedBonuses() {
		return pickedBonuses;
	}

	public ArrayList<City> getFollowerCities() {
		ArrayList<City> followerCities = new ArrayList<>();

		for (City city : player.getOwnedCities()) {

			if (city.getCityReligion().getMajorityReligion() == null)
				continue;

			if (city.getCityReligion().getMajorityReligion().equals(this))
				followerCities.add(city);
		}

		return followerCities;
	}

	public AbstractPlayer getPlayer() {
		return player;
	}

	public StatLine getStatLine() {
		return statLine;
	}

	public boolean hasBonus(Class<? extends ReligionBonus> bonusClass) {
		for (ReligionBonus bonus : pickedBonuses) {
			if (bonus.getClass() == bonusClass)
				return true;
		}

		return false;
	}

	public ReligionIcon getReligionIcon() {
		return religionIcon;
	}
}
