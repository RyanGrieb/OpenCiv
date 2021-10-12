package me.rhin.openciv.server.game.civilization;

import java.util.Random;

import me.rhin.openciv.server.game.AbstractPlayer;
import me.rhin.openciv.server.game.civilization.type.America;
import me.rhin.openciv.server.game.civilization.type.Barbarians;
import me.rhin.openciv.server.game.civilization.type.England;
import me.rhin.openciv.server.game.civilization.type.Germany;
import me.rhin.openciv.server.game.civilization.type.Rome;

public enum CivType {

	RANDOM {

		@Override
		public Civ getCiv(AbstractPlayer player) {
			Random rnd = new Random();
			return CivType.values()[rnd.nextInt(CivType.values().length)].getCiv(player);
		}
	},
	BARBARIANS {
		@Override
		public Civ getCiv(AbstractPlayer player) {
			return new Barbarians(player);
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
	};

	public static CivType randomCiv() {
		Random rnd = new Random();
		int max = CivType.values().length - 1;
		int min = 2;
		CivType civType = CivType.values()[rnd.nextInt(max - min + 1) + min];
		// CivType civType = CivType.values()[rnd.nextInt(CivType.values().length - 1) +
		// 1];
		return civType;
	}

	public abstract Civ getCiv(AbstractPlayer player);

}
