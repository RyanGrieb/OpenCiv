package me.rhin.openciv.asset.sound;

import java.util.HashMap;

import com.badlogic.gdx.audio.Music;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum;

//TODO: Not sure if I should be using this
public class SoundHandler {

	private HashMap<SoundEnum, Music> soundMap;

	public SoundHandler() {
		this.soundMap = new HashMap<>();
	}

	public void loadSounds() {
		for (SoundEnum soundEnum : SoundEnum.values()) {

			Music sound = Civilization.getInstance().getAssetHandler()
					.get("sound/" + soundEnum.name().toLowerCase() + ".ogg", Music.class);
			sound.setVolume(soundEnum.getVolume());

			soundMap.put(soundEnum, sound);
		}
	}

	public void playSound1(SoundEnum soundEnum) {
		soundMap.get(soundEnum).play();
	}
}
