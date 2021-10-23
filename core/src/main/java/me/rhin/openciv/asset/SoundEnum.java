package me.rhin.openciv.asset;

import com.badlogic.gdx.audio.Music;

import me.rhin.openciv.Civilization;

public enum SoundEnum {

	TITLE_MUSIC_1(0.25F, SoundType.MUSIC),
	TITLE_MUSIC_2(0.25F, SoundType.MUSIC),
	AMBIENCE_1(0.03F, SoundType.AMBIENCE),
	AMBIENCE_2(0.35F, SoundType.AMBIENCE),
	BUTTON_CLICK(0.5F, SoundType.EFFECT),
	CITY_CLICK(0.5F, SoundType.EFFECT),
	UNIT_CLICK(0.2F, SoundType.EFFECT),
	NEXT_TURN(0.3F, SoundType.EFFECT),
	RUIN_CAPTURE(0.3F, SoundType.EFFECT),
	CITY_LOSS(0.3F, SoundType.EFFECT),
	WOOD_CHOP(0.3F, SoundType.EFFECT),
	UNIT_COMBAT(0.20F, SoundType.EFFECT),
	UNIT_DEATH(0.25F, SoundType.EFFECT);

	public enum SoundType {
		MUSIC,
		AMBIENCE,
		EFFECT;
	}

	private float volume;
	private SoundType soundType;

	SoundEnum(float v, SoundType soundType) {
		this.volume = v;
		this.soundType = soundType;
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
