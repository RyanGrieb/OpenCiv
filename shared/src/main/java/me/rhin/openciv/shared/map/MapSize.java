package me.rhin.openciv.shared.map;

public enum MapSize {

	DUEL(40, 24),
	TINY(56, 36),
	SMALL(60, 44),
	STANDARD(80, 52),
	LARGE(104, 64),
	HUGE(128, 80);

	private int width, height;

	MapSize(int mapWidth, int mapHeight) {
		width = mapWidth;
		height = mapHeight;
	}

	public int getWidth() {
		return width;
	}

	public int getHeight() {
		return height;
	}

	public String getName() {
		String name = this.name().toLowerCase();
		name = name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase();

		return name;
	}
}
