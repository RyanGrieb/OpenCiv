package me.rhin.openciv.game.religion.bonus;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.religion.bonus.ReligionBonusType.ReligionProperty;
import me.rhin.openciv.listener.PickPantheonListener;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;

public class AvailableReligionBonuses implements PickPantheonListener {

	private ArrayList<ReligionBonus> pantheons;
	private ArrayList<ReligionBonus> founderBeliefs;
	private ArrayList<ReligionBonus> followerBeliefs;

	public AvailableReligionBonuses() {
		this.pantheons = new ArrayList<>();

		for (ReligionBonusType type : ReligionBonusType.values()) {
			if (type.getProperty() == ReligionProperty.PANTHEON)
				pantheons.add(new ReligionBonus(type));
		}

		Civilization.getInstance().getEventManager().addListener(PickPantheonListener.class, this);
	}

	@Override
	public void onPickPantheon(PickPantheonPacket packet) {
		AbstractPlayer player = Civilization.getInstance().getGame().getPlayers().get(packet.getPlayerName());
		pantheons.get(packet.getReligionBonusID()).setPlayer(player);
	}

	public ArrayList<ReligionBonus> getAvailablePantheons() {
		ArrayList<ReligionBonus> availablePantheons = new ArrayList<ReligionBonus>();

		for (ReligionBonus bonus : pantheons)
			if (bonus.getPlayer() == null)
				availablePantheons.add(bonus);

		return availablePantheons;
	}

	public ReligionBonus getPantheonFromID(int pantheonID) {
		return pantheons.get(pantheonID);
	}

}
