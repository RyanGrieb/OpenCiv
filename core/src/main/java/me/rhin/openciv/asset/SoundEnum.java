package me.rhin.openciv.asset;

import com.badlogic.gdx.audio.Music;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.options.OptionType;

public enum SoundEnum {

	TITLE_MUSIC_1(0.45F, SoundType.TITLE_MUSIC),
	TITLE_MUSIC_2(0.45F, SoundType.TITLE_MUSIC),
	ANGELIC_MUSIC(1F, SoundType.GENERAL_MUSIC),
	WILDLANDS_MUSIC(1F, SoundType.GENERAL_MUSIC),
	FANTASY_MOTION_MUSIC(1F, SoundType.GENERAL_MUSIC),
	AMBIENCE_1(0.03F, SoundType.AMBIENCE),
	AMBIENCE_2(0.35F, SoundType.AMBIENCE),
	AMBIENCE_3(0.35F, SoundType.AMBIENCE),
	BUTTON_CLICK(0.5F, SoundType.EFFECT),
	CITY_CLICK(0.5F, SoundType.EFFECT),
	UNIT_CLICK(0.2F, SoundType.EFFECT),
	NEXT_TURN(0.2F, SoundType.EFFECT),
	RUIN_CAPTURE(0.3F, SoundType.EFFECT),
	CITY_LOSS(0.3F, SoundType.EFFECT),
	WOOD_CHOP(0.3F, SoundType.EFFECT),
	UNIT_COMBAT(0.20F, SoundType.EFFECT),
	UNIT_DEATH(0.25F, SoundType.EFFECT),
	CHAT_NOTIFICATION(0.75F, SoundType.EFFECT),
	FARM_TILL(0.35F, SoundType.EFFECT),
	ANGELIC_SOUND_1(0.25F, SoundType.EFFECT),
	ANGELIC_SOUND_2(0.25F, SoundType.EFFECT),
	BUY_ITEM(0.25F,SoundType.EFFECT);

	public enum SoundType {
		TITLE_MUSIC {
			@Override
			public OptionType getOptionType() {
				return OptionType.MUSIC_VOLUME;
			}
		},
		GENERAL_MUSIC {
			@Override
			public OptionType getOptionType() {
				return OptionType.MUSIC_VOLUME;
			}
		},
		AMBIENCE {
			@Override
			public OptionType getOptionType() {
				return OptionType.AMBIENCE_VOLUME;
			}
		},
		EFFECT {
			@Override
			public OptionType getOptionType() {
				return OptionType.EFFECTS_VOLUME;
			}
		};

		public abstract OptionType getOptionType();
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
}
