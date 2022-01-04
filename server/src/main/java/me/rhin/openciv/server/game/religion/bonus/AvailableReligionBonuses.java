package me.rhin.openciv.server.game.religion.bonus;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.religion.bonus.type.PantheonDesertFolklore;
import me.rhin.openciv.server.game.religion.bonus.type.PantheonGodOfTheSea;
import me.rhin.openciv.server.game.religion.bonus.type.PantheonReligiousIdols;
import me.rhin.openciv.server.game.religion.bonus.type.PantheonTearsOfTheGods;
import me.rhin.openciv.server.listener.PickPantheonListener;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;

public class AvailableReligionBonuses implements PickPantheonListener {

	private ArrayList<ReligionBonus> pantheons;

	public AvailableReligionBonuses() {
		this.pantheons = new ArrayList<>();

		pantheons.add(new PantheonGodOfTheSea());
		pantheons.add(new PantheonTearsOfTheGods());
		pantheons.add(new PantheonDesertFolklore());
		pantheons.add(new PantheonReligiousIdols());

		Server.getInstance().getEventManager().addListener(PickPantheonListener.class, this);
	}

	@Override
	public void onPickPantheon(WebSocket conn, PickPantheonPacket packet) {
		pantheons.get(packet.getReligionBonusID()).setPlayer(Server.getInstance().getPlayerByConn(conn));

		Player player = Server.getInstance().getPlayerByConn(conn);
		packet.setPlayerName(player.getName());

		Json json = new Json();
		for (Player otherPlayer : Server.getInstance().getPlayers()) {
			otherPlayer.sendPacket(json.toJson(packet));
		}
	}

	public boolean availablePantheons() {

		for (ReligionBonus bonus : pantheons)
			if (bonus.getPlayer() == null)
				return true;

		return false;
	}

	public ArrayList<ReligionBonus> getPantheons() {
		return pantheons;
	}

}
