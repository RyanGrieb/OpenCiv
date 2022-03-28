package me.rhin.openciv.game.religion.bonus;

import java.util.ArrayList;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.game.player.AbstractPlayer;
import me.rhin.openciv.game.religion.bonus.type.follower.PagodasBonus;
import me.rhin.openciv.game.religion.bonus.type.follower.SwordsIntoPlowsharesBonus;
import me.rhin.openciv.game.religion.bonus.type.founder.ChurchPropertyBonus;
import me.rhin.openciv.game.religion.bonus.type.founder.TitheBonus;
import me.rhin.openciv.game.religion.bonus.type.founder.WorldChurchBonus;
import me.rhin.openciv.game.religion.bonus.type.pantheon.DesertFolkloreBonus;
import me.rhin.openciv.game.religion.bonus.type.pantheon.GodOfTheOpenSkyBonus;
import me.rhin.openciv.game.religion.bonus.type.pantheon.GodOfTheSeaBonus;
import me.rhin.openciv.game.religion.bonus.type.pantheon.MonumentToTheGodsBonus;
import me.rhin.openciv.game.religion.bonus.type.pantheon.ReligiousIdolsBonus;
import me.rhin.openciv.game.religion.bonus.type.pantheon.TearsOfTheGodsBonus;
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

		Civilization.getInstance().getEventManager().addListener(this);
	}

	@EventHandler
	public void onPickPantheon(PickPantheonPacket packet) {
		AbstractPlayer player = Civilization.getInstance().getGame().getPlayers().get(packet.getPlayerName());
		pantheons.get(packet.getReligionBonusID()).setPlayer(player);
	}

	@EventHandler
	public void onFoundReligion(FoundReligionPacket packet) {
		AbstractPlayer player = Civilization.getInstance().getGame().getPlayers().get(packet.getPlayerName());
		founderBeliefs.get(packet.getFounderID()).setPlayer(player);
		followerBeliefs.get(packet.getFollowerID()).setPlayer(player);
	}

	public ArrayList<ReligionBonus> getAvailablePantheons() {
		ArrayList<ReligionBonus> availablePantheons = new ArrayList<ReligionBonus>();

		for (ReligionBonus bonus : pantheons)
			if (bonus.getPlayer() == null)
				availablePantheons.add(bonus);

		return availablePantheons;
	}

	public ArrayList<ReligionBonus> getAvailableFounderBeliefs() {
		ArrayList<ReligionBonus> availableFounderBeliefs = new ArrayList<ReligionBonus>();

		for (ReligionBonus bonus : founderBeliefs)
			if (bonus.getPlayer() == null)
				availableFounderBeliefs.add(bonus);

		return availableFounderBeliefs;
	}

	public ArrayList<ReligionBonus> getAvailableFollowerBeliefs() {
		ArrayList<ReligionBonus> availableFollowerBeliefs = new ArrayList<ReligionBonus>();

		for (ReligionBonus bonus : followerBeliefs)
			if (bonus.getPlayer() == null)
				availableFollowerBeliefs.add(bonus);

		return availableFollowerBeliefs;
	}

	public ReligionBonus getPantheonFromID(int pantheonID) {
		return pantheons.get(pantheonID);
	}

	public ReligionBonus getFounderBeliefFromID(int founderID) {
		return founderBeliefs.get(founderID);
	}

	public ReligionBonus getFollowerBeliefFromID(int followerID) {
		return followerBeliefs.get(followerID);
	}
}
