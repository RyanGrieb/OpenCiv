package me.rhin.openciv.asset.sound;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Random;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.audio.Music;

import me.rhin.openciv.Civilization;
import me.rhin.openciv.asset.SoundEnum;
import me.rhin.openciv.asset.SoundEnum.SoundType;
import me.rhin.openciv.listener.SetScreenListener;
import me.rhin.openciv.ui.screen.ScreenEnum;

//TODO: Not sure if I should be using this
public class SoundHandler implements SetScreenListener {

	private ArrayList<Music> ambienceTracks;
	private ArrayList<Music> titleMusicTacks;
	private ArrayList<Music> inGameMusicTacks;

	private HashMap<SoundEnum, Music> soundMap;
	private Music currentMusic;
	private Music currentAmbience;

	public SoundHandler() {
		this.soundMap = new HashMap<>();
		this.ambienceTracks = new ArrayList<>();
		this.titleMusicTacks = new ArrayList<>();

		// Civilization.getInstance().getEventManager().addListener(SetScreenListener.class,
		// this);
	}

	@Override
	public void onSetScreen(ScreenEnum prevScreenEnum, ScreenEnum screenEnum) {

		if (prevScreenEnum == ScreenEnum.SERVER_LOBBY && screenEnum == ScreenEnum.IN_GAME) {
			// Stop playing titlescreen music
			currentMusic.stop();
			// currentMusic.dispose();
			currentMusic = null;
		}

		if (screenEnum == ScreenEnum.TITLE && prevScreenEnum == ScreenEnum.IN_GAME) {
			// Stop playing ambient music & ingame music

			currentAmbience.stop();

			if (currentMusic != null)
				currentMusic.stop();
			// currentMusic.dispose();
			currentMusic = null;
			currentAmbience = null;
		}
	}

	public void loadSounds() {
		for (SoundEnum soundEnum : SoundEnum.values()) {

		
			Music sound = Civilization.getInstance().getAssetHandler()
					.get("sound/" + soundEnum.name().toLowerCase() + "ogg", Music.class);
			sound.setVolume(soundEnum.getVolume());

			soundMap.put(soundEnum, sound);

			if (soundEnum.getSoundType() == SoundType.AMBIENCE)
				ambienceTracks.add(sound);

			if (soundEnum.getSoundType() == SoundType.SOUNDTRACK_TITLE)
				titleMusicTacks.add(sound);

			if (soundEnum.getSoundType() == SoundType.SOUNDTRACK_INGAME)
				inGameMusicTacks.add(sound);

		}
	}

	public void playSound(SoundEnum soundEnum) {

		Music sound = soundMap.get(soundEnum);

		//FIXME, use this: https://libgdx.badlogicgames.com/ci/nightlies/docs/api/com/badlogic/gdx/audio/Sound.html
		//For short audio clips.
		
		if (sound.isPlaying())
			sound.stop();

		//sound.play();
	}

	/**
	 * Plays a random ambience soundtrack
	 */
	public void playTrackBySoundtype(SoundType soundType) {

		if (currentAmbience != null)
			currentAmbience.stop();

		if (currentMusic != null)
			currentMusic.stop();

		ArrayList<Music> musicTrack = null;
		switch (soundType) {
		case AMBIENCE:
			musicTrack = ambienceTracks;
			break;
		case SOUNDTRACK_TITLE:
			musicTrack = titleMusicTacks;
			break;

		case SOUNDTRACK_INGAME:
			musicTrack = inGameMusicTacks;
			break;
		default:
			break;
		}

		Random rnd = new Random();

		Music rndSound = musicTrack.get(rnd.nextInt(musicTrack.size()));
		//rndSound.play();

		if (soundType == SoundType.AMBIENCE)
			currentAmbience = rndSound;
		else
			currentMusic = rndSound;

		rndSound.setOnCompletionListener(new Music.OnCompletionListener() {
			@Override
			public void onCompletion(Music music) {
				playTrackBySoundtype(soundType);
			}
		});
	}
}
