package me.rhin.openciv.asset;

import com.badlogic.gdx.audio.Music;

import me.rhin.openciv.Civilization;

public enum SoundEnum {

	BUTTON_CLICK(0.5F),
	WIND_AMBIENCE(0.5F),
	CITY_CLICK(0.5F),
	UNIT_CLICK(0.2F),
	NEXT_TURN(0.3F);

	private float volume;

	SoundEnum(float v) {
		this.volume = v;
	}

	public static void playSound(SoundEnum soundEnum) {

		Music sound = Civilization.getInstance().getAssetHandler()
				.get("sound/" + soundEnum.name().toLowerCase() + ".ogg", Music.class);
		sound.setVolume(soundEnum.getVolume());

		sound.play();
		sound.setOnCompletionListener(new Music.OnCompletionListener() {

			@Override
			public void onCompletion(Music music) {
				sound.dispose();
			}
		});
	}

	public float getVolume() {
		return volume;
	}

	public static Music getSound(SoundEnum soundEnum) {
		return Civilization.getInstance().getAssetHandler().get("sound/" + soundEnum.name().toLowerCase() + ".ogg",
				Music.class);
	}

}
