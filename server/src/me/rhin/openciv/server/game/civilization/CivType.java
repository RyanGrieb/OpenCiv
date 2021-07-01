package me.rhin.openciv.server.game.civilization;

import java.util.Random;

import me.rhin.openciv.server.game.map.tile.TileType;

public enum CivType {

	RANDOM {
		@Override
		public TileType getBiasTileType() {
			return null;
		}
	},
	AMERICA {
		@Override
		public TileType getBiasTileType() {
			return null;
		}
	},
	ENGLAND {
		@Override
		public TileType getBiasTileType() {
			return TileType.SHALLOW_OCEAN;
		}
	},
	GERMANY {
		@Override
		public TileType getBiasTileType() {
			return null;
		}
	},
	ROME {
		@Override
		public TileType getBiasTileType() {
			return null;
		}
	};

	public static CivType randomCiv() {
		Random rnd = new Random();
		int max = CivType.values().length - 1;
		int min = 1;
		// CivType civType = CivType.values()[rnd.nextInt(max - min + 1) + min];
		CivType civType = CivType.values()[rnd.nextInt(CivType.values().length - 1) + 1];
		return civType;
	}

	public abstract TileType getBiasTileType();

}
