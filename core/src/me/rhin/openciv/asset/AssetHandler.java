package me.rhin.openciv.asset;

import com.badlogic.gdx.assets.AssetManager;
import com.badlogic.gdx.assets.loaders.BitmapFontLoader;
import com.badlogic.gdx.assets.loaders.SkinLoader;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.TextureAtlas;
import com.badlogic.gdx.scenes.scene2d.ui.Skin;

public class AssetHandler extends AssetManager {

	public AssetHandler() {
		super();
		load("atlas/tile.atlas", TextureAtlas.class);
		load("atlas/ui.atlas", TextureAtlas.class);
		load("atlas/unit.atlas", TextureAtlas.class);
		load("atlas/icon.atlas", TextureAtlas.class);
		load("atlas/building.atlas", TextureAtlas.class);
		load("skin/uiskin.atlas", TextureAtlas.class);
		load("skin/uiskin.json", Skin.class, new SkinLoader.SkinParameter("skin/uiskin.atlas"));

		BitmapFontLoader.BitmapFontParameter fontParameter = new BitmapFontLoader.BitmapFontParameter();
		fontParameter.atlasName = "atlas/ui.atlas";
		load("fonts/font.fnt", BitmapFont.class, fontParameter);

	}

	@Override
	public boolean update() {
		boolean isDone = super.update();
		if (isDone) {

		}

		return isDone;
	}
}
