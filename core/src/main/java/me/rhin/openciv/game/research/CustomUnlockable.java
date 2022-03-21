package me.rhin.openciv.game.research;

import java.util.Arrays;
import java.util.List;

import me.rhin.openciv.asset.TextureEnum;

public class CustomUnlockable implements Unlockable {

	private String name;
	private TextureEnum texture;
	private List<String> desc;

	public CustomUnlockable(String name, TextureEnum texture, List<String> desc) {
		this.name = name;
		this.texture = texture;
		this.desc = desc;
	}

	@Override
	public String getName() {
		return name;
	}

	@Override
	public List<String> getDesc() {
		return desc;
	}

	@Override
	public TextureEnum getTexture() {
		return texture;
	}

}
