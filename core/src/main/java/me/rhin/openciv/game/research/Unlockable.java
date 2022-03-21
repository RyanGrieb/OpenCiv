package me.rhin.openciv.game.research;

import java.util.List;

import me.rhin.openciv.asset.TextureEnum;

public interface Unlockable {

	public String getName();

	public List<String> getDesc();

	public TextureEnum getTexture();
}
