package me.rhin.openciv.server.game.religion;

import java.util.ArrayList;

import org.java_websocket.WebSocket;

import com.badlogic.gdx.utils.Json;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.server.listener.NextTurnListener;
import me.rhin.openciv.server.listener.PickPantheonListener;
import me.rhin.openciv.shared.packet.type.AvailablePantheonPacket;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;
import me.rhin.openciv.shared.stat.Stat;

public class PlayerReligion implements NextTurnListener, PickPantheonListener {

	private AbstractPlayer player;
	private ArrayList<ReligionBonus> pickedBonuses;

	public PlayerReligion(AbstractPlayer player) {
		this.player = player;
		this.pickedBonuses = new ArrayList<>();

		Server.getInstance().getEventManager().addListener(NextTurnListener.class, this);
		Server.getInstance().getEventManager().addListener(PickPantheonListener.class, this);
	}

	@Override
	public void onNextTurn() {
		// Choose bonus at 10 faith - NOTE: Were behind the statLine update here.

		Json json = new Json();

		if (Server.getInstance().getInGameState().getAvailableReligionBonuses().availablePantheons()
				&& player.getStatLine().getStatValue(Stat.FAITH) > 8 && pickedBonuses.size() < 1
				&& player instanceof Player) {

			AvailablePantheonPacket packet = new AvailablePantheonPacket();
			player.sendPacket(json.toJson(packet));
		}
	}

	@Override
	public void onPickPantheon(WebSocket conn, PickPantheonPacket packet) {
		pickedBonuses.add(Server.getInstance().getInGameState().getAvailableReligionBonuses().getPantheons()
				.get(packet.getReligionBonusID()));
	}

	public ArrayList<ReligionBonus> getPickedBonuses() {
		return pickedBonuses;
	}

}
