package me.rhin.openciv.game.religion;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.religion.bonus.ReligionBonusType;
import me.rhin.openciv.listener.PickPantheonListener;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;

public class PlayerReligion implements PickPantheonListener {

	private AbstractPlayer player;
	private ArrayList<ReligionBonusType> pickedBonuses;

	public PlayerReligion(AbstractPlayer player) {
		this.player = player;
		this.pickedBonuses = new ArrayList<>();
		
		Civilization.getInstance().getEventManager().addListener(PickPantheonListener.class, this);
	}

	public ArrayList<ReligionBonusType> getPickedBonuses() {
		return pickedBonuses;
	}

	@Override
	public void onPickPantheon(PickPantheonPacket packet) {
		pickedBonuses.add(Civilization.getInstance().getGame().getAvailableReligionBonuses()
				.getPantheonFromID(packet.getReligionBonusID()).getBonusType());
	}

}
