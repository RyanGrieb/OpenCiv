package me.rhin.openciv.game.research;

import me.rhin.openciv.asset.TextureEnum;

public class CustomUnlockable implements Unlockable {

	private String name;
	private TextureEnum texture;
	private String desc;

	public CustomUnlockable(String name, TextureEnum texture, String desc) {
		this.name = name;
		this.texture = texture;
		this.desc = desc;
	}

	@Override
	public String getName() {
		return name;
	}

	@Override
	public String getDesc() {
		return desc;
	}

	@Override
	public TextureEnum getTexture() {
		return texture;
	}

}
