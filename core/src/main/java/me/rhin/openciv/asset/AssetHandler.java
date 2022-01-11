package me.rhin.openciv.asset;

import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.assets.loaders.BitmapFontLoader;
import com.badlogic.gdx.assets.loaders.SkinLoader;
import com.badlogic.gdx.audio.Music;
import com.badlogic.gdx.audio.Sound;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.TextureAtlas;
import com.badlogic.gdx.scenes.scene2d.ui.Skin;

import me.rhin.openciv.Civilization;

public class AssetHandler extends AssetManager {

	public AssetHandler() {
		super();
		load("atlas/tile.atlas", TextureAtlas.class);
		load("atlas/ui.atlas", TextureAtlas.class);
		load("atlas/unit.atlas", TextureAtlas.class);
		load("atlas/icon.atlas", TextureAtlas.class);
		load("atlas/building.atlas", TextureAtlas.class);
		load("atlas/road.atlas", TextureAtlas.class);
		load("skin/skin.atlas", TextureAtlas.class);
		load("skin/skin.json", Skin.class, new SkinLoader.SkinParameter("skin/skin.atlas"));

		BitmapFontLoader.BitmapFontParameter fontParameter = new BitmapFontLoader.BitmapFontParameter();
		fontParameter.atlasName = "atlas/ui.atlas";
		load("fonts/font.fnt", BitmapFont.class, fontParameter);

		for (SoundEnum soundEnum : SoundEnum.values()) {

			String soundPath = "sound/" + soundEnum.getSoundType().name().toLowerCase() + "/"
					+ soundEnum.name().toLowerCase() + ".ogg";

			switch (soundEnum.getSoundType()) {
			case EFFECT:
				load(soundPath, Sound.class);
				break;
			case AMBIENCE:
			case TITLE_MUSIC:
			case GENERAL_MUSIC:
				load(soundPath, Music.class);
				break;
			}

		}
	}

	@Override
	public synchronized boolean update() {
		boolean isDone = super.update();
		return isDone;
	}
}
