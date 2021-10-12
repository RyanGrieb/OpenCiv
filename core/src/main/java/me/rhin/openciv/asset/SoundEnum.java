package me.rhin.openciv.asset;

import com.badlogic.gdx.audio.Music;

import me.rhin.openciv.Civilization;

public enum SoundEnum {

	BUTTON_CLICK(0.5F),
	WIND_AMBIENCE(0.5F),
	CITY_CLICK(0.5F),
	UNIT_CLICK(0.2F);

	SoundEnum(float volume) {
	}

	public static void playSound(SoundEnum soundEnum) {
		Music sound = Civilization.getInstance().getAssetHandler()
				.get("sound/" + soundEnum.name().toLowerCase() + ".ogg", Music.class);
		sound.setVolume(0.35F);
		sound.play();
	}

	public static Music getSound(SoundEnum soundEnum) {
		return Civilization.getInstance().getAssetHandler().get("sound/" + soundEnum.name().toLowerCase() + ".ogg",
				Music.class);
	}

}
