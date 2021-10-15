package me.rhin.openciv.asset;

import com.badlogic.gdx.audio.Music;

import me.rhin.openciv.Civilization;

public enum SoundEnum {

	BACKGROUND_MUSIC_1(0.25F, SoundType.SOUNDTRACK_TITLE),
	SPARTAN_MUSIC(0.25F, SoundType.SOUNDTRACK_TITLE),
	AMBIENCE_1(0.03F, SoundType.AMBIENCE),
	AMBIENCE_2(0.45F, SoundType.AMBIENCE),
	BUTTON_CLICK(0.5F, SoundType.EFFECT),
	CITY_CLICK(0.5F, SoundType.EFFECT),
	UNIT_CLICK(0.2F, SoundType.EFFECT),
	NEXT_TURN(0.3F, SoundType.EFFECT),
	RUIN_CAPTURE(0.3F, SoundType.EFFECT),
	CITY_LOSS(0.3F, SoundType.EFFECT),
	WOOD_CHOP(0.3F, SoundType.EFFECT);

	public enum SoundType {
		AMBIENCE,
		SOUNDTRACK_TITLE,
		SOUNDTRACK_INGAME,
		EFFECT;
	}

	private float volume;
	private SoundType soundType;

	SoundEnum(float v, SoundType soundType) {
		this.volume = v;
		this.soundType = soundType;
	}

	@Deprecated
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

	public SoundType getSoundType() {
		return soundType;
	}

	@Deprecated
	public static Music getSound(SoundEnum soundEnum) {
		return Civilization.getInstance().getAssetHandler().get("sound/" + soundEnum.name().toLowerCase() + ".ogg",
				Music.class);
	}

}
