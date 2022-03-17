package me.rhin.openciv.server.game.civilization;

import java.util.ArrayList;
import java.util.Random;

import me.rhin.openciv.server.Server;
import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.Player;
import me.rhin.openciv.server.game.civilization.type.America;
import me.rhin.openciv.server.game.civilization.type.England;
import me.rhin.openciv.server.game.civilization.type.Germany;
import me.rhin.openciv.server.game.civilization.type.Mamluks;
import me.rhin.openciv.server.game.civilization.type.Mongolia;
import me.rhin.openciv.server.game.civilization.type.RandomCivilization;
import me.rhin.openciv.server.game.civilization.type.Rome;

public enum CivType {

	RANDOM {
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new RandomCivilization(player);
		}
	},
	AMERICA {
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new America(player);
		}
	},
	ENGLAND {

		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new England(player);
		}
	},
	GERMANY {

		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new Germany(player);
		}
	},
	ROME {

		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new Rome(player);
		}
	},
	MAMLUKS {

		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new Mamluks(player);
		}
	},
	MONGOLIA {
		
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new Mongolia(player);
		}
	};

	// TODO: Make this code cleaner.
	public static CivType randomCiv() {

		ArrayList<String> availableCivs = new ArrayList<String>();
		for (CivType civType : CivType.values())
			if (civType != CivType.RANDOM)
				availableCivs.add(civType.name());

		for (Player player : Server.getInstance().getPlayers())
			if (player.getCiv() != null && availableCivs.contains(player.getCiv().getName().toUpperCase())) {
				availableCivs.remove(player.getCiv().getName().toUpperCase());
			}

		// If there are no more civs left. Just make them all available.
		if (availableCivs.size() < 1)
			for (CivType civType : CivType.values())
				if (civType != CivType.RANDOM)
					availableCivs.add(civType.name());

		Random rnd = new Random();
		int max = availableCivs.size() - 1;
		int min = 0;
		String civName = availableCivs.get(rnd.nextInt(max - min + 1) + min);
		return CivType.valueOf(civName);
	}

	public abstract Civ getCiv(AbstractPlayer player);

}
