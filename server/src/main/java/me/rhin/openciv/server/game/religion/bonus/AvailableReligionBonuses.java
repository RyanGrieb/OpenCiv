package me.rhin.openciv.server.game.religion.bonus;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.religion.bonus.type.follower.PagodasBonus;
import me.rhin.openciv.server.game.religion.bonus.type.follower.SwordsIntoPlowsharesBonus;
import me.rhin.openciv.server.game.religion.bonus.type.founder.ChurchPropertyBonus;
import me.rhin.openciv.server.game.religion.bonus.type.founder.TitheBonus;
import me.rhin.openciv.server.game.religion.bonus.type.founder.WorldChurchBonus;
import me.rhin.openciv.server.game.religion.bonus.type.pantheon.DesertFolkloreBonus;
import me.rhin.openciv.server.game.religion.bonus.type.pantheon.GodOfTheOpenSkyBonus;
import me.rhin.openciv.server.game.religion.bonus.type.pantheon.GodOfTheSeaBonus;
import me.rhin.openciv.server.game.religion.bonus.type.pantheon.MonumentToTheGodsBonus;
import me.rhin.openciv.server.game.religion.bonus.type.pantheon.ReligiousIdolsBonus;
import me.rhin.openciv.server.game.religion.bonus.type.pantheon.TearsOfTheGodsBonus;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.FoundReligionPacket;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;

public class AvailableReligionBonuses implements Listener {

	private ArrayList<ReligionBonus> pantheons;
	private ArrayList<ReligionBonus> founderBeliefs;
	private ArrayList<ReligionBonus> followerBeliefs;

	public AvailableReligionBonuses() {
		this.pantheons = new ArrayList<>();
		this.founderBeliefs = new ArrayList<>();
		this.followerBeliefs = new ArrayList<>();

		pantheons.add(new GodOfTheSeaBonus());
		pantheons.add(new TearsOfTheGodsBonus());
		pantheons.add(new DesertFolkloreBonus());
		pantheons.add(new ReligiousIdolsBonus());
		pantheons.add(new GodOfTheOpenSkyBonus());
		pantheons.add(new MonumentToTheGodsBonus());

		founderBeliefs.add(new ChurchPropertyBonus());
		founderBeliefs.add(new TitheBonus());
		founderBeliefs.add(new WorldChurchBonus());

		followerBeliefs.add(new PagodasBonus());
		followerBeliefs.add(new SwordsIntoPlowsharesBonus());

		Server.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onPickPantheon(WebSocket conn, PickPantheonPacket packet) {

		Player player = Server.getInstance().getPlayerByConn(conn);

		pantheons.get(packet.getReligionBonusID()).setPlayer(player);

		packet.setPlayerName(player.getName());

		Json json = new Json();
		for (Player otherPlayer : Server.getInstance().getPlayers()) {
			otherPlayer.sendPacket(json.toJson(packet));
		}

		player.getCapitalCity().getCityReligion().addFollowers(player.getReligion(), 1);
		player.getCapitalCity().getCityReligion().sendFollowerUpdatePacket();

		pantheons.get(packet.getReligionBonusID()).onAssigned();
	}

	@EventHandler
	public void onFoundReligion(WebSocket conn, FoundReligionPacket packet) {

		Player player = Server.getInstance().getPlayerByConn(conn);

		founderBeliefs.get(packet.getFounderID()).setPlayer(player);
		followerBeliefs.get(packet.getFollowerID()).setPlayer(player);

		packet.setPlayerName(player.getName());

		Json json = new Json();
		for (Player otherPlayer : Server.getInstance().getPlayers()) {
			otherPlayer.sendPacket(json.toJson(packet));
		}

		// FIXME: Add 1 follower to the city where the prophet founded the religion
		// player.getCapitalCity().getCityReligion().setFollowers(player.getReligion(),
		// 2);

		founderBeliefs.get(packet.getFounderID()).onAssigned();
		followerBeliefs.get(packet.getFollowerID()).onAssigned();
	}

	public boolean availablePantheons() {

		for (ReligionBonus bonus : pantheons)
			if (bonus.getPlayer() == null)
				return true;

		return false;
	}

	public ArrayList<ReligionBonus> getFounderBeliefs() {
		return founderBeliefs;
	}

	public ArrayList<ReligionBonus> getFollowerBeliefs() {
		return followerBeliefs;
	}

	public ArrayList<ReligionBonus> getPantheons() {
		return pantheons;
	}
}
