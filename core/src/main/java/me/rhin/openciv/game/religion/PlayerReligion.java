package me.rhin.openciv.game.religion;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum;
import me.rhin.openciv.events.type.ReligionIconChangeEvent;
import me.rhin.openciv.game.city.City;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.religion.bonus.ReligionBonus;
import me.rhin.openciv.game.religion.icon.ReligionIcon;
import me.rhin.openciv.shared.listener.EventHandler;
import me.rhin.openciv.shared.listener.Listener;
import me.rhin.openciv.shared.packet.type.FoundReligionPacket;
import me.rhin.openciv.shared.packet.type.PickPantheonPacket;

public class PlayerReligion implements Listener {

	private AbstractPlayer player;
	private ArrayList<ReligionBonus> pickedBonuses;
	private ReligionIcon religionIcon;

	public PlayerReligion(AbstractPlayer player) {
		this.player = player;
		this.pickedBonuses = new ArrayList<>();

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onPickPantheon(PickPantheonPacket packet) {
		if (!player.getName().equals(packet.getPlayerName()))
			return;

		pickedBonuses.add(Civilization.getInstance().getGame().getAvailableReligionBonuses()
				.getPantheonFromID(packet.getReligionBonusID()));

		religionIcon = ReligionIcon.PANTHEON;

		Civilization.getInstance().getSoundHandler().playEffect(SoundEnum.ANGELIC_SOUND_1);
	}

	@EventHandler
	public void onFoundReligion(FoundReligionPacket packet) {
		if (!player.getName().equals(packet.getPlayerName()))
			return;

		pickedBonuses.add(Civilization.getInstance().getGame().getAvailableReligionBonuses()
				.getFounderBeliefFromID(packet.getFounderID()));
		pickedBonuses.add(Civilization.getInstance().getGame().getAvailableReligionBonuses()
				.getFollowerBeliefFromID(packet.getFollowerID()));

		this.religionIcon = Civilization.getInstance().getGame().getAvailableReligionIcons().getList()
				.get(packet.getIconID());

		Civilization.getInstance().getEventManager().fireEvent(new ReligionIconChangeEvent(this, religionIcon));

		Civilization.getInstance().getSoundHandler().playEffect(SoundEnum.ANGELIC_SOUND_2);
	}

	public ArrayList<ReligionBonus> getPickedBonuses() {
		return pickedBonuses;
	}

	public ArrayList<City> getFollowerCities() {
		ArrayList<City> followerCities = new ArrayList<>();

		for (City city : player.getOwnedCities()) {
			if (city.getCityReligion().getMajorityReligion().equals(this))
				followerCities.add(city);
		}

		return followerCities;
	}

	public AbstractPlayer getPlayer() {
		return player;
	}

	public ReligionIcon getReligionIcon() {
		return religionIcon;
	}

	public boolean hasBonus(Class<? extends ReligionBonus> bonusClass) {
		for (ReligionBonus bonus : pickedBonuses) {
			if (bonus.getClass() == bonusClass)
				return true;
		}

		return false;
	}
}
